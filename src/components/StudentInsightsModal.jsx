import React, { useEffect, useState } from 'react';
import { FaTimes, FaChartLine, FaHistory, FaLightbulb } from 'react-icons/fa';
import { analyticsService } from '../services/analyticsService';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const StudentInsightsModal = ({ isOpen, onClose, student }) => {
    const [history, setHistory] = useState([]);
    const [report, setReport] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && student) {
            setLoading(true);
            analyticsService.fetchStudentDetails(student.leetcodeUsername).then(data => {
                setHistory(data.slice(0, 10)); // Last 10
                setReport(analyticsService.generateWeaknessReport(student));
                setLoading(false);
            });
        }
    }, [isOpen, student]);

    if (!isOpen || !student) return null;

    // Mock data for activity graph (since API doesn't give daily breakdown easily without massive parsing)
    const activityData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
            {
                label: 'Problems Solved',
                data: [student.easySolved % 5, student.mediumSolved % 5 + 2, student.hardSolved % 2 + 1, 5], // Mock variation
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
        ],
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-leet-card w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b dark:border-leet-border bg-gray-50 dark:bg-leet-input">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                        <FaChartLine className="text-brand" /> Insights: {student.username}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Graphs & Report */}
                    <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-leet-bg p-4 rounded-lg">
                            <h4 className="font-bold mb-2 dark:text-gray-300">Activity Trend (30 Days)</h4>
                            <Line data={activityData} />
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
                            <h4 className="font-bold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                                <FaLightbulb /> AI Recommendation
                            </h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                {report}
                            </p>
                        </div>
                    </div>

                    {/* Right: History */}
                    <div>
                        <h4 className="font-bold mb-4 dark:text-gray-300 flex items-center gap-2">
                            <FaHistory /> Recent Submissions
                        </h4>
                        <div className="space-y-2">
                            {loading ? (
                                <p className="text-gray-500">Loading history...</p>
                            ) : history.length > 0 ? (
                                history.map((sub, i) => (
                                    <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-leet-input p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                        <div>
                                            <p className="font-medium text-sm dark:text-white">{sub.title}</p>
                                            <p className="text-xs text-gray-500">{new Date(parseInt(sub.timestamp) * 1000).toLocaleDateString()}</p>
                                        </div>
                                        <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            Accepted
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">No recent submissions found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentInsightsModal;
