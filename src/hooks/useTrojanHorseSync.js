import { useEffect, useRef } from "react";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { syncUser } from "../services/leaderboardService";

/**
 * THE TROJAN HORSE 🐎
 *
 * This hook turns every active user into a background worker.
 * It finds 1 stale user and syncs them.
 *
 * @param {string} groupId
 * @param {Array} members - List of all members in the group
 * @param {boolean} isContestActive - If true, sync threshold drops to 5 mins
 */
export const useTrojanHorseSync = (
  groupId,
  members = [],
  isContestActive = false,
) => {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!groupId || members.length === 0 || hasRun.current) return;

    const runTrojanHorse = async () => {
      // 1. Define Staleness Threshold
      // Normal: 15 mins. Contest: 5 mins.
      const thresholdMinutes = isContestActive ? 5 : 15;
      const thresholdTime = Date.now() - thresholdMinutes * 60 * 1000;

      // 2. Filter Candidates (Anyone not synced recently)
      const candidates = members.filter((m) => {
        const lastSync = m._syncedAt || 0;
        return lastSync < thresholdTime;
      });

      if (candidates.length === 0) {
        console.log("[TrojanHorse] 🐎 Everyone is fresh! No work needed.");
        return;
      }

      // 3. PROBABILITY CHECK: Reduce load by only running 10% of the time to save Quota
      // This prevents thousands of reads if many users are online
      if (Math.random() > 0.1) {
        console.log(
          "[TrojanHorse] 🎲 Skipping sync this time (load balancing).",
        );
        return;
      }

      // 4. Pick ONE random candidate
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      console.log(
        `[TrojanHorse] 🐎 Targeted: ${target.displayName} (Last sync: ${new Date(target._syncedAt || 0).toLocaleTimeString()})`,
      );

      try {
        // 4. SYNC LOCK (Prevent Thundering Herd)
        await runTransaction(db, async (transaction) => {
          const lockRef = doc(db, "syncLocks", `${groupId}_${target.id}`);
          const lockSnap = await transaction.get(lockRef);

          // If locked less than 1 min ago, someone else is doing it
          if (lockSnap.exists()) {
            const lockData = lockSnap.data();

            // Fix: Check if lockedAt exists and is a Timestamp
            if (
              lockData.lockedAt &&
              typeof lockData.lockedAt.toMillis === "function"
            ) {
              if (Date.now() - lockData.lockedAt.toMillis() < 60000) {
                throw new Error(
                  "User is already being synced by another peer.",
                );
              }
            }
          }

          // Claim the lock
          transaction.set(lockRef, {
            lockedBy: "peer_worker",
            lockedAt: serverTimestamp(),
          });
        });

        // 5. If lock acquired, Perform Sync (Non-Blocking)
        // We sync this user specifically and push to the cache
        syncUser(target.id, target.leetcodeUsername, groupId)
          .then(() =>
            console.log(`[TrojanHorse] ✅ Synced: ${target.displayName}`),
          )
          .catch((err) =>
            console.warn(`[TrojanHorse] ❌ Failed: ${target.displayName}`, err),
          );
      } catch (e) {
        console.log(`[TrojanHorse] 🔒 Skipped: ${e.message}`);
      }
    };

    // Run after a small delay to let page load first
    const timer = setTimeout(() => {
      runTrojanHorse();
      hasRun.current = true;
    }, 5000);

    return () => clearTimeout(timer);
  }, [groupId, members.length, isContestActive]);
};
