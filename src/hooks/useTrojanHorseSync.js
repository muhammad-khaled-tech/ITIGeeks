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
  // Use a ref to hold the latest members so we don't restart the effect when members change
  const membersRef = useRef(members);

  // Keep membersRef in sync
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  useEffect(() => {
    if (!groupId) return;

    // Throttle Check using LocalStorage to persist across reloads
    const LAST_RUN_KEY = `trojan_last_run_${groupId}`;
    const lastRunTs = parseInt(localStorage.getItem(LAST_RUN_KEY) || "0");
    // Cooldown: 15 mins normally, 5 mins if active contest
    const cooldownMs = (isContestActive ? 5 : 15) * 60 * 1000;

    if (Date.now() - lastRunTs < cooldownMs) {
      // console.log("[TrojanHorse] ⏳ In cooldown. Skipping sync.");
      return;
    }

    if (hasRun.current) return;

    const runTrojanHorse = async () => {
      // Access members from ref to avoid dependency loop
      const currentMembers = membersRef.current;

      if (!currentMembers || currentMembers.length === 0) return;

      // 1. Define Staleness Threshold
      const thresholdMinutes = isContestActive ? 5 : 15;
      const thresholdTime = Date.now() - thresholdMinutes * 60 * 1000;

      // 2. Filter Candidates (Anyone not synced recently)
      const candidates = currentMembers.filter((m) => {
        const lastSync = m._syncedAt || 0;
        return lastSync < thresholdTime;
      });

      if (candidates.length === 0) {
        console.log("[TrojanHorse] 🐎 Everyone is fresh! No work needed.");
        // Mark run to update timestamp and prevent endless checks
        localStorage.setItem(LAST_RUN_KEY, Date.now().toString());
        return;
      }

      // 3. PROBABILITY CHECK: Reduce load by only running 20% of the time (increased from 10% since we have better throttling now)
      if (Math.random() > 0.2) {
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

          if (lockSnap.exists()) {
            const lockData = lockSnap.data();
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

          transaction.set(lockRef, {
            lockedBy: "peer_worker",
            lockedAt: serverTimestamp(),
          });
        });

        // 5. If lock acquired, Perform Sync
        syncUser(target.id, target.leetcodeUsername, groupId)
          .then(() => {
            console.log(`[TrojanHorse] ✅ Synced: ${target.displayName}`);
            // IMPORTANT: Update local storage only on success or definitive skip
            localStorage.setItem(LAST_RUN_KEY, Date.now().toString());
          })
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
    // REMOVED members.length from dependency to break loop
  }, [groupId, isContestActive]);
};
