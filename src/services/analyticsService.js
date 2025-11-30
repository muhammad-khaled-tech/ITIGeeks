import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const API_BASE = 'https://alfa-leetcode-api.onrender.com';

// Helper to batch promises
async function batchRequests(items, batchSize, fn) {
    let results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(fn));
        results = [...results, ...batchResults];
        // Small delay to be nice to the API
        if (i + batchSize < items.length) await new Promise(r => setTimeout(r, 1000));
    }
    return results;
}

export const analyticsService = {
    async fetchGroupStats(groupId) {
        try {
            // 1. Get Users
            let q = query(collection(db, 'users'));
            if (groupId !== 'All') {
                q = query(collection(db, 'users'), where('groupId', '==', groupId));
            }
            const snapshot = await getDocs(q);
            const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Filter users with leetcode usernames
            const validUsers = users.filter(u => u.leetcodeUsername);

            // 2. Fetch Stats for each user (Batched)
            const stats = await batchRequests(validUsers, 5, async (user) => {
                try {
                    const res = await fetch(`${API_BASE}/user/${user.leetcodeUsername}/skill-stats`);
                    if (!res.ok) throw new Error('Failed');
                    const data = await res.json();
                    return {
                        ...user,
                        skillStats: data.data?.matchedUser?.tagProblemCounts || {},
                        totalSolved: data.data?.matchedUser?.submitStats?.acSubmissionNum?.[0]?.count || 0,
                        easySolved: data.data?.matchedUser?.submitStats?.acSubmissionNum?.[1]?.count || 0,
                        mediumSolved: data.data?.matchedUser?.submitStats?.acSubmissionNum?.[2]?.count || 0,
                        hardSolved: data.data?.matchedUser?.submitStats?.acSubmissionNum?.[3]?.count || 0,
                    };
                } catch (e) {
                    console.warn(`Failed to fetch stats for ${user.leetcodeUsername}`, e);
                    return { ...user, error: true };
                }
            });

            return stats;
        } catch (error) {
            console.error("Error fetching group stats:", error);
            throw error;
        }
    },

    async fetchStudentDetails(username) {
        try {
            // Fetch Submission Calendar / Recent Submissions
            const res = await fetch(`${API_BASE}/user/${username}/ac-submission-records`);
            const data = await res.json();
            return data.submission || [];
        } catch (error) {
            console.error("Error fetching student details:", error);
            return [];
        }
    },

    generateWeaknessReport(user) {
        if (!user.skillStats) return "No data available.";

        // Simplified Logic: Check ratio of Easy vs Medium/Hard
        const total = user.totalSolved || 0;
        if (total < 10) return "Student is just starting. Encourage solving more Easy problems.";

        const easy = user.easySolved || 0;
        const medium = user.mediumSolved || 0;
        const hard = user.hardSolved || 0;

        const easyRatio = easy / total;

        if (easyRatio > 0.7) {
            return "Student solves mostly Easy problems. Recommendation: Assign more Medium problems to build depth.";
        }

        // Check specific tags if available (Advanced/Intermediate/Fundamental)
        // The API returns tags in categories.
        // For this demo, we'll stick to difficulty distribution.

        if (hard === 0 && medium > 20) {
            return "Student is comfortable with Mediums. Recommendation: Challenge them with a Hard problem.";
        }

        return "Student has a balanced profile. Keep up the good work!";
    }
};
