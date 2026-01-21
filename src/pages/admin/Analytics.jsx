import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { FaUsers, FaTrophy, FaCheckCircle, FaChartLine, FaFilter, FaMedal, FaFire } from 'react-icons/fa';

const Analytics = () => {
    const { isDark } = useOutletContext() || { isDark: true };
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [timeRange, setTimeRange] = useState('all'); // 'week' | 'month' | 'all'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersSnap, groupsSnap, contestsSnap, assignmentsSnap] = await Promise.all([
                getDocs(collection(db, 'users')),
                getDocs(collection(db, 'groups')),
                getDocs(collection(db, 'contests')),
                getDocs(collection(db, 'assignments'))
            ]);
            
            const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const groups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const contests = contestsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const assignments = assignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Calculate stats
            const totalProblems = users.reduce((sum, u) => sum + (u.problems?.length || 0), 0);
            const solvedProblems = users.reduce((sum, u) => 
                sum + (u.problems?.filter(p => p.status === 'Done').length || 0), 0);
            
            // Group stats
            const groupStats = groups.map(g => {
                const groupUsers = users.filter(u => u.groupId === g.id);
                const groupSolved = groupUsers.reduce((sum, u) => 
                    sum + (u.problems?.filter(p => p.status === 'Done').length || 0), 0);
                return {
                    ...g,
                    studentCount: groupUsers.length,
                    totalSolved: groupSolved,
                    avgSolved: groupUsers.length ? Math.round(groupSolved / groupUsers.length) : 0
                };
            }).sort((a, b) => b.avgSolved - a.avgSolved);

            // Difficulty breakdown
            const difficultyStats = { Easy: 0, Medium: 0, Hard: 0 };
            users.forEach(u => {
                (u.problems || []).filter(p => p.status === 'Done').forEach(p => {
                    if (p.difficulty) difficultyStats[p.difficulty] = (difficultyStats[p.difficulty] || 0) + 1;
                });
            });

            // Top performers
            const topPerformers = users
                .map(u => ({
                    ...u,
                    solved: (u.problems || []).filter(p => p.status === 'Done').length
                }))
                .sort((a, b) => b.solved - a.solved)
                .slice(0, 10);

            // Most active (by problems attempted)
            const mostActive = users
                .map(u => ({
                    ...u,
                    attempted: (u.problems || []).length
                }))
                .sort((a, b) => b.attempted - a.attempted)
                .slice(0, 5);

            setData({
                users,
                groups,
                contests,
                assignments,
                totalProblems,
                solvedProblems,
                groupStats,
                difficultyStats,
                topPerformers,
                mostActive
            });
        } catch (e) {
            console.error('Error fetching analytics:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
            </div>
        );
    }

    if (!data) return null;

    const { users, groups, contests, assignments, solvedProblems, groupStats, difficultyStats, topPerformers, mostActive } = data;

    // Filter by group if selected
    const filteredUsers = selectedGroup === 'all' 
        ? users 
        : users.filter(u => u.groupId === selectedGroup);

    const filteredSolved = filteredUsers.reduce((sum, u) => 
        sum + (u.problems?.filter(p => p.status === 'Done').length || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>Analytics</h1>
                    <p className={isDark ? 'text-leet-sub' : 'text-gray-500'}>Performance insights and reports</p>
                </div>
                
                {/* Filters */}
                <div className="flex gap-3">
                    <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className={`px-3 py-2 rounded-lg text-sm focus:outline-none ${
                            isDark ? 'bg-leet-input text-leet-text border border-leet-border' : 'bg-white border'
                        }`}
                    >
                        <option value="all">All Groups</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard isDark={isDark} icon={<FaUsers className="text-blue-500" />} label="Total Students" value={filteredUsers.length} />
                <StatCard isDark={isDark} icon={<FaCheckCircle className="text-green-500" />} label="Problems Solved" value={filteredSolved} />
                <StatCard isDark={isDark} icon={<FaTrophy className="text-yellow-500" />} label="Contests" value={contests.length} />
                <StatCard isDark={isDark} icon={<FaChartLine className="text-purple-500" />} label="Assignments" value={assignments.length} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Group Leaderboard */}
                <div className={`lg:col-span-2 rounded-lg p-6 ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                        <FaMedal className="text-yellow-500" /> Group Performance
                    </h3>
                    
                    {groupStats.length > 0 ? (
                        <div className="space-y-3">
                            {groupStats.map((group, idx) => {
                                const maxAvg = Math.max(...groupStats.map(g => g.avgSolved), 1);
                                const percentage = (group.avgSolved / maxAvg) * 100;
                                
                                return (
                                    <div key={group.id} className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    idx === 1 ? 'bg-gray-100 text-gray-700' :
                                                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                    isDark ? 'bg-leet-input text-leet-sub' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {idx + 1}
                                                </span>
                                                <span className={isDark ? 'text-leet-text' : 'text-gray-900'}>{group.name}</span>
                                                <span className={`text-xs ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                                                    ({group.studentCount} students)
                                                </span>
                                            </div>
                                            <span className={`font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                                {group.avgSolved} avg
                                            </span>
                                        </div>
                                        <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-leet-input' : 'bg-gray-200'}`}>
                                            <div 
                                                className="h-full bg-gradient-to-r from-brand to-green-500 rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className={isDark ? 'text-leet-sub' : 'text-gray-500'}>No groups created yet.</p>
                    )}
                </div>

                {/* Difficulty Breakdown */}
                <div className={`rounded-lg p-6 ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
                    <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                        Difficulty Breakdown
                    </h3>
                    
                    <div className="space-y-4">
                        {[
                            { label: 'Easy', color: 'bg-green-500', value: difficultyStats.Easy || 0 },
                            { label: 'Medium', color: 'bg-yellow-500', value: difficultyStats.Medium || 0 },
                            { label: 'Hard', color: 'bg-red-500', value: difficultyStats.Hard || 0 }
                        ].map(item => {
                            const total = (difficultyStats.Easy || 0) + (difficultyStats.Medium || 0) + (difficultyStats.Hard || 0);
                            const percentage = total ? Math.round((item.value / total) * 100) : 0;
                            
                            return (
                                <div key={item.label}>
                                    <div className="flex justify-between mb-1">
                                        <span className={isDark ? 'text-leet-text' : 'text-gray-700'}>{item.label}</span>
                                        <span className={isDark ? 'text-leet-sub' : 'text-gray-500'}>{item.value} ({percentage}%)</span>
                                    </div>
                                    <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-leet-input' : 'bg-gray-200'}`}>
                                        <div 
                                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className={`mt-6 pt-4 border-t ${isDark ? 'border-leet-border' : 'border-gray-200'}`}>
                        <div className="flex justify-between">
                            <span className={isDark ? 'text-leet-sub' : 'text-gray-500'}>Total Solved</span>
                            <span className={`font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                {(difficultyStats.Easy || 0) + (difficultyStats.Medium || 0) + (difficultyStats.Hard || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <div className={`rounded-lg p-6 ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                        <FaTrophy className="text-yellow-500" /> Top 10 Performers
                    </h3>
                    
                    <div className="space-y-2">
                        {topPerformers.map((user, idx) => (
                            <div 
                                key={user.id} 
                                className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-leet-input' : 'bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                                        idx === 2 ? 'bg-orange-400 text-orange-900' :
                                        isDark ? 'bg-leet-border text-leet-sub' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                        {idx + 1}
                                    </span>
                                    <div>
                                        <p className={`font-medium ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                            {user.leetcodeUsername || user.email?.split('@')[0] || 'Anonymous'}
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                                            {groups.find(g => g.id === user.groupId)?.name || 'No group'}
                                        </p>
                                    </div>
                                </div>
                                <span className="font-bold text-brand">{user.solved}</span>
                            </div>
                        ))}
                        
                        {topPerformers.length === 0 && (
                            <p className={isDark ? 'text-leet-sub' : 'text-gray-500'}>No data yet.</p>
                        )}
                    </div>
                </div>

                {/* Most Active */}
                <div className={`rounded-lg p-6 ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                        <FaFire className="text-orange-500" /> Most Active Students
                    </h3>
                    
                    <div className="space-y-2">
                        {mostActive.map((user, idx) => (
                            <div 
                                key={user.id} 
                                className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-leet-input' : 'bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        idx === 0 ? 'bg-orange-400 text-orange-900' :
                                        isDark ? 'bg-leet-border text-leet-sub' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                        {idx + 1}
                                    </span>
                                    <div>
                                        <p className={`font-medium ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                            {user.leetcodeUsername || user.email?.split('@')[0] || 'Anonymous'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`font-medium ${isDark ? 'text-leet-sub' : 'text-gray-600'}`}>
                                    {user.attempted} problems
                                </span>
                            </div>
                        ))}
                        
                        {mostActive.length === 0 && (
                            <p className={isDark ? 'text-leet-sub' : 'text-gray-500'}>No data yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ isDark, icon, label, value }) => (
    <div className={`rounded-lg p-4 ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-leet-input' : 'bg-gray-100'}`}>
                {icon}
            </div>
            <div>
                <p className={`text-2xl font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>{value}</p>
                <p className={`text-sm ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>{label}</p>
            </div>
        </div>
    </div>
);

export default Analytics;
