import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { FaUsers, FaTrophy, FaCheckCircle, FaArrowUp, FaArrowDown } from 'react-icons/fa';

/**
 * Admin Dashboard - Activity-focused layout with dark mode support
 */
const Dashboard = () => {
    const { isDark } = useOutletContext() || { isDark: true };
    const [stats, setStats] = useState({ students: 0, contests: 0, solved: 0 });
    const [topPerformers, setTopPerformers] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const usersSnap = await getDocs(collection(db, 'users'));
                const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                const contestsSnap = await getDocs(collection(db, 'contests'));
                const activeContests = contestsSnap.docs.filter(d => {
                    const data = d.data();
                    return new Date(data.endTime) > new Date();
                });

                let totalSolved = 0;
                const performers = users.map(u => {
                    const solved = (u.problems || []).filter(p => p.status === 'Done').length;
                    totalSolved += solved;
                    return { ...u, solved };
                }).sort((a, b) => b.solved - a.solved).slice(0, 5);

                setStats({ students: users.length, contests: activeContests.length, solved: totalSolved });
                setTopPerformers(performers);
                setRecentActivity([
                    { id: 1, type: 'solve', user: performers[0]?.displayName || performers[0]?.leetcodeUsername || performers[0]?.email?.split('@')[0] || 'User', action: 'solved Two Sum', time: '2 min ago' },
                    { id: 2, type: 'join', user: 'New Student', action: 'joined Group A', time: '15 min ago' },
                    { id: 3, type: 'contest', user: 'System', action: 'Contest "Weekly #5" started', time: '1 hour ago' },
                ]);
            } catch (e) {
                console.error('Dashboard fetch error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>Dashboard</h1>
                <p className={isDark ? 'text-leet-sub' : 'text-gray-500'}>Welcome back! Here's what's happening.</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard isDark={isDark} title="Total Students" value={stats.students} icon={<FaUsers className="text-blue-500" />} trend="+12%" trendUp={true} />
                <StatsCard isDark={isDark} title="Active Contests" value={stats.contests} icon={<FaTrophy className="text-yellow-500" />} trend="2 ending today" trendUp={null} />
                <StatsCard isDark={isDark} title="Problems Solved" value={stats.solved.toLocaleString()} icon={<FaCheckCircle className="text-green-500" />} trend="+8%" trendUp={true} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Feed */}
                <div className="lg:col-span-2">
                    <div className={`rounded-lg p-6 ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
                        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>Recent Activity</h3>
                        <div className="space-y-4">
                            {recentActivity.map(activity => (
                                <div key={activity.id} className={`flex items-center gap-4 p-3 rounded-lg ${isDark ? 'bg-leet-input' : 'bg-gray-50'}`}>
                                    <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center">
                                        {activity.type === 'solve' && <FaCheckCircle className="text-green-500" />}
                                        {activity.type === 'join' && <FaUsers className="text-blue-500" />}
                                        {activity.type === 'contest' && <FaTrophy className="text-yellow-500" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                            <span className="font-medium">{activity.user}</span> {activity.action}
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Performers */}
                <div>
                    <div className={`rounded-lg p-6 ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
                        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>🏆 Top Performers</h3>
                        <div className="space-y-3">
                            {topPerformers.map((user, index) => (
                                <div key={user.id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-leet-input' : 'hover:bg-gray-50'}`}>
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                        ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                          index === 1 ? 'bg-gray-100 text-gray-700' :
                                          index === 2 ? 'bg-orange-100 text-orange-700' :
                                          isDark ? 'bg-leet-input text-leet-sub' : 'bg-gray-50 text-gray-500'}`}>
                                        {index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                            {user.displayName || user.leetcodeUsername || user.email?.split('@')[0] || 'Anonymous'}
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold text-brand">{user.solved}</span>
                                </div>
                            ))}
                            {topPerformers.length === 0 && (
                                <p className={`text-sm text-center py-4 ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>No students yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className={`rounded-lg p-6 ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    <a href="/admin/contests" className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-medium transition-colors">+ Create Contest</a>
                    <a href="/admin/assignments" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">+ Create Assignment</a>
                    <a href="/admin/students" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-leet-input hover:bg-leet-border text-leet-text' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>Manage Students</a>
                </div>
            </div>
        </div>
    );
};

const StatsCard = ({ isDark, title, value, icon, trend, trendUp }) => (
    <div className={`rounded-lg p-6 transition-shadow hover:shadow-xl ${isDark ? 'bg-leet-card border border-leet-border' : 'bg-white shadow-lg'}`}>
        <div className="flex items-start justify-between">
            <div>
                <p className={`text-sm font-medium ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>{title}</p>
                <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>{value}</p>
                {trend && (
                    <p className={`text-sm mt-2 flex items-center gap-1 ${trendUp === true ? 'text-green-500' : trendUp === false ? 'text-red-500' : isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                        {trendUp === true && <FaArrowUp className="text-xs" />}
                        {trendUp === false && <FaArrowDown className="text-xs" />}
                        {trend}
                    </p>
                )}
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${isDark ? 'bg-leet-input' : 'bg-gray-100'}`}>{icon}</div>
        </div>
    </div>
);

export default Dashboard;

