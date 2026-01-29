import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export const useLinkImport = () => {
  const { userData, updateUserData } = useAuth();
  const [importing, setImporting] = useState(false);

  const importFromLink = useCallback(
    async (url) => {
      if (!url) return;
      setImporting(true);

      try {
        let problems = [];

        // Parse the URL to determine the type and ID
        if (url.includes("/list/")) {
          // LeetCode list format
          const listId = url.split("/list/")[1]?.split("/")[0]?.split("?")[0];
          if (!listId) throw new Error("Invalid list URL");
          problems = await fetchListProblems(listId);
        } else if (url.includes("/studyplan/")) {
          // Study plan format
          const planSlug = url
            .split("/studyplan/")[1]
            ?.split("/")[0]
            ?.split("?")[0];
          if (!planSlug) throw new Error("Invalid study plan URL");
          problems = await fetchStudyPlanProblems(planSlug);
        } else if (url.includes("/tag/")) {
          // Tag format
          const tagSlug = url.split("/tag/")[1]?.split("/")[0]?.split("?")[0];
          if (!tagSlug) throw new Error("Invalid tag URL");
          problems = await fetchTagProblems(tagSlug);
        } else {
          throw new Error(
            "Unsupported URL format. Please use a list, study plan, or tag URL.",
          );
        }

        if (problems.length === 0) {
          throw new Error("No problems found at this URL");
        }

        // Merge with existing problems
        const existing = userData?.problems || [];
        const existingMap = new Map(existing.map((p) => [p.titleSlug, p]));

        let addedCount = 0;
        problems.forEach((p) => {
          if (!existingMap.has(p.titleSlug)) {
            existingMap.set(p.titleSlug, p);
            addedCount++;
          }
        });

        const mergedProblems = Array.from(existingMap.values());

        await updateUserData({
          ...userData,
          problems: mergedProblems,
        });

        alert(
          `Successfully imported ${addedCount} new problems from the link!`,
        );
      } catch (error) {
        console.error("Link import failed:", error);
        throw error;
      } finally {
        setImporting(false);
      }
    },
    [userData, updateUserData],
  );

  return { importFromLink, importing };
};

// Helper function to fetch problems from a LeetCode list
async function fetchListProblems(listId) {
  // Note: LeetCode lists may require authentication or may not be publicly accessible
  // This is a basic implementation that may need adjustment based on LeetCode's API
  const query = {
    query: `
            query favoritesList($listId: String!) {
                favoritesList(listId: $listId) {
                    questions {
                        titleSlug
                        title
                        difficulty
                    }
                }
            }
        `,
    variables: { listId },
  };

  const response = await fetch("/api/leetcode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });

  if (!response.ok) throw new Error("Failed to fetch list problems");

  const data = await response.json();
  if (data.errors) throw new Error(data.errors[0]?.message || "GraphQL error");

  const questions = data.data?.favoritesList?.questions || [];
  return questions.map((q) => ({
    title: q.title,
    titleSlug: q.titleSlug,
    difficulty: q.difficulty,
    status: "Todo",
    addedAt: new Date().toISOString(),
  }));
}

// Helper function to fetch problems from a study plan
async function fetchStudyPlanProblems(planSlug) {
  const query = {
    query: `
            query studyPlanDetail($slug: String!) {
                studyPlanV2Detail(planSlug: $slug) {
                    planSubGroups {
                        questions {
                            titleSlug
                            title
                            difficulty
                        }
                    }
                }
            }
        `,
    variables: { slug: planSlug },
  };

  const response = await fetch("/api/leetcode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });

  if (!response.ok) throw new Error("Failed to fetch study plan problems");

  const data = await response.json();
  if (data.errors) throw new Error(data.errors[0]?.message || "GraphQL error");

  const subGroups = data.data?.studyPlanV2Detail?.planSubGroups || [];
  const questions = subGroups.flatMap((group) => group.questions || []);

  return questions.map((q) => ({
    title: q.title,
    titleSlug: q.titleSlug,
    difficulty: q.difficulty,
    status: "Todo",
    addedAt: new Date().toISOString(),
  }));
}

// Helper function to fetch problems from a tag
async function fetchTagProblems(tagSlug) {
  const query = {
    query: `
            query problemsetQuestionList($categorySlug: String, $filters: QuestionListFilterInput) {
                problemsetQuestionList: questionList(
                    categorySlug: $categorySlug
                    filters: $filters
                ) {
                    questions {
                        titleSlug
                        title
                        difficulty
                    }
                }
            }
        `,
    variables: {
      categorySlug: "",
      filters: { tags: [tagSlug] },
    },
  };

  const response = await fetch("/api/leetcode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });

  if (!response.ok) throw new Error("Failed to fetch tag problems");

  const data = await response.json();
  if (data.errors) throw new Error(data.errors[0]?.message || "GraphQL error");

  const questions = data.data?.problemsetQuestionList?.questions || [];

  return questions.map((q) => ({
    title: q.title,
    titleSlug: q.titleSlug,
    difficulty: q.difficulty,
    status: "Todo",
    addedAt: new Date().toISOString(),
  }));
}
