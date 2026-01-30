import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, documentId, getDocs } from 'firebase/firestore';
import { FaMedal, FaTrophy } from 'react-icons/fa';
import Badge from './Badge';

// Global memory cache for user metadata to avoid redundant lookups
const userMetadataCache = new Map();

const Leaderboard = ({ contestId }) => {
    const [rankings, setRankings] = useState([]);

    useEffect(() => {
        if (!contestId) return;
        const q = query(collection(db, 'contests', contestId, 'submissions'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const subs = snapshot.docs.map(d => d.data());
            const userScores = {};
            const userIds = new Set();

            subs.forEach(s => {
                userIds.add(s.userId);
                if (!userScores[s.userId]) {
                    userScores[s.userId] = {
                        userId: s.userId,
                        username: s.username,
                        totalScore: 0,
                        problemsSolved: new Set(),
                        lastSubmissionTime: 0
                    };
                }
                if (!userScores[s.userId].problemsSolved.has(s.problemSlug)) {
                    userScores[s.userId].problemsSolved.add(s.problemSlug);
                    userScores[s.userId].totalScore += s.score;
                    const time = new Date(s.timestamp).getTime();
                    if (time > userScores[s.userId].lastSubmissionTime) {
                        userScores[s.userId].lastSubmissionTime = time;
                    }
                }
            });

            // ⚡ BATCH METADATA FETCH: Fetch all missing user data in one trip
            const missingUserIds = Array.from(userIds).filter(id => !userMetadataCache.has(id));
            
            if (missingUserIds.length > 0) {
                // Firestore 'in' query works for up to 30 items
                // For larger groups, we'd chunk this, but for common contests 30 is plenty
                const chunks = [];
                for (let i = 0; i < missingUserIds.length; i += 30) {
                    chunks.push(missingUserIds.slice(i, i + 30));
                }

                await Promise.all(chunks.map(async (chunk) => {
                    const uQuery = query(collection(db, 'users'), where(documentId(), 'in', chunk));
                    const uSnap = await getDocs(uQuery);
                    uSnap.docs.forEach(doc => {
                        userMetadataCache.set(doc.id, doc.data());
                    });
                }));
            }

            const sorted = Object.values(userScores).sort((a, b) => {
                if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
                return a.lastSubmissionTime - b.lastSubmissionTime;
            });

            // Attach badges & verify display names
            const ranked = sorted.map(u => {
                const meta = userMetadataCache.get(u.userId) || {};
                return {
                    ...u,
                    username: meta.displayName || u.username, // Priority to DB name
                    badges: meta.badges || []
                };
            });

            setRankings(ranked);
        });

        return unsubscribe;
    }, [contestId]);

    const getRankStyle = (index) => {
        if (index === 0) return "bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-400";
        if (index === 1) return "bg-gray-100 dark:bg-gray-800/50 border-l-4 border-gray-400";
        if (index === 2) return "bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-400";
        return "hover:bg-gray-50 dark:hover:bg-leet-input border-l-4 border-transparent";
    };

    const getMedalIcon = (index) => {
        if (index === 0) return <FaTrophy className="text-yellow-500 text-xl" />;
        if (index === 1) return <FaMedal className="text-gray-400 text-lg" />;
        if (index === 2) return <FaMedal className="text-orange-500 text-lg" />;
        return <span className="font-mono font-bold text-gray-500 dark:text-gray-400">#{index + 1}</span>;
    };

    return (
        <div className="bg-white dark:bg-leet-card rounded-xl shadow-2xl border border-gray-100 dark:border-leet-border overflow-hidden">
            <div className="bg-brand px-4 py-3 border-b border-brand-dark">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <FaMedal /> Live Leaderboard
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-leet-input">
                        <tr>
                            <th className="px-4 py-2 text-left dark:text-gray-300 w-16">Rank</th>
                            <th className="px-4 py-2 text-left dark:text-gray-300">User</th>
                            <th className="px-4 py-2 text-right dark:text-gray-300">Solved</th>
                            <th className="px-4 py-2 text-right dark:text-gray-300">Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-leet-border">
                        {rankings.map((r, i) => (
                            <tr key={r.userId} className={`transition duration-150 ${getRankStyle(i)}`}>
                                <td className="px-4 py-3 flex items-center justify-center">
                                    {getMedalIcon(i)}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold dark:text-white">{r.username}</span>
                                        {r.badges.length > 0 && (
                                            <div className="scale-75 origin-left">
                                                <Badge name={r.badges[r.badges.length - 1]} size="sm" />
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right dark:text-gray-400 font-mono">{r.problemsSolved.size}</td>
                                <td className="px-4 py-3 text-right font-bold text-brand dark:text-brand-dark text-lg">{r.totalScore}</td>
                            </tr>
                        ))}
                        {rankings.length === 0 && (
                            <tr><td colSpan="4" className="text-center py-4 text-gray-500">No submissions yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Leaderboard;
