import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaCircle, FaExternalLinkAlt, FaRobot, FaCloudUploadAlt, FaChartPie, FaBolt, FaChevronUp, FaChevronDown, FaLightbulb, FaComments, FaFileCode, FaTrash } from 'react-icons/fa';
import { useProblemImport } from '../hooks/useProblemImport';
import CodeReviewModal from './CodeReviewModal';
import Skeleton from './ui/Skeleton';
import * as ReactWindow from 'react-window';

// Robust import strategy for react-window
const List = ReactWindow.FixedSizeList || ReactWindow.default?.FixedSizeList || ReactWindow.default;

const ProblemList = () => {
    const { userData, loading, updateUserData } = useAuth();
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [filterSheet, setFilterSheet] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProblem, setSelectedProblem] = useState(null);
    const [showTopicProgress, setShowTopicProgress] = useState(false);
    const { importProblems } = useProblemImport();

    // Memoize problems
    const problems = useMemo(() => userData?.problems || [], [userData]);

    // Stats Calculations
    const stats = useMemo(() => {
        const total = problems.length;
        const done = problems.filter(p => p.status === 'Done').length;
        const inProgress = problems.filter(p => p.status === 'In Progress').length;
        const notOpened = problems.filter(p => p.status === 'Not Opened').length || (total - done - inProgress); // Fallback
        const uniqueSheets = new Set(problems.flatMap(p => p.sourceSheets || [])).size;
        const progressPct = total ? Math.round((done / total) * 100) : 0;
        return { total, done, inProgress, notOpened, uniqueSheets, progressPct };
    }, [problems]);

    // Topic Stats
    const topicStats = useMemo(() => {
        const st = {};
        problems.forEach(p => {
            const ts = String(p.type || 'Uncategorized').split(/,|;|\//).map(t => t.trim()).filter(t => t);
            ts.forEach(t => {
                if (!st[t]) st[t] = { total: 0, done: 0 };
                st[t].total++;
                if (p.status === 'Done') st[t].done++;
            });
        });
        return Object.entries(st).sort((a, b) => b[1].total - a[1].total);
    }, [problems]);

    // Filters
    const uniqueTypes = useMemo(() => {
        const ts = new Set();
        problems.forEach(p => (p.type || "").split(/,|;|\//).forEach(t => { if (t.trim()) ts.add(t.trim()) }));
        return [...ts].sort();
    }, [problems]);

    const uniqueSheets = useMemo(() => {
        const ss = new Set(problems.flatMap(p => p.sourceSheets || []));
        return [...ss].sort();
    }, [problems]);

    const filteredProblems = useMemo(() => {
        return problems.filter(p => {
            if (!p || (!p.title && !p.name)) return false;
            const title = p.title || p.name || '';
            const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
            const matchesType = filterType === 'All' || (p.type || "").includes(filterType);
            const matchesSheet = filterSheet === 'All' || (p.sourceSheets || []).includes(filterSheet);
            return matchesSearch && matchesStatus && matchesType && matchesSheet;
        });
    }, [problems, searchTerm, filterStatus, filterType, filterSheet]);

    // Handlers
    const handleStatusChange = async (id, newStatus) => {
        const updatedProblems = problems.map(p =>
            p.id === id || (p.titleSlug && p.titleSlug === id) ? { ...p, status: newStatus, completedDate: newStatus === 'Done' ? new Date().toISOString() : p.completedDate } : p
        );
        await updateUserData({ ...userData, problems: updatedProblems });
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this problem?")) {
            const updatedProblems = problems.filter(p => p.id !== id && p.titleSlug !== id);
            await updateUserData({ ...userData, problems: updatedProblems });
        }
    };

    if (loading) return <div className="p-8"><Skeleton variant="rect" className="w-full h-64" /></div>;

    return (
        <div className="space-y-6 pb-10">
            {/* Total Progress Bar */}
            <div className="bg-white dark:bg-leet-card p-4 rounded-lg shadow transition-colors duration-300">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-700 dark:text-leet-text">Total Progress</h3>
                    <span className="text-xl sm:text-2xl font-bold text-brand dark:text-brand-dark">{stats.progressPct}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 sm:h-4 overflow-hidden">
                    <div
                        className="bg-brand dark:bg-red-600 h-3 sm:h-4 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${stats.progressPct}%` }}
                    ></div>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <StatsCard title="Completed" value={stats.done} color="green" />
                <StatsCard title="In Progress" value={stats.inProgress} color="blue" />
                <StatsCard title="Not Opened" value={stats.notOpened} color="gray" />
                <StatsCard title="Total" value={stats.total} color="gray" borderColor="border-gray-600" />
                <StatsCard title="Unique Sheets" value={stats.uniqueSheets} color="brand" />

                {/* AI Coach Card */}
                <button
                    onClick={() => alert("AI Coach coming soon!")}
                    className="card bg-gradient-to-r from-brand to-brand-hover dark:from-red-900 dark:to-red-700 text-white p-3 sm:p-4 rounded-lg shadow transition transform hover:scale-105 text-left group col-span-2 md:col-span-1 lg:col-span-1"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xs text-red-100 uppercase font-semibold tracking-wide">Gemini Power</div>
                            <div className="text-base sm:text-lg font-bold mt-1">✨ AI Coach</div>
                        </div>
                        <FaRobot className="text-xl sm:text-2xl opacity-80" />
                    </div>
                </button>
            </div>

            {/* Topic Progress (Collapsible) */}
            <div className="bg-white dark:bg-leet-card rounded-lg shadow transition-colors duration-300">
                <button
                    onClick={() => setShowTopicProgress(!showTopicProgress)}
                    className="w-full flex justify-between items-center p-4 sm:p-5 focus:outline-none text-left group"
                >
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-hover:text-brand dark:group-hover:text-brand-dark transition-colors">
                        Topic Progress
                    </h3>
                    {showTopicProgress ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                </button>
                {showTopicProgress && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 transition-all duration-300 ease-in-out origin-top">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {topicStats.map(([topic, s]) => {
                                const p = s.total === 0 ? 0 : Math.round((s.done / s.total) * 100);
                                const colorClass = p === 100 ? 'bg-green-500' : p >= 50 ? 'bg-blue-500' : 'bg-brand';
                                return (
                                    <div key={topic} className="bg-gray-50 dark:bg-leet-input p-3 rounded-md">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs font-bold dark:text-gray-200 truncate" title={topic}>{topic}</span>
                                            <span className="text-xs dark:text-gray-400">{s.done}/{s.total}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div className={`${colorClass} h-2 rounded-full`} style={{ width: `${p}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-leet-card rounded-lg shadow p-4 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 transition-colors duration-300">
                <div className="flex-1 relative w-full">
                    <input
                        type="text"
                        placeholder="Search problems..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-4 py-2 rounded-md border-gray-300 dark:border-leet-border dark:bg-leet-input dark:text-leet-text shadow-sm focus:border-brand focus:ring-brand sm:text-sm placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                    />
                </div>
                <div className="grid grid-cols-2 md:flex md:space-x-4 gap-2 md:gap-0 w-full md:w-auto">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="block w-full md:w-32 rounded-md border-gray-300 dark:border-leet-border dark:bg-leet-input dark:text-leet-text shadow-sm focus:border-brand focus:ring-brand sm:text-sm py-2 transition-colors"
                    >
                        <option value="All">Status: All</option>
                        <option value="Done">Done</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Postponed">Postponed</option>
                        <option value="Not Opened">Not Opened</option>
                    </select>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="block w-full md:w-32 rounded-md border-gray-300 dark:border-leet-border dark:bg-leet-input dark:text-leet-text shadow-sm focus:border-brand focus:ring-brand sm:text-sm py-2 transition-colors"
                    >
                        <option value="All">Type: All</option>
                        {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <select
                    value={filterSheet}
                    onChange={(e) => setFilterSheet(e.target.value)}
                    className="block w-full md:w-40 rounded-md border-gray-300 dark:border-leet-border dark:bg-leet-input dark:text-leet-text shadow-sm focus:border-brand focus:ring-brand sm:text-sm py-2 transition-colors"
                >
                    <option value="All">Sheet: All</option>
                    {uniqueSheets.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {/* Import Button */}
                <label className="bg-brand hover:bg-brand-hover text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition shadow-sm flex items-center cursor-pointer">
                    <FaCloudUploadAlt className="mr-2" /> Import
                    <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                importProblems(e.target.files[0]);
                                e.target.value = '';
                            }
                        }}
                    />
                </label>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-leet-card shadow overflow-hidden rounded-lg transition-colors duration-300">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-leet-border w-full">
                        <thead className="bg-gray-50 dark:bg-leet-input transition-colors hidden md:table-header-group">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-leet-sub uppercase tracking-wider">Problem</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-leet-sub uppercase tracking-wider">Sheets</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-leet-sub uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-leet-sub uppercase tracking-wider">Difficulty</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-leet-sub uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-leet-sub uppercase tracking-wider">AI Tools & Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-leet-card divide-y divide-gray-200 dark:divide-leet-border transition-colors block md:table-row-group p-2 md:p-0">
                            {filteredProblems.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-500">No problems found.</td></tr>
                            ) : (
                                filteredProblems.map((p, idx) => (
                                    <tr key={p.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 border-b dark:border-gray-700 transition-colors">
                                        <td className="px-6 py-4">
                                            <a
                                                href={p.url || (p.titleSlug ? `https://leetcode.com/problems/${p.titleSlug}` : '#')}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-brand dark:text-brand-dark hover:underline font-medium flex items-center gap-2"
                                            >
                                                {p.title || p.name} <FaExternalLinkAlt size={10} className="opacity-50" />
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-xs">{(p.sourceSheets || []).join(', ')}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{p.type || 'Uncategorized'}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`font-bold ${p.difficulty === 'Easy' ? 'text-green-600' :
                                                p.difficulty === 'Medium' ? 'text-yellow-600' :
                                                    p.difficulty === 'Hard' ? 'text-red-600' : 'text-gray-400'
                                                }`}>
                                                {p.difficulty || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={p.status || 'Not Opened'}
                                                onChange={(e) => handleStatusChange(p.id || p.titleSlug, e.target.value)}
                                                className={`text-xs font-bold rounded border px-2 py-1 ${p.status === 'Done' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                    p.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                        'bg-gray-100 text-gray-800 dark:bg-leet-input dark:text-leet-text'
                                                    }`}
                                            >
                                                <option value="Not Opened">Not Opened</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Done">Done</option>
                                                <option value="Postponed">Postponed</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => alert("Hint coming soon!")} className="text-yellow-500 hover:text-yellow-600"><FaLightbulb /></button>
                                            <button onClick={() => alert("Mock Interview coming soon!")} className="text-brand dark:text-brand-dark hover:opacity-80"><FaComments /></button>
                                            <button onClick={() => setSelectedProblem(p)} className="text-purple-500 hover:text-purple-600"><FaFileCode /></button>
                                            <button onClick={() => handleDelete(p.id || p.titleSlug)} className="text-red-400 hover:text-red-500"><FaTrash /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AI Modal */}
            {selectedProblem && (
                <CodeReviewModal
                    isOpen={!!selectedProblem}
                    onClose={() => setSelectedProblem(null)}
                    problemName={selectedProblem.title || selectedProblem.name}
                />
            )}
        </div>
    );
};

const StatsCard = ({ title, value, color, borderColor }) => {
    const borderClass = borderColor || (
        color === 'green' ? 'border-green-500' :
            color === 'blue' ? 'border-blue-500' :
                color === 'brand' ? 'border-brand dark:border-red-500' :
                    'border-gray-400 dark:border-gray-600'
    );

    return (
        <div className={`card bg-white dark:bg-leet-card p-3 sm:p-4 rounded-lg shadow border-l-4 ${borderClass}`}>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">{title}</div>
            <div className="text-xl sm:text-2xl font-bold mt-1 dark:text-leet-text">{value}</div>
        </div>
    );
};

export default ProblemList;
