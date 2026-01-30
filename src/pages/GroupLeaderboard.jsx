import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    FaTrophy, FaFire, FaSync, FaChartLine, FaMedal, 
    FaSpinner, FaExclamationTriangle, FaArrowUp, FaArrowDown,
    FaGamepad, FaGlobe
} from 'react-icons/fa';
import Breadcrumbs from '../components/Breadcrumbs';
import EnhancedLeaderboard from '../components/EnhancedLeaderboard';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getGroupLeaderboard, getContestLeaderboard, refreshLeaderboard, silentGroupSync, processLeaderboard as serviceProcess } from '../services/leaderboardService';
import clsx from 'clsx';

const GroupLeaderboard = () => {
    const { userData, currentUser } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [priorityReady, setPriorityReady] = useState(false);
    const [error, setError] = useState(null);
    const [leaderboardMode, setLeaderboardMode] = useState('overall'); // 'overall' | 'contests'
    const groupId = userData?.groupId;

    useEffect(() => {
        if (!groupId) {
            if (userData !== null) setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // 1. Listen for real-time updates from Cache
        const cacheRef = doc(db, 'leaderboardCache', groupId);
        const unsubscribe = onSnapshot(cacheRef, async (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                // Handle both array (old) and map (new progressive) formats
                const rawMembers = data.members || {};
                const membersArray = Array.isArray(rawMembers) ? rawMembers : Object.values(rawMembers);
                
                // Update UI state
                setLeaderboard(serviceProcess(membersArray, 'all'));
                setLoading(false);

                // If we are in a prioritized refresh, check if WE are ready
                if (refreshing && currentUser?.uid && !Array.isArray(rawMembers)) {
                    const myData = rawMembers[currentUser.uid];
                    // If my data was synced in the last 10 seconds, I'm likely the priority user who just finished
                    if (myData && myData._syncedAt && (Date.now() - myData._syncedAt < 10000)) {
                        console.log("[Priority] My stats confirmed in cache!");
                        setPriorityReady(true);
                        setRefreshing(false);
                    }
                }

                // 2. Trigger background sync if stale (more than 1 hour)
                const lastUpdated = data.lastUpdated?.toDate?.() || new Date(0);
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                
                if (lastUpdated < oneHourAgo && !refreshing) {
                    console.log("[Auto-Sync] Data is stale, updating in background...");
                    // No await here
                    silentGroupSync(groupId, rawMembers).catch(err => console.error(err));
                }
            } else {
                // Initial fetch if no cache exists
                try {
                    const data = await getGroupLeaderboard(groupId, 'all');
                    setLeaderboard(data);
                } catch (err) {
                    setError('Failed to load leaderboard.');
                } finally {
                    setLoading(false);
                }
            }
        }, (err) => {
            console.error(err);
            setError('Failed to connect to leaderboard.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [groupId, leaderboardMode, userData]);

    const handleRefresh = async () => {
        if (!currentUser?.uid || !groupId) return;
        
        setRefreshing(true);
        setPriorityReady(false);

        try {
            const result = await refreshLeaderboard(groupId, currentUser.uid);
            
            if (result.success) {
                if (result.priorityReady) {
                    // Priority user is ready, the spinner is likely already stopped by onSnapshot
                    // but we set it again for safety. The user gets a success message.
                    setPriorityReady(true);
                    setRefreshing(false);
                } else if (result.data) {
                    setLeaderboard(result.data);
                    setRefreshing(false);
                }
            } else {
                alert(result.message);
                setRefreshing(false);
            }
        } catch (err) {
            console.error(err);
            setRefreshing(false);
        }
    };

    const getRankBadge = (rank) => {
        if (rank === 1) return <span className="text-2xl">🥇</span>;
        if (rank === 2) return <span className="text-2xl">🥈</span>;
        if (rank === 3) return <span className="text-2xl">🥉</span>;
        return <span className="text-lg font-bold text-gray-500 dark:text-gray-400">#{rank}</span>;
    };

    if (!groupId) {
        return (
            <div className="max-w-4xl mx-auto mt-8 p-8 bg-white dark:bg-leet-card rounded-xl shadow-lg text-center">
                <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold dark:text-white mb-2">No Group Assigned</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    You need to be assigned to a group to view the leaderboard.
                    Please contact your supervisor.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-4">
            <Breadcrumbs />
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                        <FaTrophy className="text-yellow-500" />
                        Group Leaderboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Compete with your peers and climb the ranks!
                    </p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || leaderboardMode === 'contests'}
                        className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg disabled:opacity-50 transition-colors"
                        title={leaderboardMode === 'contests' ? "Contest points refresh automatically" : ""}
                    >
                        <FaSync className={refreshing && !priorityReady ? 'animate-spin' : ''} />
                        {refreshing ? (priorityReady ? 'Syncing others...' : 'Refreshing...') : 'Refresh Stats'}
                    </button>
                    {priorityReady && refreshing && (
                        <span className="text-xs text-brand font-medium animate-pulse">
                            ✅ Your stats updated! syncing classmates...
                        </span>
                    )}
                </div>
            </div>

            {/* Main Tabs (Overall vs Contests) */}
            <div className="flex border-b dark:border-leet-border mb-6">
                <button
                    onClick={() => setLeaderboardMode('overall')}
                    className={`px-6 py-3 font-bold flex items-center gap-2 border-b-2 transition-colors ${
                        leaderboardMode === 'overall' 
                            ? 'border-brand text-brand' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <FaGlobe /> Overall Progress
                </button>
                <button
                    onClick={() => setLeaderboardMode('contests')}
                    className={`px-6 py-3 font-bold flex items-center gap-2 border-b-2 transition-colors ${
                        leaderboardMode === 'contests' 
                            ? 'border-brand text-brand' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <FaGamepad /> ITI Contests
                </button>
            </div>

            {/* Time Period Tabs (Handled by EnhancedLeaderboard for overall) */}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <FaSpinner className="text-4xl text-brand animate-spin" />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                    <button
                        onClick={loadLeaderboard}
                        className="mt-2 text-sm text-red-700 dark:text-red-300 underline"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Leaderboard Content */}
            {!loading && !error && (
                leaderboardMode === 'overall' ? (
                    <EnhancedLeaderboard members={leaderboard} currentUserId={currentUser?.uid} />
                ) : (
                    <div className="bg-white dark:bg-leet-card rounded-xl shadow-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-leet-input">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Rank
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-brand">
                                        <div className="flex items-center justify-center gap-1">
                                            Points
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Contests Won
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-leet-border">
                                {leaderboard.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No students found in this group for contests.
                                        </td>
                                    </tr>
                                ) : (
                                    leaderboard.map((member, index) => {
                                        const isCurrentUser = member.id === currentUser?.uid;
                                        return (
                                            <tr 
                                                key={member.id}
                                                className={clsx(
                                                    "hover:bg-gray-50 dark:hover:bg-leet-input transition-colors",
                                                    isCurrentUser ? 'bg-brand/5 dark:bg-brand/10' : ''
                                                )}
                                            >
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    {getRankBadge(index + 1)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-brand to-brand-hover rounded-full flex items-center justify-center text-white font-bold">
                                                            {member.displayName?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className={clsx("font-medium", isCurrentUser ? 'text-brand' : 'dark:text-white')}>
                                                                {member.displayName}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                @{member.leetcodeUsername}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="text-xl font-bold text-brand">
                                                        {member.contestPoints || 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="text-gray-500">-</span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* Legend */}
            {!loading && !error && leaderboard.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <FaFire className="text-gray-400" />
                        <span>1-6 days</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FaFire className="text-yellow-500" />
                        <span>7-13 days</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FaFire className="text-orange-500" />
                        <span>14-29 days</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FaFire className="text-red-500 text-xl" />
                        <span>30+ days 🔥</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupLeaderboard;
