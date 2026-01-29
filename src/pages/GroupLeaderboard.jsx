import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    FaTrophy, FaFire, FaSync, FaChartLine, FaMedal, 
    FaSpinner, FaExclamationTriangle, FaArrowUp, FaArrowDown,
    FaGamepad, FaGlobe
} from 'react-icons/fa';
import { getGroupLeaderboard, getContestLeaderboard, refreshLeaderboard } from '../services/leaderboardService';

const TIME_PERIODS = [
    { id: 'all', label: 'All Time' },
    { id: 'month', label: 'This Month' },
    { id: 'week', label: 'This Week' }
];

const GroupLeaderboard = () => {
    const { userData, currentUser } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [timePeriod, setTimePeriod] = useState('all');
    const [leaderboardMode, setLeaderboardMode] = useState('overall'); // 'overall' | 'contests'
    const [sortBy, setSortBy] = useState('totalPoints');
    const [sortOrder, setSortOrder] = useState('desc');

    const groupId = userData?.groupId;

    useEffect(() => {
        if (groupId) {
            loadLeaderboard();
        } else if (userData !== null) {
            setLoading(false);
        }
    }, [groupId, timePeriod, leaderboardMode, userData]);

    useEffect(() => {
        // Reset sort when mode changes
        setSortBy(leaderboardMode === 'overall' ? 'totalPoints' : 'contestPoints');
        setSortOrder('desc');
    }, [leaderboardMode]);

    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = leaderboardMode === 'overall' 
                ? await getGroupLeaderboard(groupId, timePeriod)
                : await getContestLeaderboard(groupId);
            setLeaderboard(data);
        } catch (err) {
            console.error('Failed to load leaderboard:', err);
            // Provide more helpful error message based on error type
            if (err.message?.includes('permission')) {
                setError('Permission denied. Please check Firestore rules allow reading the leaderboardCache collection.');
            } else if (err.message?.includes('index')) {
                setError('Database index required. Check browser console for the index creation link.');
            } else {
                setError('Failed to load leaderboard. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (!currentUser?.uid || !groupId) return;
        
        setRefreshing(true);
        const result = await refreshLeaderboard(groupId, currentUser.uid);
        
        if (result.success) {
            setLeaderboard(result.data);
        } else {
            alert(result.message);
        }
        setRefreshing(false);
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const sortedLeaderboard = [...leaderboard].sort((a, b) => {
        const aVal = a[sortBy] || 0;
        const bVal = b[sortBy] || 0;
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    const getRankBadge = (rank) => {
        if (rank === 1) return <span className="text-2xl">🥇</span>;
        if (rank === 2) return <span className="text-2xl">🥈</span>;
        if (rank === 3) return <span className="text-2xl">🥉</span>;
        return <span className="text-lg font-bold text-gray-500 dark:text-gray-400">#{rank}</span>;
    };

    const getStreakIcon = (streak) => {
        if (streak >= 30) return <FaFire className="text-red-500 text-xl" />;
        if (streak >= 14) return <FaFire className="text-orange-500" />;
        if (streak >= 7) return <FaFire className="text-yellow-500" />;
        return <FaFire className="text-gray-400" />;
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
        <div className="max-w-5xl mx-auto py-6">
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
                
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || leaderboardMode === 'contests'}
                        className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg disabled:opacity-50 transition-colors"
                        title={leaderboardMode === 'contests' ? "Contest points refresh automatically" : ""}
                    >
                        <FaSync className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh Stats'}
                    </button>
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

            {/* Time Period Tabs (Only for Overall) */}
            {leaderboardMode === 'overall' && (
                <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-leet-input p-1 rounded-lg w-fit">
                    {TIME_PERIODS.map(period => (
                        <button
                            key={period.id}
                            onClick={() => setTimePeriod(period.id)}
                            className={`px-4 py-2 rounded-md font-medium transition-colors ${
                                timePeriod === period.id
                                    ? 'bg-white dark:bg-leet-card text-brand shadow'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>
            )}

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

            {/* Leaderboard Table */}
            {!loading && !error && (
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
                                <th 
                                    className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-brand"
                                    onClick={() => handleSort(leaderboardMode === 'overall' ? 'totalPoints' : 'contestPoints')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Points
                                        {(sortBy === 'totalPoints' || sortBy === 'contestPoints') && (
                                            sortOrder === 'desc' ? <FaArrowDown className="text-xs" /> : <FaArrowUp className="text-xs" />
                                        )}
                                    </div>
                                </th>
                                {leaderboardMode === 'overall' ? (
                                    <>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                                            Solved
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                                            Bonus
                                        </th>
                                        <th 
                                            className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-brand"
                                            onClick={() => handleSort('streak')}
                                        >
                                            <div className="flex items-center justify-center gap-1">
                                                Streak
                                                {sortBy === 'streak' && (
                                                    sortOrder === 'desc' ? <FaArrowDown className="text-xs" /> : <FaArrowUp className="text-xs" />
                                                )}
                                            </div>
                                        </th>
                                    </>
                                ) : (
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Contests Won
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-leet-border">
                            {sortedLeaderboard.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No students found in this group. Make sure everyone has set up their LeetCode username!
                                    </td>
                                </tr>
                            ) : (
                                sortedLeaderboard.map((member, index) => {
                                    const displayRank = sortBy === 'totalSolved' && sortOrder === 'desc' 
                                        ? index + 1 
                                        : member.rank;
                                    const isCurrentUser = member.id === currentUser?.uid;
                                    
                                    return (
                                        <tr 
                                            key={member.id}
                                            className={`hover:bg-gray-50 dark:hover:bg-leet-input transition-colors ${
                                                isCurrentUser ? 'bg-brand/5 dark:bg-brand/10' : ''
                                            }`}
                                        >
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {getRankBadge(displayRank)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-brand to-brand-hover rounded-full flex items-center justify-center text-white font-bold">
                                                        {member.displayName?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className={`font-medium ${isCurrentUser ? 'text-brand' : 'dark:text-white'}`}>
                                                            {member.displayName}
                                                            {isCurrentUser && <span className="ml-2 text-xs text-brand">(You)</span>}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            @{member.leetcodeUsername}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="text-xl font-bold text-brand">
                                                    {leaderboardMode === 'overall' ? (member.totalPoints || 0) : (member.contestPoints || 0)}
                                                </span>
                                            </td>
                                            {leaderboardMode === 'overall' ? (
                                                <>
                                                    <td className="px-4 py-4 text-center hidden md:table-cell">
                                                        <div className="flex flex-col text-xs">
                                                            <span className="text-green-500">E: {member.easySolved || 0}</span>
                                                            <span className="text-yellow-600">M: {member.mediumSolved || 0}</span>
                                                            <span className="text-red-500">H: {member.hardSolved || 0}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center hidden lg:table-cell">
                                                        <span className="text-blue-500 font-medium">+{ (member.streak || 0) * 10 }</span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {getStreakIcon(member.streak || 0)}
                                                            <span className="font-medium dark:text-white">
                                                                {member.streak || 0}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <td className="px-4 py-4 text-center">
                                                    <span className="text-gray-500">-</span>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Legend */}
            {!loading && !error && sortedLeaderboard.length > 0 && (
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
