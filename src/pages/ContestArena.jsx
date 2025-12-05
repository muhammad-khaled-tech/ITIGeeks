import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { FaClock, FaCheckCircle, FaTimesCircle, FaExternalLinkAlt, FaSync } from 'react-icons/fa';
import Leaderboard from '../components/Leaderboard';

export default function ContestArena() {
    const { contestId } = useParams();
    const { userData, currentUser } = useAuth();
    const [contest, setContest] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [verifying, setVerifying] = useState(null);
    const [solvedProblems, setSolvedProblems] = useState(new Set());

    useEffect(() => {
        const fetchContest = async () => {
            const docRef = doc(db, 'contests', contestId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setContest({ id: docSnap.id, ...docSnap.data() });
            }
        };
        fetchContest();
    }, [contestId]);

    // Check already solved in this contest
    useEffect(() => {
        const checkSolved = async () => {
            if (!currentUser) return;
            const q = query(
                collection(db, 'contests', contestId, 'submissions'),
                where('userId', '==', currentUser.uid)
            );
            const snap = await getDocs(q);
            const solved = new Set(snap.docs.map(d => d.data().problemSlug));
            setSolvedProblems(solved);
        };
        checkSolved();
    }, [contestId, currentUser]);

    // Timer Logic
    useEffect(() => {
        if (!contest) return;
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(contest.endTime).getTime();
            const distance = end - now;

            if (distance < 0) {
                setTimeLeft('ENDED');
                clearInterval(interval);
            } else {
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [contest]);

    const verifySolution = async (problem) => {
        if (!userData.leetcodeUsername) return alert("Please set your LeetCode username in Profile first!");

        setVerifying(problem.slug);
        try {
            // Fetch recent submissions from proxy
            const res = await fetch(`https://alfa-leetcode-api.onrender.com/user/${userData.leetcodeUsername}/ac-submission-records`);
            const data = await res.json();

            // Logic: Find submission for this problem
            // Note: API returns 'titleSlug' usually.
            // We need to check if timestamp > contest.startTime

            const contestStart = new Date(contest.startTime).getTime();
            const validSubmission = data.submission?.find(sub => {
                // API timestamp is usually unix timestamp (seconds) or string
                // Let's assume standard unix timestamp string or number
                const subTime = parseInt(sub.timestamp) * 1000;
                return sub.titleSlug === problem.slug && subTime > contestStart;
            });

            if (validSubmission) {
                // Add to Firestore
                await addDoc(collection(db, 'contests', contestId, 'submissions'), {
                    userId: currentUser.uid,
                    username: userData.leetcodeUsername,
                    problemSlug: problem.slug,
                    score: problem.score,
                    timestamp: new Date().toISOString()
                });
                setSolvedProblems(prev => new Set(prev).add(problem.slug));

                // Trigger Confetti
                const confetti = (await import('canvas-confetti')).default;
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });

                alert(`Correct! +${problem.score} points`);
            } else {
                alert("No valid submission found after contest start time. Make sure you solved it on LeetCode recently.");
            }

        } catch (e) {
            console.error(e);
            alert("Verification failed. API might be down.");
        } finally {
            setVerifying(null);
        }
    };

    if (!contest) return <div className="p-6">Loading Arena...</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Problems & Timer */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-leet-card rounded-lg shadow p-6 border-l-4 border-brand">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold dark:text-white">{contest.title}</h1>
                        <div className="text-xl font-mono font-bold bg-gray-100 dark:bg-leet-input px-4 py-2 rounded flex items-center gap-2 dark:text-white">
                            <FaClock className={timeLeft === 'ENDED' ? 'text-red-500' : 'text-green-500'} />
                            {timeLeft}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-leet-card rounded-lg shadow overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-leet-input">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Problem</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Points</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-leet-border">
                            {contest.problems.map((p, i) => {
                                const isSolved = solvedProblems.has(p.slug);
                                return (
                                    <tr key={i} className={isSolved ? "bg-green-50 dark:bg-green-900/20" : ""}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <a
                                                href={`https://leetcode.com/problems/${p.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-brand dark:text-brand-dark font-medium hover:underline flex items-center gap-1"
                                            >
                                                {p.slug} <FaExternalLinkAlt size={12} />
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold dark:text-white">
                                            {p.score}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {isSolved ? (
                                                <span className="text-green-600 font-bold flex items-center justify-end gap-1">
                                                    <FaCheckCircle /> Solved
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => verifySolution(p)}
                                                    disabled={verifying === p.slug || timeLeft === 'ENDED'}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 ml-auto disabled:opacity-50"
                                                >
                                                    {verifying === p.slug ? <FaSync className="animate-spin" /> : 'Verify'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right: Leaderboard */}
            <div className="lg:col-span-1">
                <Leaderboard contestId={contest.id} />
            </div>
        </div>
    );
}
