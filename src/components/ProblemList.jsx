import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
// import { FaCheckCircle, FaCircle, FaExternalLinkAlt, FaRobot } from 'react-icons/fa'; // Removed for debugging
import CodeReviewModal from './CodeReviewModal';
import * as ReactWindow from 'react-window';
import Skeleton from './ui/Skeleton';

// Robust import strategy for react-window
const List = ReactWindow.FixedSizeList || ReactWindow.default?.FixedSizeList || ReactWindow.default;

const ProblemList = () => {
    const { userData, loading } = useAuth();
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProblem, setSelectedProblem] = useState(null);

    // Memoize problems to prevent unnecessary re-renders
    const problems = useMemo(() => userData?.problems || [], [userData]);

    const filteredProblems = useMemo(() => {
        return problems.filter(p => {
            const matchesFilter = filter === 'All' || p.status === filter;
            const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [problems, filter, searchTerm]);

    const Row = ({ index, style }) => {
        const problem = filteredProblems[index];
        return (
            <div style={style} className="flex items-center justify-between p-4 border-b dark:border-leet-border hover:bg-gray-50 dark:hover:bg-leet-input transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                    {problem.status === 'Done' ? (
                        <span className="text-green-500 font-bold">✓</span>
                    ) : (
                        <span className="text-gray-300 dark:text-gray-600">○</span>
                    )}
                    <div className="min-w-0">
                        <a
                            href={`https://leetcode.com/problems/${problem.titleSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-gray-900 dark:text-gray-200 hover:text-brand dark:hover:text-brand-dark truncate block flex items-center gap-2"
                        >
                            {problem.title} <span className="text-xs opacity-50">↗</span>
                        </a>
                        <div className="flex gap-2 text-xs text-gray-500 mt-1">
                            <span className={`px-2 py-0.5 rounded-full ${problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                {problem.difficulty}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setSelectedProblem(problem)}
                    className="ml-4 p-2 text-gray-400 hover:text-brand dark:hover:text-brand-dark transition-colors"
                    title="Get AI Help"
                >
                    🤖
                </button>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="space-y-4 p-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton variant="circle" className="w-8 h-8" />
                        <div className="flex-grow space-y-2">
                            <Skeleton variant="text" className="h-4 w-3/4" />
                            <Skeleton variant="text" className="h-3 w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-leet-card rounded-lg shadow-sm border dark:border-leet-border h-[calc(100vh-200px)] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b dark:border-leet-border space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-grow max-w-md">
                        <input
                            type="text"
                            placeholder="Search problems..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-4 py-2 rounded-lg border dark:border-leet-border dark:bg-leet-input dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['All', 'Done', 'Todo'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-brand text-white'
                                    : 'bg-gray-100 dark:bg-leet-input text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {filteredProblems.length} problems
                </div>
            </div>

            {/* List */}
            <div className="flex-grow">
                {filteredProblems.length > 0 ? (
                    List ? (
                        <List
                            height={600} // Ideally dynamic
                            itemCount={filteredProblems.length}
                            itemSize={80}
                            width="100%"
                            className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
                        >
                            {Row}
                        </List>
                    ) : (
                        // Fallback if react-window fails
                        <div className="overflow-y-auto h-full">
                            {filteredProblems.map((p, i) => (
                                <Row key={i} index={i} style={{}} />
                            ))}
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <p>No problems found.</p>
                    </div>
                )}
            </div>

            {/* AI Modal */}
            {selectedProblem && (
                <CodeReviewModal
                    isOpen={!!selectedProblem}
                    onClose={() => setSelectedProblem(null)}
                    problemName={selectedProblem.title}
                />
            )}
        </div>
    );
};

export default ProblemList;
