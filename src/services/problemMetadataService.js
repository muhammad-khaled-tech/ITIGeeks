import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const memoryCache = new Map();

let firestoreEnabled = true;

/**
 * Get problem difficulty and points from cache or LeetCode GraphQL
 * @param {string} titleSlug
 * @returns {Object} { difficulty, points }
 */
export async function getProblemDifficulty(titleSlug) {
  if (!titleSlug) return { difficulty: "Easy", points: 25 };

  // 1. Memory Cache lookup
  if (memoryCache.has(titleSlug)) {
    return memoryCache.get(titleSlug);
  }

  // 2. Firestore Cache lookup (Only if enabled and permissions work)
  if (firestoreEnabled) {
    try {
      const docRef = doc(db, "problemMetadata", titleSlug);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        memoryCache.set(titleSlug, data);
        return data;
      }
    } catch (e) {
      if (
        e.code === "permission-denied" ||
        e.message.includes("permission") ||
        e.code === "resource-exhausted"
      ) {
        firestoreEnabled = false;
        const reason =
          e.code === "resource-exhausted"
            ? "QUOTA EXCEEDED"
            : "PERMISSION DENIED";
        console.error(
          `[Metadata] 🔒 Firestore ${reason}. Cache disabled for this session.`,
        );
      }
    }
  }

  // 3. GraphQL Fallback (Via Internal Proxy to avoid CORS)
  try {
    const response = await fetch("/api/leetcode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query getQuestionDifficulty($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              difficulty
            }
          }
        `,
        variables: { titleSlug },
      }),
    });

    if (!response.ok) {
      console.warn(
        `[Metadata] ❌ Proxy request failed for ${titleSlug}: Status ${response.status}`,
      );
      // Return Unknown so the caller knows it failed and can count it towards the abort limit
      return { difficulty: "Unknown", points: 0 };
    }

    const result = await response.json();

    if (result.errors) {
      console.warn(
        `[Metadata] ⚠️ Proxy returned GraphQL errors for ${titleSlug}:`,
        result.errors,
      );
    }

    const difficulty = result?.data?.question?.difficulty || "Easy";

    // Map points
    let points = 25;
    if (difficulty === "Medium") points = 50;
    if (difficulty === "Hard") points = 100;

    const meta = { difficulty, points, updatedAt: Date.now() };

    // Save to Firestore (Fire and forget - failures are logged but don't stop us)
    // OPTIMIZATION: Check if we really need to save? (Maybe memory cache had it but it was stale?)
    // In this flow, we only save if we successfully fetched fresh data.
    if (firestoreEnabled) {
      const docRef = doc(db, "problemMetadata", titleSlug);
      // Read first to avoid overwrite if exists (optional but safer) or just blindly write
      // For quota safety, let's just write.

      setDoc(docRef, meta).catch((err) => {
        if (err.code === "resource-exhausted") {
          firestoreEnabled = false;
          console.error(
            "[Metadata] 🔒 Firestore QUOTA EXCEEDED during save. Disabling writes.",
          );
        } else {
          // console.warn(
          //   `[Metadata] 🗄️ Failed to save ${titleSlug} to Firestore:`,
          //   err.message,
          // );
          // Suppress common permission errors to keep console clean
        }
      });
    }

    memoryCache.set(titleSlug, meta);
    return meta;
  } catch (e) {
    console.error(
      `[Metadata] 💥 Critical error fetching difficulty for ${titleSlug}:`,
      e,
    );
    return { difficulty: "Unknown", points: 0 }; // Default fallback
  }
}

/**
 * Enrich a list of submissions with difficulty data
 * Optimizes by only fetching metadata for unique slugs once
 */
export async function enrichSubmissions(submissions = []) {
  if (!submissions.length) {
    console.log("[Metadata] ℹ️ No submissions to enrich.");
    return [];
  }

  // 1. Identify unique slugs to fetch
  const uniqueSlugs = [
    ...new Set(submissions.map((s) => s.titleSlug).filter(Boolean)),
  ];

  // 2. Fetch metadata for unique slugs (sequentially to avoid 429s)
  const metaMap = new Map();
  for (const slug of uniqueSlugs) {
    const meta = await getProblemDifficulty(slug);
    metaMap.set(slug, meta);
  }

  // 3. Map metadata back to original submission list
  const result = submissions.map((sub) => {
    const meta = metaMap.get(sub.titleSlug) || {
      difficulty: "Unknown",
      points: 0,
    };
    return {
      ...sub,
      difficulty: meta.difficulty,
      points: meta.points,
    };
  });

  return result;
}
