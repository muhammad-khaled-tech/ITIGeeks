import { LeetCode } from "leetcode-query";

const leetcode = new LeetCode();

// ===== ROBUST DATA EXTRACTION =====
function extractSolvedCounts(rawData) {
  // Try multiple nested paths for submitStats
  const submitStats =
    rawData?.submitStats ||
    rawData?.matchedUser?.submitStats ||
    rawData?.user?.submitStats ||
    {};

  const acSubmissions = submitStats.acSubmissionNum || [];

  // If empty array, data is invalid
  if (!Array.isArray(acSubmissions) || acSubmissions.length === 0) {
    console.error("[Proxy] ❌ No acSubmissionNum array found");
    return null; // Signal invalid data
  }

  // Helper to find count by difficulty
  const getCount = (difficulty) => {
    const target = difficulty.toLowerCase();
    const item = acSubmissions.find(
      (s) => (s.difficulty || "").toLowerCase() === target,
    );
    return item?.count || 0;
  };

  // Calculate total (try multiple strategies)
  const strategies = [
    getCount("all"),
    getCount("total"),
    acSubmissions.find((s) => !s.difficulty || s.difficulty === "All")?.count,
    acSubmissions[0]?.count,
  ];

  const total = strategies.find((val) => val && val > 0) || 0;
  const easy = getCount("easy");
  const medium = getCount("medium");
  const hard = getCount("hard");

  // Validation: Total should be sum of difficulties
  const calculatedTotal = easy + medium + hard;
  const finalTotal = Math.max(total, calculatedTotal);

  // If all zeros, something is wrong
  if (finalTotal === 0 && easy === 0 && medium === 0 && hard === 0) {
    console.error("[Proxy] ❌ All counts are 0 - suspicious");
    return null;
  }

  return {
    total: finalTotal,
    easy,
    medium,
    hard,
    valid: true,
  };
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { username, type, limit = 20 } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    let data;

    switch (type) {
      case "combined": {
        console.log(`[Proxy] 🔍 Fetching combined for: ${username}`);

        const combinedData = await leetcode.user(username).catch((err) => {
          console.error(`[Proxy] LeetCode user fetch failed: ${err.message}`);
          throw err;
        });

        // Extract solved counts with validation
        const counts = extractSolvedCounts(combinedData);

        if (!counts) {
          console.error(
            `[Proxy] ❌ Failed to extract valid counts for ${username}`,
          );
          // Return 503 to trigger fallback
          return res.status(503).json({
            error: "Invalid data from LeetCode",
            username,
            hint: "Primary source returned no valid stats",
          });
        }

        console.log(
          `[Proxy] ✅ ${username}: ${counts.total} (E:${counts.easy} M:${counts.medium} H:${counts.hard})`,
        );

        // Fetch submissions (optional)
        let submissions = [];
        try {
          const subs = await leetcode.recent_submissions(username);
          submissions = subs?.recentSubmissions || subs || [];
        } catch (err) {
          console.warn(`[Proxy] ⚠️ Submissions failed: ${err.message}`);
        }

        // Build response with validated data
        return res.status(200).json({
          // Identity
          username:
            combinedData.username || combinedData.user?.username || username,
          avatar:
            combinedData.profile?.userAvatar ||
            combinedData.matchedUser?.profile?.userAvatar ||
            combinedData.user?.profile?.userAvatar,

          // Stats
          ranking:
            combinedData.profile?.ranking ||
            combinedData.matchedUser?.profile?.ranking ||
            combinedData.user?.profile?.ranking,
          reputation:
            combinedData.profile?.reputation ||
            combinedData.matchedUser?.profile?.reputation ||
            combinedData.user?.profile?.reputation,
          contributionPoints:
            combinedData.contributionPoint ||
            combinedData.profile?.reputation ||
            combinedData.user?.profile?.reputation,

          // Solved (VALIDATED)
          solvedProblem: counts.total,
          totalSolved: counts.total, // Add both for compatibility
          easySolved: counts.easy,
          mediumSolved: counts.medium,
          hardSolved: counts.hard,

          // Calendar
          submissionCalendar:
            combinedData.submissionCalendar ||
            combinedData.matchedUser?.submissionCalendar ||
            combinedData.user?.submissionCalendar,

          // Submissions
          recentSubmissions: submissions,

          // Metadata
          _source: "proxy",
          _validated: true,
          _timestamp: new Date().toISOString(),
        });
      }

      case "profile":
        data = await leetcode.user(username);
        // Normalize for frontend
        res.status(200).json({
          username: data.username,
          name: data.profile?.realName,
          birthday: data.profile?.birthday,
          avatar: data.profile?.userAvatar,
          ranking: data.profile?.ranking,
          reputation: data.profile?.reputation,
          countryName: data.profile?.countryName,
          company: data.profile?.company,
          school: data.profile?.school,
          skillTags: data.profile?.skillTags,
          aboutMe: data.profile?.aboutMe,
          websites: data.profile?.websites,
        });
        break;

      case "solved":
        const userStats = await leetcode.user(username);
        res.status(200).json({
          solvedProblem:
            userStats.submitStats?.acSubmissionNum?.[0]?.count || 0,
          easySolved: userStats.submitStats?.acSubmissionNum?.[1]?.count || 0,
          mediumSolved: userStats.submitStats?.acSubmissionNum?.[2]?.count || 0,
          hardSolved: userStats.submitStats?.acSubmissionNum?.[3]?.count || 0,
          totalSubmissionNum: userStats.submitStats?.totalSubmissionNum || [],
          acSubmissionNum: userStats.submitStats?.acSubmissionNum || [],
        });
        break;

      case "calendar":
        try {
          const calendarData = await leetcode.user(username);
          res.status(200).json({
            submissionCalendar: calendarData.submissionCalendar,
          });
        } catch (err) {
          res
            .status(500)
            .json({ error: "Failed to fetch calendar", message: err.message });
        }
        break;

      case "submissions":
        try {
          let subs = await leetcode.recent_submissions(username);
          if (subs.length > limit) subs = subs.slice(0, limit);
          res.status(200).json({
            count: subs.length,
            submission: subs,
          });
        } catch (err) {
          res.status(500).json({
            error: "Failed to fetch submissions",
            message: err.message,
          });
        }
        break;

      case "contest":
        try {
          const contest = await leetcode.user_contest_info(username);
          res.status(200).json(contest);
        } catch (err) {
          res.status(500).json({
            error: "Failed to fetch contest info",
            message: err.message,
          });
        }
        break;

      default:
        try {
          const fullUser = await leetcode.user(username);
          res.status(200).json(fullUser);
        } catch (err) {
          res
            .status(500)
            .json({ error: "Failed to fetch user", message: err.message });
        }
    }
  } catch (error) {
    console.error(`[Proxy] Global Error [${type}]:`, error.message);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal Proxy Error",
        message: error.message,
        code: error.code || "UNKNOWN",
      });
    }
  }
}
