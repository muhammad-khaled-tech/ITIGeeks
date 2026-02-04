import { db } from "../firebase";
import { guessCategory, findBestMatch } from "../utils/problemUtils";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { LeetCodeAPI } from "./leetcodeAPI";
import { enrichSubmissions } from "./problemMetadataService";
import { NotificationService, ACTIVITY_TYPES } from "./notificationService";

// Point constants
export const POINTS = {
  EASY: 25,
  MEDIUM: 50,
  HARD: 100,
  STREAK_BONUS: 10,
};

/**
 * Trigger notifications when user stats change
 * Optimized: Uses embedded userName to avoid N+1 reads
 */
export async function checkAndNotifyChanges(
  userId,
  groupId,
  userName,
  oldStats,
  newStats,
) {
  if (!oldStats || !newStats || !groupId) return;

  // 1. Check for newly solved problems
  const oldTotal = oldStats.totalSolved || 0;
  const newTotal = newStats.totalSolved || 0;

  if (newTotal > oldTotal) {
    const solvedCount = newTotal - oldTotal;

    // Get difficulty of last solved problem if possible
    const lastSubmission = newStats.recentSubmissions?.[0];
    const difficulty = lastSubmission?.difficulty || "Easy";
    const problemSlug = lastSubmission?.titleSlug || "a core problem";

    await NotificationService.createActivityNotification(
      groupId,
      userId,
      userName,
      {
        type: ACTIVITY_TYPES.PROBLEM_SOLVED,
        data: {
          problemSlug,
          difficulty,
          count: solvedCount,
          total: newTotal,
        },
      },
    );
  }

  // 2. Check for streak milestones
  const oldStreak = oldStats.streak || 0;
  const newStreak = newStats.streak || 0;

  const streakMilestones = [7, 14, 30, 50, 100];
  if (streakMilestones.includes(newStreak) && newStreak > oldStreak) {
    await NotificationService.createActivityNotification(
      groupId,
      userId,
      userName,
      {
        type: ACTIVITY_TYPES.STREAK_MILESTONE,
        data: { streak: newStreak },
      },
    );
  }

  // 3. Check for total solved milestones
  const totalMilestones = [10, 25, 50, 100, 200, 500];
  const crossedMilestone = totalMilestones.find(
    (m) => oldTotal < m && newTotal >= m,
  );

  if (crossedMilestone) {
    await NotificationService.createActivityNotification(
      groupId,
      userId,
      userName,
      {
        type: ACTIVITY_TYPES.TOTAL_MILESTONE,
        data: { total: crossedMilestone },
      },
    );
  }
}

