import React, { useState, useEffect } from 'react';
import { FaTimes, FaLightbulb } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const HintModal = ({ isOpen, onClose, problem }) => {
    const { checkAIQuota } = useAuth();
    const [hint, setHint] = useState("Loading hint...");

    useEffect(() => {
        if (isOpen && problem) {
            const fetchHint = async () => {
                setHint("Loading hint..."); // Reset hint when modal opens or problem changes
                const allowed = await checkAIQuota();
                if (allowed) {
                    // Generate hint based on problem characteristics
                    setTimeout(() => {
                        const title = (problem.title || problem.name || '').toLowerCase();
                        const type = (problem.type || '').toLowerCase();
                        let generatedHint = '';

                        // Pattern-based hint generation
                        if (title.includes('two sum') || title.includes('pair')) {
                            generatedHint = '💡 Consider using a Hash Map to store complements as you iterate through the array.';
                        } else if (title.includes('subarray') || title.includes('substring')) {
                            generatedHint = '💡 Try the Sliding Window technique - maintain a window and adjust its size based on conditions.';
                        } else if (title.includes('tree') || type.includes('tree')) {
                            generatedHint = '💡 Think about tree traversal - DFS (recursion) or BFS (queue). Which fits better for this problem?';
                        } else if (title.includes('linked list') || type.includes('linked')) {
                            generatedHint = '💡 Use the two-pointer technique or consider a dummy node to simplify edge cases.';
                        } else if (title.includes('sort') || title.includes('merge')) {
                            generatedHint = '💡 Can you solve this without sorting? If not, think about the optimal sorting algorithm.';
                        } else if (type.includes('dp') || type.includes('dynamic')) {
                            generatedHint = '💡 Define your state and recurrence relation. What are the overlapping subproblems?';
                        } else if (type.includes('graph') || title.includes('graph')) {
                            generatedHint = '💡 BFS for shortest path, DFS for exploring all possibilities. Remember to track visited nodes!';
                        } else if (type.includes('array') || type.includes('vector')) {
                            generatedHint = '💡 Consider two pointers, binary search, or hash maps depending on if the array is sorted.';
                        } else {
                            generatedHint = `💡 For "${problem.title || problem.name}": Break down the problem into smaller steps and identify the core algorithm needed.`;
                        }

                        setHint(generatedHint);
                    }, 500);
                } else {
                    setHint("Daily AI Limit Reached (30/30). Please come back tomorrow!");
                }
            };
            fetchHint();
        }
    }, [isOpen, problem, checkAIQuota]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-leet-card w-full max-w-md rounded-lg shadow-xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b dark:border-leet-border bg-yellow-100 dark:bg-yellow-900">
                    <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-100 flex items-center gap-2">
                        <FaLightbulb /> Hint: {problem?.title || 'Problem'}
                    </h3>
                    <button onClick={onClose} className="text-yellow-800 dark:text-yellow-100 hover:opacity-80">
                        <FaTimes />
                    </button>
                </div>
                <div className="p-6 text-gray-700 dark:text-gray-300">
                    <p className="mb-4">Here is a gentle nudge to help you solve this:</p>
                    <div className="bg-gray-100 dark:bg-leet-input p-4 rounded-md border-l-4 border-yellow-500">
                        <p className="text-base">{hint}</p>
                    </div>
                </div>
                <div className="p-4 border-t dark:border-leet-border flex justify-end">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-leet-input hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded">
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HintModal;
