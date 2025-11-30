import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaCircle, FaExternalLinkAlt, FaRobot } from 'react-icons/fa';
import CodeReviewModal from './CodeReviewModal';
import * as ReactWindow from 'react-window';
import Skeleton from './ui/Skeleton';

const List = ReactWindow.FixedSizeList;

const ProblemList = () => {
    const { userData, loading } = useAuth();
    const [filter, setFilter] = useState('All');
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedProblem, setSelectedProblem] = useState('');

    const problems = userData?.problems || [];

    const filteredProblems = problems.filter(p => {
        if (filter === 'All') return true;
        return p.status === filter;
    });

    const handleReview = (problemName) => {
        setSelectedProblem(problemName);
        setReviewModalOpen(true);
    };

    const Row = ({ index, style }) => {
        const problem = filteredProblems[index];
        return (
            <div style={style} className="flex items-center hover:bg-gray-50 dark:hover:bg-leet-input transition-colors border-b dark:border-leet-border px-6">
                <div className="w-1/12 min-w-[50px]">
                    {problem.status === 'Done' ? (
                        <FaCheckCircle className="text-green-500" />
                    ) : problem.status === 'Solving' ? (
                        <FaCircle className="text-yellow-500" />
                    ) : (
                        <FaCircle className="text-gray-300 dark:text-gray-600" />
                    )}
                </div>
                <div className="w-5/12 truncate pr-4">
                    <a
                        href={problem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-900 dark:text-white font-medium hover:text-brand dark:hover:text-brand-dark flex items-center gap-1 truncate"
                    >
                        {problem.title} <FaExternalLinkAlt size={10} className="text-gray-400 flex-shrink-0" />
                    </a>
                </div>
                <div className="w-3/12">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {problem.difficulty}
                    </span>
                </div>
                <div className="w-3/12 text-right">
                    <button
                        onClick={() => handleReview(problem.title)}
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 flex items-center justify-end gap-1 ml-auto"
                    >
                        <FaRobot /> Review
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto mt-6 px-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold dark:text-white">My Problems</h2>
                <div className="flex gap-2">
                    {['All', 'Todo', 'Solving', 'Done'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === status
                                ? 'bg-brand text-white'
                                : 'bg-gray-200 dark:bg-leet-input text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-leet-card rounded-lg shadow overflow-hidden">
                {/* Header */}
                <div className="flex bg-gray-50 dark:bg-leet-input px-6 py-3 border-b dark:border-leet-border text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="w-1/12 min-w-[50px]">Status</div>
                    <div className="w-5/12">Problem</div>
                    <div className="w-3/12">Difficulty</div>
                    <div className="w-3/12 text-right">Actions</div>
                </div>

                {/* List Content */}
                {loading || !userData ? (
                    <div className="p-6 space-y-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton variant="circle" className="w-6 h-6" />
                                <Skeleton variant="text" className="w-1/2 h-4" />
                                <Skeleton variant="text" className="w-1/4 h-4" />
                                <Skeleton variant="text" className="w-1/4 h-4" />
                            </div>
                        ))}
                    </div>
                ) : filteredProblems.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                        No problems found.
                    </div>
                ) : (
                    <div className="h-[600px]">
                        <List
                            height={600}
                            itemCount={filteredProblems.length}
                            itemSize={60}
                            width="100%"
                        >
                            {Row}
                        </List>
                    </div>
                )}
            </div>

            <CodeReviewModal
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                problemName={selectedProblem}
            />
        </div>
    );
};

export default ProblemList;
