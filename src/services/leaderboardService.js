import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { LeetCodeAPI } from "./leetcodeAPI";

// Point constants
export const POINTS = {
  EASY: 25,
  MEDIUM: 50,
  HARD: 100,
  STREAK_BONUS: 10,
};

// Helper to batch API requests with rate limiting
async function batchRequests(items, batchSize, fn) {
  let results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results = [...results, ...batchResults];
    // Delay between batches to respect rate limits
    if (i + batchSize < items.length)
      await new Promise((r) => setTimeout(r, 1500));
  }
  return results;
}

/**
 * Calculate streak from LeetCode calendar data
 * @param {Object} calendarData - Submission calendar from LeetCode API
 * @returns {Object} { currentStreak, longestStreak }
 */
export function calculateStreak(calendarData) {
  if (!calendarData || typeof calendarData !== "object") {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Convert calendar object to sorted array of dates
  const activeDates = Object.keys(calendarData)
    .map((ts) => new Date(parseInt(ts) * 1000))
    .sort((a, b) => b - a); // Sort descending (most recent first)

  if (activeDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if the most recent activity was today or yesterday
  const mostRecentDate = new Date(activeDates[0]);
  mostRecentDate.setHours(0, 0, 0, 0);

  if (mostRecentDate >= yesterday) {
    currentStreak = 1;
    let expectedDate = new Date(mostRecentDate);
    expectedDate.setDate(expectedDate.getDate() - 1);

    for (let i = 1; i < activeDates.length; i++) {
      const date = new Date(activeDates[i]);
      date.setHours(0, 0, 0, 0);

      if (date.getTime() === expectedDate.getTime()) {
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (date < expectedDate) {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  const sortedAsc = [...activeDates].sort((a, b) => a - b);

  for (let i = 1; i < sortedAsc.length; i++) {
    const curr = new Date(sortedAsc[i]);
    const prev = new Date(sortedAsc[i - 1]);
    curr.setHours(0, 0, 0, 0);
    prev.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
    } else if (diffDays > 1) {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
    // diffDays === 0 means same day, continue
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}

/**
 * Fetch user stats from LeetCode API
 * @param {string} username - LeetCode username
 * @returns {Object} User statistics
 */
export async function fetchUserStats(username) {
  try {
    const [profile, calendar, solved] = await Promise.all([
      LeetCodeAPI.getUserProfile(username),
      LeetCodeAPI.getCalendar(username),
      LeetCodeAPI.getSolved(username),
    ]);

    if (!profile || !solved) return null;

    // Calculate streaks
    const { currentStreak, longestStreak } = calculateStreak(
      calendar.submissionCalendar || calendar,
    );

    // Calculate Points
    const easyPoints = (solved.easySolved || 0) * POINTS.EASY;
    const mediumPoints = (solved.mediumSolved || 0) * POINTS.MEDIUM;
    const hardPoints = (solved.hardSolved || 0) * POINTS.HARD;
    const streakPoints = currentStreak * POINTS.STREAK_BONUS;
    const totalPoints = easyPoints + mediumPoints + hardPoints + streakPoints;

    return {
      totalSolved: solved.solvedProblem || profile.totalSolved || 0,
      easySolved: solved.easySolved || 0,
      mediumSolved: solved.mediumSolved || 0,
      hardSolved: solved.hardSolved || 0,
      currentStreak,
      longestStreak,
      totalPoints,
      ranking: profile.ranking || 0,
      reputation: profile.reputation || 0,
      contributions: profile.contributionPoints || 0,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error(`Error fetching stats for ${username}:`, error);
    return null;
  }
}

/**
 * Sync user's problems with their LeetCode submissions
 * @param {string} username - LeetCode username
 * @param {Array} currentProblems - Current problems array from userData
 * @returns {Object} { updatedProblems, newlySolvedCount }
 */
export async function syncUserProblems(username, currentProblems = []) {
  try {
    const submissionsData = await LeetCodeAPI.getSubmissions(username, 100);
    if (!submissionsData || !submissionsData.submission) {
      return { updatedProblems: currentProblems, newlySolvedCount: 0 };
    }

    // Extract set of solved titleSlugs from recent submissions
    const solvedSlugs = new Set(
      submissionsData.submission
        .filter((s) => s.statusDisplay === "Accepted")
        .map((s) => s.titleSlug),
    );

    let newlySolvedCount = 0;
    const updatedProblems = currentProblems.map((problem) => {
      if (
        (problem.status === "Todo" || problem.status === "Attempted") &&
        solvedSlugs.has(problem.titleSlug)
      ) {
        newlySolvedCount++;
        return {
          ...problem,
          status: "Solved",
          solvedAt: new Date().toISOString(),
        };
      }
      return problem;
    });

    return { updatedProblems, newlySolvedCount };
  } catch (error) {
    console.error(`Error syncing problems for ${username}:`, error);
    return { updatedProblems: currentProblems, newlySolvedCount: 0 };
  }
}

/**
 * Get leaderboard data for a group from cache or fetch fresh
 * @param {string} groupId - Group ID
 * @param {string} timePeriod - 'all' | 'month' | 'week'
 * @param {boolean} forceRefresh - Force fresh fetch from API
 * @returns {Array} Sorted leaderboard entries
 */
export async function getGroupLeaderboard(
  groupId,
  timePeriod = "all",
  forceRefresh = false,
) {
  // Validate groupId
  if (!groupId || typeof groupId !== "string") {
    console.warn("getGroupLeaderboard: Invalid groupId provided:", groupId);
    return [];
  }

  try {
    // Check cache first
    const cacheRef = doc(db, "leaderboardCache", groupId);
    const cacheSnap = await getDoc(cacheRef);

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Use cache if exists and less than 1 hour old (unless forcing refresh)
    if (!forceRefresh && cacheSnap.exists()) {
      const cacheData = cacheSnap.data();
      const lastUpdated = cacheData.lastUpdated?.toDate?.() || new Date(0);

      if (lastUpdated > oneHourAgo && cacheData.members) {
        console.log("Using cached leaderboard data");
        return processLeaderboard(cacheData.members, timePeriod);
      }
    }

    // Fetch fresh data
    console.log("Fetching fresh leaderboard data for group:", groupId);
    const members = await fetchGroupMembers(groupId);

    // Only cache if we got valid members
    if (members && members.length >= 0) {
      await setDoc(cacheRef, {
        groupId,
        members,
        lastUpdated: Timestamp.now(),
      });
    }

    return processLeaderboard(members, timePeriod, "overall");
  } catch (error) {
    console.error("Error getting group leaderboard:", error);
    // Return empty array instead of throwing to prevent UI crash
    if (error.message?.includes("index")) {
      console.error(
        "Firestore index may be required. Check the console for the index creation link.",
      );
    }
    throw error;
  }
}

/**
 * Get contest leaderboard for a group
 * @param {string} groupId - Group ID
 * @returns {Array} Ranked contest participants
 */
export async function getContestLeaderboard(groupId) {
  if (!groupId) return [];

  try {
    // 1. Get all contests targeting this group or 'All'
    const contestsQuery = query(
      collection(db, "contests"),
      where("targetGroup", "in", [groupId, "All"]),
    );
    const contestDocs = await getDocs(contestsQuery);
    const contestIds = contestDocs.docs.map((d) => d.id);

    // 2. Get all users in the group
    const usersQuery = query(
      collection(db, "users"),
      where("groupId", "==", groupId),
    );
    const usersSnap = await getDocs(usersQuery);
    const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const userPoints = {}; // userId -> points

    // 3. For each contest, fetch submissions
    // Note: This could be heavy, in production we'd want to use a cloud function or aggregate on submission
    await Promise.all(
      contestIds.map(async (cId) => {
        const submissionsSnap = await getDocs(
          collection(db, "contests", cId, "submissions"),
        );
        submissionsSnap.docs.forEach((subDoc) => {
          const sub = subDoc.data();
          userPoints[sub.userId] =
            (userPoints[sub.userId] || 0) + (sub.score || 0);
        });
      }),
    );

    // 4. Map back to user objects
    const results = users.map((user) => ({
      id: user.id,
      displayName: user.displayName || user.email,
      leetcodeUsername: user.leetcodeUsername,
      contestPoints: userPoints[user.id] || 0,
      rank: 0, // Will be added by process
    }));

    return processLeaderboard(results, "all", "contests");
  } catch (err) {
    console.error("Error fetching contest leaderboard:", err);
    return [];
  }
}

/**
 * Fetch all members of a group and their LeetCode stats
 * @param {string} groupId - Group ID
 * @returns {Array} Array of member objects with stats
 */
async function fetchGroupMembers(groupId) {
  // Get all users in the group
  const usersQuery = query(
    collection(db, "users"),
    where("groupId", "==", groupId),
  );

  const snapshot = await getDocs(usersQuery);
  const users = snapshot.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
    }))
    .filter((u) => u.leetcodeUsername); // Only users with LeetCode username

  // Fetch stats for each user (batched to respect rate limits)
  const membersWithStats = await batchRequests(users, 3, async (user) => {
    const stats = await fetchUserStats(user.leetcodeUsername);
    return {
      id: user.id,
      displayName: user.displayName || user.leetcodeUsername,
      leetcodeUsername: user.leetcodeUsername,
      ...stats,
      streak: user.streak || 0,
    };
  });

  return membersWithStats.filter((m) => m.totalSolved !== undefined);
}

/**
 * Process leaderboard data with time period filtering and ranking
 * @param {Array} members - Raw member data
 * @param {string} timePeriod - 'all' | 'month' | 'week'
 * @returns {Array} Processed and ranked leaderboard
 */
function processLeaderboard(members, timePeriod, mode = "overall") {
  let processed = [...members];

  if (mode === "overall") {
    // Sort by total points (descending)
    processed.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  } else {
    // Sort by contest points
    processed.sort((a, b) => (b.contestPoints || 0) - (a.contestPoints || 0));
  }

  // Add rank
  processed = processed.map((member, index) => ({
    ...member,
    rank: index + 1,
  }));

  return processed;
}

/**
 * Force refresh leaderboard cache (respects cooldown)
 * @param {string} groupId - Group ID
 * @param {string} userId - User requesting refresh (for cooldown tracking)
 * @returns {Object} { success, message, data? }
 */
export async function refreshLeaderboard(groupId, userId) {
  try {
    // Check user's last refresh time
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const lastRefresh =
        userData.lastLeaderboardRefresh?.toDate?.() || new Date(0);
      const now = new Date();
      const cooldownMinutes = 30;
      const cooldownEnd = new Date(
        lastRefresh.getTime() + cooldownMinutes * 60 * 1000,
      );

      if (now < cooldownEnd) {
        const minutesRemaining = Math.ceil((cooldownEnd - now) / (60 * 1000));
        return {
          success: false,
          message: `Please wait ${minutesRemaining} minutes before refreshing again.`,
        };
      }
    }

    // Update user's last refresh time
    await setDoc(
      userRef,
      { lastLeaderboardRefresh: Timestamp.now() },
      { merge: true },
    );

    // Force fetch fresh data
    const data = await getGroupLeaderboard(groupId, "all", true);

    return {
      success: true,
      message: "Leaderboard updated!",
      data,
    };
  } catch (error) {
    console.error("Error refreshing leaderboard:", error);
    return {
      success: false,
      message: "Failed to refresh leaderboard. Please try again later.",
    };
  }
}
