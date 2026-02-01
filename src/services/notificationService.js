// src/services/notificationService.js
import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Real-Time Group Activity Notification System
 * Triggers notifications when group members solve problems
 */

export class NotificationService {
  /**
   * Create a notification event for group activity
   * Optimized: Embeds display name to avoid N+1 reads in listeners
   */
  static async createActivityNotification(groupId, userId, userName, activity) {
    if (!groupId || !userId) return;

    try {
      await addDoc(collection(db, "groupActivity"), {
        groupId,
        userId,
        userName: userName || "Someone", // Embedded for performance
        type: activity.type, // 'problem_solved', 'streak_milestone', etc.
        data: activity.data,
        timestamp: serverTimestamp(),
      });

      console.log(
        `[Notification] ✅ Created: ${activity.type} for user ${userName}`,
      );
    } catch (error) {
      console.error("[Notification] ❌ Failed to create:", error);
    }
  }

  /**
   * Listen to group activity in real-time
   * @param {string} groupId - Group to monitor
   * @param {string} currentUserId - Current user (to filter out own activities)
   * @param {function} onActivity - Callback when new activity occurs
   */
  static listenToGroupActivity(groupId, currentUserId, onActivity) {
    if (!groupId) return null;

    console.log(`[Notification] 📡 Starting listener for group: ${groupId}`);

    // Simplified Query: Order by time only to ensure we get the ABSOLUTE latest
    const q = query(
      collection(db, "groupActivity"),
      where("groupId", "==", groupId),
      orderBy("timestamp", "desc"),
      limit(10),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const activity = change.doc.data();

            // 1. Filter out current user in JS
            if (activity.userId === currentUserId) return;

            // 2. Safety: Only process very recent activities
            const activityTime = activity.timestamp?.toMillis() || Date.now();
            const age = Date.now() - activityTime;

            if (age < 30000) {
              // Safety: Process if less than 30s old
              onActivity(activity);
            }
          }
        });
      },
      (error) => {
        console.error("[Notification] 📡 Listener error:", error);
      },
    );
  }
}

/**
 * Activity Types & Message Formatters
 */
export const ACTIVITY_TYPES = {
  PROBLEM_SOLVED: "problem_solved",
  STREAK_MILESTONE: "streak_milestone",
  TOTAL_MILESTONE: "total_milestone",
  RANK_CHANGE: "rank_change",
};

export function formatActivityMessage(activity) {
  const userName = activity.userName || "A teammate";

  switch (activity.type) {
    case ACTIVITY_TYPES.PROBLEM_SOLVED:
      const { problemSlug, difficulty } = activity.data;
      const emoji =
        { Easy: "✅", Medium: "⚡", Hard: "🔥" }[difficulty] || "📝";
      return {
        title: `${emoji} Problem Solved`,
        message: `${userName} just solved "${problemSlug}"`,
        icon: emoji,
      };

    case ACTIVITY_TYPES.STREAK_MILESTONE:
      return {
        title: "🔥 Streak Milestone!",
        message: `${userName} reached a ${activity.data.streak} day streak!`,
        icon: "🔥",
      };

    case ACTIVITY_TYPES.TOTAL_MILESTONE:
      return {
        title: "🏆 Milestone Reached",
        message: `${userName} solved ${activity.data.total} total problems!`,
        icon: "🏆",
      };

    default:
      return {
        title: "Activity Update",
        message: `${userName} is making progress!`,
        icon: "🚀",
      };
  }
}