// Helper to batch API requests with rate limiting and exponential backoff protection
async function batchRequests(items, batchSize, fn) {
  let results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results = [...results, ...batchResults];

    // Intelligent delay: 2s base + random jitter (0-1s) to prevent synchronized server spikes
    if (i + batchSize < items.length) {
      const delay = 2000 + Math.random() * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return results;
}

export function calculateStreak(calendarData) {
  // Handle stringified JSON (common in Some LeetCode API responses)
  let calendar = calendarData;
  if (typeof calendar === "string") {
    try {
      calendar = JSON.parse(calendar);
    } catch (e) {
      return { currentStreak: 0, longestStreak: 0 };
    }
  }

  if (!calendar || typeof calendar !== "object") {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Convert calendar object to sorted array of dates
  const activeDates = Object.keys(calendar)
    .map((ts) => new Date(parseInt(ts) * 1000))
    .sort((a, b) => b - a); // Sort descending (most recent first)

  // Calculate current streak using UTC for reliability
  let currentStreak = 0;
  const now = new Date();
  const todayUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  const yesterdayUTC = todayUTC - 24 * 60 * 60 * 1000;

  // Convert activeDates to start of UTC day timestamps
  const activeDayTimestamps = activeDates.map((date) => {
    return Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    );
  });

  // Unique sorted day timestamps (descending)
  const uniqueDays = [...new Set(activeDayTimestamps)].sort((a, b) => b - a);

  if (uniqueDays.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Check if the most recent activity was today or yesterday UTC
  const mostRecentDay = uniqueDays[0];

  if (mostRecentDay >= yesterdayUTC) {
    currentStreak = 1;
    let expectedDay = mostRecentDay - 24 * 60 * 60 * 1000;

    for (let i = 1; i < uniqueDays.length; i++) {
      if (uniqueDays[i] === expectedDay) {
        currentStreak++;
        expectedDay -= 24 * 60 * 60 * 1000;
      } else if (uniqueDays[i] < expectedDay) {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  const sortedAscDays = [...uniqueDays].sort((a, b) => a - b);

  for (let i = 1; i < sortedAscDays.length; i++) {
    const diffDays =
      (sortedAscDays[i] - sortedAscDays[i - 1]) / (24 * 60 * 60 * 1000);

    if (diffDays === 1) {
      tempStreak++;
    } else if (diffDays > 1) {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
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
    // 1. Fetch Everything in one consolidated call to minimize 429s
    const data = await LeetCodeAPI.getCombinedStats(username, 500);

    if (!data || data.error) {
      console.warn(`[Stats] No data for ${username}`);
      return null;
    }

    // Calculate streaks
    const { currentStreak, longestStreak } = calculateStreak(
      data.submissionCalendar,
    );

    // Calculate Points
    const easyPoints = (data.easySolved || 0) * POINTS.EASY;
    const mediumPoints = (data.mediumSolved || 0) * POINTS.MEDIUM;
    const hardPoints = (data.hardSolved || 0) * POINTS.HARD;
    const streakBonus = 1 + currentStreak / 100;
    const totalPoints = Math.round(
      (easyPoints + mediumPoints + hardPoints) * streakBonus,
    );

    // 4. Map submissions (supporting both internal proxy format and external)
    const rawSubmissions = data.recentSubmissions || data.submission || [];
    const recentSubmissions = await enrichSubmissions(
      rawSubmissions.map((s) => ({
        timestamp: parseInt(s.timestamp),
        status: s.statusDisplay || s.status,
        titleSlug: s.titleSlug,
        difficulty: s.difficulty, // Preserve difficulty from enrichment
      })),
    );

    return {
      totalSolved: data.solvedProblem || data.totalSolved || 0,
      easySolved: data.easySolved || 0,
      mediumSolved: data.mediumSolved || 0,
      hardSolved: data.hardSolved || 0,
      currentStreak: currentStreak || 0,
      longestStreak: longestStreak || 0,
      streak: currentStreak || 0, // Added for Navbar compatibility
      totalPoints: totalPoints || 0,
      ranking: data.ranking || 0,
      reputation: data.reputation || 0,
      contributions: data.contributionPoints || 0,
      lastUpdated: new Date(),
      submissionCalendar: data.submissionCalendar || {},
      recentSubmissions: recentSubmissions || [],
      cacheVersion: 2, // Marks data fetched with 500-submission limit
    };
  } catch (error) {
    console.error(`Error fetching stats for ${username}:`, error);
    throw error; // Propagate to prevent saving partial/bad data
  }
}

/**
 * Merges LeetCode stats with local ITIGeeks progress to ensure no data loss
 * @param {Object} lcStats - Stats from LeetCode API
 * @param {Array} localProblems - User's local problem list
 * @returns {Object} Unified stats object
 */
export function mergeStats(lcStats, localProblems = []) {
  // ===== 1. EXTRACT API STATS =====
  const apiTotal = lcStats?.totalSolved || lcStats?.solvedProblem || 0;
  const apiEasy = lcStats?.easySolved || 0;
  const apiMedium = lcStats?.mediumSolved || 0;
  const apiHard = lcStats?.hardSolved || 0;
  const apiSum = apiEasy + apiMedium + apiHard;

  console.log(
    `[MergeStats] API: total=${apiTotal}, sum=${apiSum} ` +
      `(${apiEasy}/${apiMedium}/${apiHard})`,
  );

  // ===== 2. EXTRACT LOCAL STATS =====
  // ITIGeeks uses "Done" (case-sensitive normally, but let's be safe)
  const localDone = localProblems.filter(
    (p) => (p.status || "").toLowerCase() === "done",
  );

  // Group by difficulty
  const localByDifficulty = {
    Easy: localDone.filter((p) => p.difficulty === "Easy"),
    Medium: localDone.filter((p) => p.difficulty === "Medium"),
    Hard: localDone.filter((p) => p.difficulty === "Hard"),
  };

  const localEasyCount = localByDifficulty.Easy.length;
  const localMediumCount = localByDifficulty.Medium.length;
  const localHardCount = localByDifficulty.Hard.length;
  const localTotalCount = localEasyCount + localMediumCount + localHardCount;

  console.log(
    `[MergeStats] Local: ${localTotalCount} ` +
      `(${localEasyCount}/${localMediumCount}/${localHardCount})`,
  );

  // ===== 3. SMART MERGE STRATEGY =====

  // Strategy: Use API as source of truth, but never go below local count
  const mergedEasy = Math.max(apiEasy, localEasyCount);
  const mergedMedium = Math.max(apiMedium, localMediumCount);
  const mergedHard = Math.max(apiHard, localHardCount);

  // Calculate merged total sum
  const mergedSum = mergedEasy + mergedMedium + mergedHard;

  // Final total (safety net: always at least the max of API or local)
  const finalTotal = Math.max(apiTotal, apiSum, mergedSum, localTotalCount);

  // ===== 4. DETECT DUPLICATES & LOCAL-ONLY =====

  // Create set of problem slugs from API submissions (if available)
  const rawSubs = lcStats?.recentSubmissions || lcStats?.submission || [];
  const apiSolvedSlugs = new Set(
    rawSubs
      .filter((s) => (s.statusDisplay || s.status) === "Accepted")
      .map((s) => s.titleSlug),
  );

  // Identify problems done locally but not yet reflected in API
  const localOnlyProblems = localDone.filter(
    (p) => !apiSolvedSlugs.has(p.titleSlug || p.slug),
  );

  console.log(
    `[MergeStats] Merged: ${finalTotal} (${mergedEasy}/${mergedMedium}/${mergedHard}) | Local Only: ${localOnlyProblems.length}`,
  );

  // ===== 5. CALCULATE POINTS & STREAK =====

  // Re-use current ITIGeeks point constants
  const unifiedPoints =
    mergedEasy * POINTS.EASY +
    mergedMedium * POINTS.MEDIUM +
    mergedHard * POINTS.HARD;

  // Streak logic (Merge calendars)
  let lcCalendar = lcStats?.submissionCalendar || {};
  if (typeof lcCalendar === "string") {
    try {
      lcCalendar = JSON.parse(lcCalendar);
    } catch (e) {
      lcCalendar = {};
    }
  }

  // Extract dates from locally solved problems
  const localCalendar = {};
  localDone.forEach((p) => {
    if (p.solvedAt) {
      try {
        const ts = Math.floor(new Date(p.solvedAt).getTime() / 1000);
        if (!isNaN(ts)) localCalendar[ts] = 1;
      } catch (e) {}
    }
  });

  const combinedCalendar = { ...lcCalendar, ...localCalendar };
  const { currentStreak, longestStreak } = calculateStreak(combinedCalendar);

  const streakMultiplier = 1 + currentStreak / 100;
  const finalPoints = Math.round(unifiedPoints * streakMultiplier);

  // ===== 6. RETURN UNIFIED STATS =====

  return {
    ...lcStats, // Preserve other API fields ( avatar, ranking, etc. )
    totalSolved: finalTotal,
    easySolved: mergedEasy,
    mediumSolved: mergedMedium,
    hardSolved: mergedHard,
    totalPoints: finalPoints,
    currentStreak,
    longestStreak,
    streak: currentStreak,
    submissionCalendar: combinedCalendar,
    lastUpdated: new Date().toISOString(),
    _merged: true,
  };
}

/**
 * Validates merged stats (Helper for debugging)
 */
export function validateMergedStats(stats) {
  const { totalSolved, easySolved, mediumSolved, hardSolved } = stats;
  const sum = (easySolved || 0) + (mediumSolved || 0) + (hardSolved || 0);

  const isConsistent = Math.abs(totalSolved - sum) <= 1;
  const isPositive =
    totalSolved >= 0 && easySolved >= 0 && mediumSolved >= 0 && hardSolved >= 0;

  if (!isConsistent || !isPositive) {
    console.error(
      `[MergeStats] ❌ Validation failed: total=${totalSolved}, sum=${sum}`,
    );
    return false;
  }

  console.log(`[MergeStats] ✅ Validation passed: ${totalSolved} total`);
  return true;
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
      let currentProblem = { ...problem };

      // SMART CATEGORIZATION & DIFFICULTY FIX
      if (
        !currentProblem.type ||
        currentProblem.type === "Uncategorized" ||
        !currentProblem.difficulty ||
        currentProblem.difficulty === "Unknown"
      ) {
        const match = findBestMatch(
          currentProblem.title || currentProblem.name,
        );
        if (match) {
          if (
            (!currentProblem.type || currentProblem.type === "Uncategorized") &&
            match.t
          ) {
            currentProblem.type = match.t;
          }
          if (
            (!currentProblem.difficulty ||
              currentProblem.difficulty === "Unknown") &&
            match.d
          ) {
            currentProblem.difficulty = match.d;
          }
        } else if (
          !currentProblem.type ||
          currentProblem.type === "Uncategorized"
        ) {
          currentProblem.type = guessCategory(
            currentProblem.title || currentProblem.name,
          );
        }
      }

      if (
        (currentProblem.status === "Todo" ||
          currentProblem.status === "Attempted") &&
        solvedSlugs.has(currentProblem.titleSlug)
      ) {
        newlySolvedCount++;
        return {
          ...currentProblem,
          status: "Done",
          solvedAt: new Date().toISOString(),
        };
      }
      return currentProblem;
    });

    return { updatedProblems, newlySolvedCount };
  } catch (error) {
    console.error(`Error syncing problems for ${username}:`, error);
    return { updatedProblems: currentProblems, newlySolvedCount: 0 };
  }
}

/**
 * Sync user's contest submissions for a specific contest
 * @param {string} username - LeetCode username
 * @param {string} userId - Auth User ID
 * @param {string} contestId - Contest ID
 * @returns {Object} { newlySolvedCount, totalPointsGained }
 */
export async function syncContestSubmissions(
  username,
  userId,
  contestId,
  externalSubmissions = null,
) {
  try {
    // 1. Get Contest Details
    const contestRef = doc(db, "contests", contestId);
    const contestSnap = await getDoc(contestRef);
    if (!contestSnap.exists()) throw new Error("Contest not found");
    const contest = contestSnap.data();
    const contestStart = new Date(contest.startTime).getTime();
    const contestEnd = new Date(contest.endTime).getTime();

    // 2. Fetch recent submissions from API if not provided
    let submissions;
    if (externalSubmissions) {
      submissions = externalSubmissions;
    } else {
      const submissionsData = await LeetCodeAPI.getSubmissions(username, 50);
      submissions = submissionsData?.submission || [];
    }

    if (!submissions || submissions.length === 0)
      return { newlySolvedCount: 0, totalPointsGained: 0 };

    // 2.5 Enrich submissions with difficulty/points
    submissions = await enrichSubmissions(
      submissions.map((s) => ({
        timestamp: parseInt(s.timestamp),
        status: s.statusDisplay || s.status,
        titleSlug: s.titleSlug,
        difficulty: s.difficulty, // Preserve difficulty from enrichment
      })),
    );

    // 3. Get existing submissions for this user in this contest to avoid duplicates
    const existingSubQ = query(
      collection(db, "contests", contestId, "submissions"),
      where("userId", "==", userId),
    );
    const existingSnap = await getDocs(existingSubQ);
    const alreadySolvedSlugs = new Set(
      existingSnap.docs.map((d) => d.data().problemSlug),
    );

    let newlySolvedCount = 0;
    let totalPointsGained = 0;

    // 4. Match API submissions with contest problems
    for (const sub of submissions) {
      if (sub.statusDisplay !== "Accepted" && sub.status !== "Accepted")
        continue;

      // Normalize timestamp to milliseconds
      let subTime = parseInt(sub.timestamp);
      if (subTime < 10000000000) subTime *= 1000; // Convert seconds to ms if needed

      if (subTime < contestStart) continue; // Must be after contest start
      if (subTime > contestEnd) continue; // Must be before contest end

      const problem = contest.problems.find((p) => p.slug === sub.titleSlug);
      if (problem && !alreadySolvedSlugs.has(problem.slug)) {
        // Valid new submission!
        // Prevent duplicates by using a composite ID
        const submissionId = `${userId}_${problem.slug}`;
        const submissionRef = doc(
          db,
          "contests",
          contestId,
          "submissions",
          submissionId,
        );

        await setDoc(submissionRef, {
          userId,
          username,
          problemSlug: problem.slug,
          score: problem.score || 0,
          timestamp: new Date().toISOString(),
        });
        alreadySolvedSlugs.add(problem.slug);
        newlySolvedCount++;
        totalPointsGained += problem.score || 0;
      }
    }

    return { newlySolvedCount, totalPointsGained };
  } catch (error) {
    console.error("Contest sync error:", error);
    throw error;
  }
}

/**
 * Get leaderboard data for a group from cache or fetch fresh
 * @param {string} groupId - Group ID
 * @param {string} timePeriod - 'all' | 'month' | 'week'
 * @param {boolean} forceRefresh - Force fresh fetch from API
 * @param {string} priorityUserId - User to fetch first
 * @returns {Array} Sorted leaderboard entries
 */
export async function getGroupLeaderboard(
  groupId,
  timePeriod = "all",
  forceRefresh = false,
  priorityUserId = null,
) {
  // Validate groupId
  if (!groupId || typeof groupId !== "string") {
    console.warn("getGroupLeaderboard: Invalid groupId provided:", groupId);
    return [];
  }

  if (isServiceQuotaExceeded) return [];

  try {
    // Check cache first
    const cacheRef = doc(db, "leaderboardCache", groupId);
    let cacheSnap;
    try {
      cacheSnap = await getDoc(cacheRef);
    } catch (e) {
      console.warn("[Leaderboard] 🔒 Quota exceeded during cache read.", e);
      isServiceQuotaExceeded = true;
      return [];
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Use cache if exists and less than 1 hour old (unless forcing refresh)
    if (!forceRefresh && cacheSnap.exists()) {
      const cacheData = cacheSnap.data();
      const lastUpdated = cacheData.lastUpdated?.toDate?.() || new Date(0);

      const isUpToDate =
        cacheData.members &&
        Object.values(cacheData.members).every(
          (m) => m.recentSubmissions && m.cacheVersion === 2,
        );

      if (lastUpdated > oneHourAgo && cacheData.members && isUpToDate) {
        console.log("Using fresh cached leaderboard data");
        const membersArray = Object.values(cacheData.members);
        return processLeaderboard(membersArray, timePeriod);
      } else {
        console.log(
          "Cache is stale or missing features, triggering background sync...",
        );
        // FIRE AND FORGET: Trigger background sync without await
        silentGroupSync(groupId, cacheData.members || []).catch((err) =>
          console.error("[Background Sync] Failed:", err.message),
        );

        const membersArray = Object.values(cacheData.members || {});
        return processLeaderboard(membersArray, timePeriod);
      }
    }

    console.log(
      `No cache for group ${groupId} or forceRefresh, performing initial sync...`,
    );
    const results = await fetchGroupMembers(groupId, priorityUserId, []);

    return processLeaderboard(results, timePeriod, "overall");
  } catch (error) {
    console.error("Error getting group leaderboard:", error);
    if (error.code === "resource-exhausted") isServiceQuotaExceeded = true;
    return [];
  }
}

/**
 * Sync a single user's stats and update the group cache
 * Used by Trojan Horse background sync
 */
export async function syncUser(userId, leetcodeUsername, groupId) {
  try {
    const stats = await LeetCodeAPI.getCombinedStats(leetcodeUsername);
    if (!stats) throw new Error("Failed to fetch stats");

    // Enrich submissions with difficulty/points
    if (stats.recentSubmissions) {
      stats.recentSubmissions = await enrichSubmissions(
        stats.recentSubmissions.map((s) => ({
          timestamp: parseInt(s.timestamp),
          status: s.statusDisplay || s.status,
          titleSlug: s.titleSlug,
          difficulty: s.difficulty, // Preserve difficulty from enrichment
        })),
      );
    }

    // Get current user doc to merge
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};

    let updatedUser = {
      ...userData,
      ...stats,
      _syncedAt: Date.now(),
    };

    // 1. Update User Doc
    try {
      await setDoc(userRef, updatedUser, { merge: true });
    } catch (err) {
      if (err.code === "resource-exhausted") {
        console.warn("[SyncUser] 🔒 Quota exceeded during doc update.");
      } else throw err;
    }

    // 2. Push to Leaderboard Cache
    if (groupId) {
      const cacheRef = doc(db, "leaderboardCache", groupId);
      await updateLeaderboardAtomic(
        cacheRef,
        {
          id: userId,
          displayName: userData.displayName || leetcodeUsername,
          leetcodeUsername: leetcodeUsername,
          ...stats,
          _syncedAt: Date.now(),
        },
        groupId,
      ).catch(() => {}); // Already logged in atomic helper
    }

    // ⭐ CHECK AND NOTIFY CHANGES
    if (groupId) {
      await checkAndNotifyChanges(
        userId,
        groupId,
        userData.displayName || leetcodeUsername,
        userData, // Old stats (from user doc before this sync)
        updatedUser, // New stats
      ).catch((err) => console.error("[NotificationTrigger] Failed:", err));
    }

    return updatedUser;
  } catch (error) {
    console.error(`[SyncUser] Failed for ${leetcodeUsername}:`, error);
    throw error;
  }
}

/**
 * Performs a group sync in the background and updates Firestore
 */
export async function silentGroupSync(groupId, cacheData = {}) {
  try {
    console.log(`[Background Sync] Starting for ${groupId}...`);
    // Convert cache map to array if needed
    const membersArray = Array.isArray(cacheData)
      ? cacheData
      : Object.values(cacheData);
    const results = await fetchGroupMembers(groupId, null, membersArray);
    return results.length > 0;
  } catch (err) {
    console.error(`[Background Sync] Error:`, err);
  }
  return false;
}

// Global flag for this service too
let isServiceQuotaExceeded = false;

/**
 * Atomic update to Firestore - updates one user in the cache
 */
export async function updateLeaderboardAtomic(cacheRef, userData, groupId) {
  if (isServiceQuotaExceeded) return;

  try {
    // Timeout safeguard
    await Promise.race([
      setDoc(
        cacheRef,
        {
          groupId,
          members: {
            [userData.id]: userData,
          },
          lastUpdated: serverTimestamp(),
          _partial: true, // Flag to indicate progressive update
        },
        { merge: true },
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Atomic Update Timeout")), 3000),
      ),
    ]);
  } catch (error) {
    if (
      error.code === "resource-exhausted" ||
      error.message.includes("Timeout")
    ) {
      isServiceQuotaExceeded = true;
      console.warn(
        "[LeaderboardSync] 🔒 Atomic update blocked by QUOTA/TIMEOUT.",
      );
    } else {
      console.error("[LeaderboardSync] Failed atomic update:", error);
    }
  }
}

/**
 * Finalize leaderboard - calculate final rankings and save complete set
 */
async function finalizeLeaderboard(groupId, allMembers) {
  const cacheRef = doc(db, "leaderboardCache", groupId);

  // Sort by points
  const sorted = allMembers.sort(
    (a, b) => (b.totalPoints || 0) - (a.totalPoints || 0),
  );

  // Assign ranks
  sorted.forEach((member, index) => {
    member.rank = index + 1;
  });

  // Convert to map for atomic access
  const membersMap = {};
  sorted.forEach((member) => {
    membersMap[member.id] = member;
  });

  // Final atomic update with complete flag
  try {
    await setDoc(cacheRef, {
      groupId,
      members: membersMap,
      lastUpdated: serverTimestamp(),
      _partial: false, // Mark as complete
      _finalizedAt: Date.now(),
    });
  } catch (err) {
    if (err.code === "resource-exhausted") {
      console.warn(
        "[LeaderboardSync] 🏁 Leaderboard finalized LOCALLY only (Quota reached).",
      );
    } else throw err;
  }

  console.log("[LeaderboardSync] 🏁 Finalized with rankings");
  return sorted;
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
 * Fetch all members of a group and their LeetCode stats with progressive updates
 * @param {string} groupId - Group ID
 * @param {string} priorityUserId - User to fetch first
 * @param {Array} cacheData - Existing cached members to fallback on
 * @param {Function} onPriorityDone - Callback when priority user is ready
 * @returns {Array} Array of member objects with stats
 */
async function fetchGroupMembers(
  groupId,
  priorityUserId = null,
  cacheData = [],
  onPriorityDone = null,
) {
  if (isServiceQuotaExceeded) return [];

  // Get all users in the group
  const usersQuery = query(
    collection(db, "users"),
    where("groupId", "==", groupId),
  );

  let snapshot;
  try {
    snapshot = await getDocs(usersQuery);
  } catch (err) {
    console.error("[Leaderboard] 🔒 Quota exceeded during group fetch.", err);
    isServiceQuotaExceeded = true;
    return [];
  }

  const allUsers = snapshot.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
    }))
    .filter((u) => u.leetcodeUsername);

  if (allUsers.length === 0) return [];

  // 1. Prioritize active user
  let usersList = [...allUsers];

  // ⚡ DIFFERENTIAL SYNC: Filter out students who were synced recently
  // Only apply if NOT the priority user (we always sync priority user if it's a manual refresh)
  const FRESHNESS_TTL = 60 * 60 * 1000; // 1 Hour
  const now = Date.now();

  if (priorityUserId) {
    const priorityIndex = usersList.findIndex((u) => u.id === priorityUserId);
    if (priorityIndex > -1) {
      const [priorityUser] = usersList.splice(priorityIndex, 1);
      usersList = [priorityUser, ...usersList];
      console.log(
        `[LeaderboardSync] ⭐ Priority user: ${priorityUser.displayName}`,
      );
    }
  }

  // Map existing cache data for fast lookup
  const cacheMap = Array.isArray(cacheData)
    ? cacheData.reduce((acc, m) => ({ ...acc, [m.id]: m }), {})
    : cacheData;

  const results = [];
  const cacheRef = doc(db, "leaderboardCache", groupId);

  // 2. Process all members (Naturally throttled by LeetCodeAPI queue)
  const syncPromises = usersList.map(async (user, index) => {
    const isPriority = index === 0 && priorityUserId;

    // Check if this user is fresh in cache
    const existing = cacheMap[user.id];
    const isFresh = existing && now - (existing._syncedAt || 0) < FRESHNESS_TTL;

    if (!isPriority && isFresh) {
      console.log(`[Sync] Skipping fresh user: ${user.leetcodeUsername}`);
      results.push(existing);
      return existing;
    }

    try {
      console.log(`[Sync] Fetching: ${user.leetcodeUsername}...`);
      const stats = await fetchUserStats(user.leetcodeUsername);

      let unifiedStats;
      if (stats) {
        // Merge with local progress for leaderboard accuracy
        unifiedStats = mergeStats(stats, user.problems || []);
        console.log(`[Sync] Success: ${user.leetcodeUsername}`);
      } else {
        // Fallback to cache if available
        const oldData = cacheMap[user.id];
        unifiedStats = mergeStats(oldData || null, user.problems || []);
      }

      const entryName =
        user.displayName ||
        (existing && existing.displayName) ||
        user.leetcodeUsername;

      let memberData = {
        id: user.id,
        displayName: entryName,
        leetcodeUsername: user.leetcodeUsername,
        ...unifiedStats,
        _syncedAt: Date.now(),
      };

      results.push(memberData);

      // ⚡ ATOMIC UPDATE: Save immediately after each user
      await updateLeaderboardAtomic(cacheRef, memberData, groupId);

      // ⭐ CHECK AND NOTIFY CHANGES
      if (existing) {
        await checkAndNotifyChanges(
          user.id,
          groupId,
          memberData.displayName,
          existing,
          memberData,
        ).catch((err) =>
          console.error("[Notify] Error in fetchGroupMembers loop:", err),
        );
      }

      if (isPriority && onPriorityDone) {
        onPriorityDone();
      }

      return memberData;
    } catch (err) {
      console.warn(`[Sync] Failed: ${user.leetcodeUsername}.`, err);
      // Resilience fallback
      const oldData = cacheMap[user.id];
      const unifiedStats = mergeStats(oldData || null, user.problems || []);

      const entryName =
        user.displayName ||
        (existing && existing.displayName) ||
        user.leetcodeUsername;

      const fallbackData = {
        id: user.id,
        displayName: entryName,
        leetcodeUsername: user.leetcodeUsername,
        ...unifiedStats,
        _error: err.message,
      };

      results.push(fallbackData);
      await updateLeaderboardAtomic(cacheRef, fallbackData, groupId);
      return fallbackData;
    }
  });

  // Finalize in background or wait based on context
  const allSyncedPromise = Promise.all(syncPromises).then(
    async (allResults) => {
      return await finalizeLeaderboard(groupId, allResults);
    },
  );

  return allSyncedPromise;
}

/**
 * Process leaderboard data with time period filtering and ranking
 * @param {Array} members - Raw member data
 * @param {string} timePeriod - 'all' | 'month' | 'week'
 * @returns {Array} Processed and ranked leaderboard
 */
export function processLeaderboard(members, timePeriod, mode = "overall") {
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
 * Force refresh leaderboard cache (respects cooldown tracking)
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
      const cooldownMinutes = 1;
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
      { lastLeaderboardRefresh: serverTimestamp() },
      { merge: true },
    );

    // Force fetch fresh data with PRIORITY
    console.log(
      `[RefreshLeaderboard] Starting prioritized refresh for ${userId}`,
    );

    let priorityResolved = false;

    // Start the process
    const syncPromise = fetchGroupMembers(groupId, userId, [], () => {
      priorityResolved = true;
      console.log("[RefreshLeaderboard] Priority user ready!");
    });

    // Poll for priority resolution or timeout
    const timeout = 30000;
    const start = Date.now();
    while (!priorityResolved && Date.now() - start < timeout) {
      await new Promise((r) => setTimeout(r, 500));
    }

    if (priorityResolved) {
      return {
        success: true,
        message: "Your stats are updated! Others syncing in background...",
        priorityReady: true,
      };
    }

    // Fallback if priority didn't resolve quickly
    const data = await syncPromise;
    return {
      success: true,
      message: "Leaderboard refreshed!",
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
