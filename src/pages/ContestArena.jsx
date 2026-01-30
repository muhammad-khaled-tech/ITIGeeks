import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { FaClock, FaCheckCircle, FaTimesCircle, FaExternalLinkAlt, FaSync, FaChevronRight } from 'react-icons/fa';
import Breadcrumbs from '../components/Breadcrumbs';
import Leaderboard from '../components/Leaderboard';
import { syncContestSubmissions } from '../services/leaderboardService';

export default function ContestArena() {
    const { contestId } = useParams();
    const { userData, currentUser } = useAuth();
    const [contest, setContest] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [solvedProblems, setSolvedProblems] = useState(new Set());

    useEffect(() => {
        const fetchContest = async () => {
            if (!contestId) return;
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

    const handleSync = async () => {
        if (!userData?.leetcodeUsername) return alert("Please set your LeetCode username in Profile first!");
        
        setSyncing(true);
        try {
            const res = await syncContestSubmissions(
                userData.leetcodeUsername,
                currentUser.uid,
                contestId
            );

            if (res.newlySolvedCount > 0) {
                alert(`Sync Complete! You solved ${res.newlySolvedCount} new problems in this contest.`);
                
                // Fetch updated solved problems
                const q = query(
                    collection(db, 'contests', contestId, 'submissions'),
                    where('userId', '==', currentUser.uid)
                );
                const snap = await getDocs(q);
                setSolvedProblems(new Set(snap.docs.map(d => d.data().problemSlug)));

                // Trigger Confetti
                const confetti = (await import('canvas-confetti')).default;
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 }
                });
            } else {
                alert("Everything is up to date.");
            }
        } catch (e) {
            console.error("Sync error:", e);
            alert("Sync failed. " + e.message);
        } finally {
            setSyncing(false);
        }
    };

    if (!contest) return <div className="p-6">Loading Arena...</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 pb-20">
            {/* Breadcrumbs */}
            <Breadcrumbs customLastLabel={contest.title} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Left: Problems & Timer */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-leet-card rounded-2xl shadow-xl p-6 md:p-8 border-l-8 border-brand">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-black italic dark:text-white uppercase tracking-tight">{contest.title}</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold mt-1 uppercase tracking-widest">Contest Arena</p>
                            </div>
                            <div className="text-xl font-mono font-black bg-gray-100 dark:bg-leet-input px-6 py-3 rounded-xl flex items-center gap-3 dark:text-white shadow-inner">
                                <FaClock className={timeLeft === 'ENDED' ? 'text-red-500' : 'text-green-500 animate-pulse'} />
                                {timeLeft}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-leet-card rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b dark:border-leet-border bg-yellow-50 dark:bg-yellow-900/10 flex flex-col md:flex-row items-center gap-4">
                            <div className="flex items-center gap-2 flex-grow">
                                <FaSync className={syncing ? "text-yellow-600 animate-spin" : "text-yellow-600"} />
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    <strong>Solved a problem on LeetCode?</strong> Click sync to update your score.
                                </p>
                            </div>
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <FaSync className={syncing ? "animate-spin" : ""} />
                                {syncing ? "Syncing..." : "Sync Progress"}
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-leet-border">
                                <thead className="bg-gray-50 dark:bg-leet-input">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Problem</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Difficulty</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Points</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-leet-border">
                                    {contest.problems.map((p, i) => {
                                        const isSolved = solvedProblems.has(p.slug);
                                        const title = p.title || p.slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                        
                                        // Default difficulty fallback logic
                                        const difficulty = p.difficulty || (p.score <= 25 ? 'Easy' : p.score <= 50 ? 'Medium' : 'Hard');
                                        const diffColor = difficulty === 'Easy' ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 
                                                        difficulty === 'Medium' ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 
                                                        'text-red-500 bg-red-50 dark:bg-red-900/20';

                                        return (
                                            <tr key={i} className={isSolved ? "bg-green-50/50 dark:bg-green-900/10" : "hover:bg-gray-50 dark:hover:bg-brand/5"}>
                                                <td className="px-4 py-5 max-w-xs">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black dark:text-white leading-tight">
                                                            {title}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter mt-1 opacity-70">
                                                            ID: {p.slug}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-current ${diffColor}`}>
                                                        {difficulty}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <span className="text-xs font-black dark:text-gray-300">
                                                        {p.score} <span className="text-[10px] opacity-50">PTS</span>
                                                    </span>
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    {isSolved ? (
                                                        <span className="text-[10px] font-black text-green-600 dark:text-green-500 uppercase tracking-widest flex items-center justify-center gap-1">
                                                            <FaCheckCircle /> SOLVED
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1">
                                                            <FaClock /> PENDING
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-5 text-right">
                                                    {!isSolved && (
                                                        <a
                                                            href={`https://leetcode.com/problems/${p.slug}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95"
                                                        >
                                                            Solve <FaExternalLinkAlt size={10} />
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Leaderboard - Sticky! */}
                <div className="lg:col-span-1 sticky top-20">
                    <Leaderboard contestId={contest.id} />
                </div>
            </div>
        </div>
    );
}
