import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';
import { FaChartPie, FaUsers, FaCrown, FaFileDownload, FaSync, FaSpinner } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Skeleton from '../components/ui/Skeleton';

const SkillRadarChart = lazy(() => import('../components/SkillRadarChart'));
const StudentInsightsModal = lazy(() => import('../components/StudentInsightsModal'));

const SupervisorDashboard = () => {
    const { userData, isAdmin } = useAuth();
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [groupAverage, setGroupAverage] = useState(null);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Determine group: Admin sees All, Supervisor sees their group
            const groupId = isAdmin ? 'All' : (userData.groupId || 'NoGroup');
            const data = await analyticsService.fetchGroupStats(groupId);
            setStats(data);

            // Calculate Group Average for Radar Chart
            // [Arrays, Strings, Hash Table, DP, Math, Trees]
            // Simplified: Just average the counts of these categories if available
            // For this demo, we will mock the calculation or do a simple average of total solved
            // Real implementation would parse all tags.

            // Mock average for visualization
            setGroupAverage([12, 15, 10, 5, 8, 6]);

        } catch (e) {
            console.error(e);
            alert("Failed to load analytics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userData) fetchStats();
    }, [userData]);

    const handleExport = () => {
        const doc = new jsPDF();
        doc.text(`Group Performance Report - ${new Date().toLocaleDateString()}`, 14, 15);

        const tableColumn = ["Student", "Total Solved", "Easy", "Medium", "Hard", "Last Active"];
        const tableRows = stats.map(s => [
            s.username,
            s.totalSolved,
            s.easySolved,
            s.mediumSolved,
            s.hardSolved,
            "N/A" // Timestamp not strictly tracked in this simplified version
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save("group_report.pdf");
    };

    const topPerformer = stats.reduce((prev, current) => (prev.totalSolved > current.totalSolved) ? prev : current, {});

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-2 dark:text-white">
                    <FaChartPie className="text-brand" /> Supervisor Dashboard
                </h1>
                <div className="flex gap-2">
                    <button onClick={fetchStats} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded flex items-center gap-2">
                        <FaSync /> Refresh
                    </button>
                    <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2">
                        <FaFileDownload /> Export Report
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {loading ? (
                    <>
                        <Skeleton variant="rect" className="h-32" />
                        <Skeleton variant="rect" className="h-32" />
                        <Skeleton variant="rect" className="h-32" />
                    </>
                ) : (
                    <>
                        <div className="bg-white dark:bg-leet-card p-6 rounded-lg shadow border-l-4 border-blue-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">Total Solved</p>
                                    <p className="text-3xl font-bold dark:text-white">{stats.reduce((a, b) => a + (b.totalSolved || 0), 0)}</p>
                                </div>
                                <FaChartPie className="text-4xl text-blue-200" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-leet-card p-6 rounded-lg shadow border-l-4 border-purple-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">Active Students</p>
                                    <p className="text-3xl font-bold dark:text-white">{stats.length}</p>
                                </div>
                                <FaUsers className="text-4xl text-purple-200" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-leet-card p-6 rounded-lg shadow border-l-4 border-yellow-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">Top Performer</p>
                                    <p className="text-xl font-bold dark:text-white truncate max-w-[150px]">{topPerformer.username || 'N/A'}</p>
                                    <p className="text-xs text-gray-500">{topPerformer.totalSolved || 0} Solved</p>
                                </div>
                                <FaCrown className="text-4xl text-yellow-200" />
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Student Table */}
                <div className="lg:col-span-2 bg-white dark:bg-leet-card rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b dark:border-leet-border">
                        <h3 className="font-bold text-lg dark:text-white">Student Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-leet-input">
                                <tr>
                                    <th className="px-6 py-3 text-left dark:text-gray-300">Student</th>
                                    <th className="px-6 py-3 text-right dark:text-gray-300">Total</th>
                                    <th className="px-6 py-3 text-right text-green-600">Easy</th>
                                    <th className="px-6 py-3 text-right text-yellow-600">Med</th>
                                    <th className="px-6 py-3 text-right text-red-600">Hard</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-leet-border">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4"><Skeleton variant="text" className="h-4 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton variant="text" className="h-4 w-8 ml-auto" /></td>
                                            <td className="px-6 py-4"><Skeleton variant="text" className="h-4 w-8 ml-auto" /></td>
                                            <td className="px-6 py-4"><Skeleton variant="text" className="h-4 w-8 ml-auto" /></td>
                                            <td className="px-6 py-4"><Skeleton variant="text" className="h-4 w-8 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : (
                                    stats.map((s, i) => (
                                        <tr
                                            key={i}
                                            onClick={() => setSelectedStudent(s)}
                                            className="hover:bg-gray-50 dark:hover:bg-leet-input cursor-pointer transition"
                                        >
                                            <td className="px-6 py-4 font-medium dark:text-white">{s.username}</td>
                                            <td className="px-6 py-4 text-right font-bold dark:text-white">{s.totalSolved}</td>
                                            <td className="px-6 py-4 text-right dark:text-gray-400">{s.easySolved}</td>
                                            <td className="px-6 py-4 text-right dark:text-gray-400">{s.mediumSolved}</td>
                                            <td className="px-6 py-4 text-right dark:text-gray-400">{s.hardSolved}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="bg-white dark:bg-leet-card rounded-lg shadow p-6 flex flex-col items-center">
                    <h3 className="font-bold text-lg mb-4 dark:text-white w-full text-left">Skill Radar</h3>
                    <div className="w-full max-w-xs min-h-[300px] flex items-center justify-center">
                        <Suspense fallback={<FaSpinner className="animate-spin text-4xl text-brand" />}>
                            <SkillRadarChart studentStats={selectedStudent} groupAverage={groupAverage} />
                        </Suspense>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 text-center">
                        {selectedStudent ? `Comparing ${selectedStudent.username} vs Group Average` : 'Select a student to compare'}
                    </p>
                </div>
            </div>

            <Suspense fallback={null}>
                <StudentInsightsModal
                    isOpen={!!selectedStudent}
                    onClose={() => setSelectedStudent(null)}
                    student={selectedStudent}
                />
            </Suspense>
        </div>
    );
};

export default SupervisorDashboard;
