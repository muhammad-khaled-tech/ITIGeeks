import { Resend } from "resend";
import { adminDb } from "../../firebaseAdmin";
import { WeeklyReportEmail } from "../_lib/email-template";
import { render } from "@react-email/render";

// LeetCode API Proxy
const API_BASE = "https://alfa-leetcode-api.onrender.com";

export default async function handler(req, res) {
  // 1. Authorization Check
  const cronSecret = req.headers.authorization;
  if (
    process.env.CRON_SECRET &&
    cronSecret !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("Starting Weekly Report Cron Job...");

    // 2. Initialize Dependencies
    if (!process.env.RESEND_API_KEY) {
      console.warn("Skipping Report: RESEND_API_KEY missing");
      return res.status(200).json({ skipped: true, reason: "Missing API Key" });
    }
    const resend = new Resend(process.env.RESEND_API_KEY);

    // 3. Fetch All Users
    // In future, we might want to batch this or filter by group
    const usersSnap = await adminDb.collection("users").get();
    if (usersSnap.empty) {
      return res.status(200).json({ message: "No users found" });
    }

    const users = usersSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((u) => u.leetcodeUsername); // Only users with LeetCode connected

    console.log(`Processing ${users.length} users...`);

    // 4. Fetch Fresh Stats from LeetCode
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        try {
          // Fetch Profile and Calendar
          const [profileRes, calendarRes] = await Promise.all([
            fetch(`${API_BASE}/${user.leetcodeUsername}/solved`),
            fetch(`${API_BASE}/${user.leetcodeUsername}/calendar`),
          ]);

          const profile = profileRes.ok ? await profileRes.json() : {};
          const calendar = calendarRes.ok ? await calendarRes.json() : {};

          // Parse Solved Count
          const solved = profile.solvedProblem || 0;

          // Calculate Streak / Active Days
          // Submission Calendar is { timestamp: count }
          const submissionCalendar = JSON.parse(
            calendar.submissionCalendar || "{}",
          );
          const activeDays = calculateActiveDays(submissionCalendar);

          return {
            ...user,
            solved,
            activeDays,
            streak: user.streak || 0, // Use stored streak for now as it's cleaner in UI
          };
        } catch (err) {
          console.error(
            `Failed to fetch stats for ${user.leetcodeUsername}`,
            err,
          );
          return { ...user, solved: 0, activeDays: 0 };
        }
      }),
    );

    // 5. Rank Users (Total Solved Descending)
    // Note: Real "Weekly" logic requires snapshots. Using Total for baseline.
    const leaderboard = usersWithStats
      .sort((a, b) => b.solved - a.solved)
      .map((u, i) => ({ ...u, rank: i + 1 }));

    const champion = leaderboard[0];

    // Find Kooz: Last place among active students, or just last
    // Filter out completely invalid users (0 solved total might be inactive)
    const activeUsers = leaderboard.filter((u) => u.solved > 0);
    const kooz =
      activeUsers.length > 0 ? activeUsers[activeUsers.length - 1] : null;

    const weekNumber = getWeekNumber(new Date());

    // 6. Send Emails
    console.log(`Sending emails to ${leaderboard.length} users...`);
    const emailPromises = leaderboard.map(async (user) => {
      if (!user.email) return;

      // Generate HTML
      const emailHtml = await render(
        <WeeklyReportEmail
          studentName={user.displayName || user.leetcodeUsername}
          weekNumber={weekNumber}
          champion={{ name: champion.displayName, solved: champion.solved }}
          kooz={kooz ? { name: kooz.displayName, solved: kooz.solved } : null}
          rank={user.rank}
          problemsSolved={user.solved}
          streak={user.streak}
          leaderboard={leaderboard.map((u) => ({
            name: u.displayName,
            solved: u.solved,
          }))}
        />,
      );

      // Send
      return resend.emails.send({
        from: "ITI Geeks <updates@notifications.muhammad-khaled-tech.com>", // Update with your Verified Domain
        to: user.email,
        subject: `🏆 Weekly Report: You ranked #${user.rank}!`,
        html: emailHtml,
      });
    });

    await Promise.allSettled(emailPromises);

    // 7. Save Snapshot (For comparison next week)
    const snapshotBatch = adminDb.batch();
    const snapshotRef = adminDb
      .collection("weekly_snapshots")
      .doc(`${new Date().getFullYear()}-W${weekNumber}`);

    // We save the full leaderboard array for easy historical access
    snapshotBatch.set(snapshotRef, {
      week: weekNumber,
      date: new Date().toISOString(),
      leaderboard: leaderboard.map((u) => ({
        uid: u.id,
        username: u.leetcodeUsername,
        solved: u.solved,
        rank: u.rank,
      })),
    });
    await snapshotBatch.commit();

    return res
      .status(200)
      .json({ success: true, processed: leaderboard.length });
  } catch (error) {
    console.error("Cron Job Failed:", error);
    return res.status(500).json({ error: error.message });
  }
}

// Helpers
function calculateActiveDays(calendar) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  // Convert logic: keys are seconds timestamps
  return Object.keys(calendar).filter((ts) => {
    const date = new Date(parseInt(ts) * 1000);
    return date >= oneWeekAgo && date <= now;
  }).length;
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return weekNo;
}
