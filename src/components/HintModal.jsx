import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaLightbulb, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { generateHint } from '../services/geminiService';

const HintModal = ({ isOpen, onClose, problem }) => {
    const { checkAIQuota } = useAuth();
    const [hint, setHint] = useState("Loading hint...");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // FIXED: Memoize fetchHint to avoid recreating on every render
    // This prevents the infinite loop caused by checkAIQuota in dependencies
    const fetchHint = useCallback(async () => {
        if (!problem) return;

        setLoading(true);
        setError(null);
        setHint("Loading hint...");

        try {
            // Check quota once
            const allowed = await checkAIQuota();

            if (!allowed) {
                setHint("Daily AI Limit Reached (30/30). Please come back tomorrow!");
                setLoading(false);
                return;
            }

            // Generate hint using Gemini API
            const generatedHint = await generateHint(problem);
            setHint(generatedHint);
        } catch (err) {
            console.error('Failed to generate hint:', err);
            setError(err.message);

            // Fallback to pattern-based hint on error
            const fallbackHint = generateFallbackHint(problem);
            setHint(fallbackHint);
        } finally {
            setLoading(false);
        }
    }, [problem]); // FIXED: Only depend on problem, not checkAIQuota

    // Effect runs only when modal opens or problem changes
    useEffect(() => {
        if (isOpen && problem) {
            fetchHint();
        }
    }, [isOpen, problem, fetchHint]);

    // Fallback pattern-based hints when API fails
    const generateFallbackHint = (problem) => {
        const title = (problem.title || problem.name || '').toLowerCase();
        const type = (problem.type || '').toLowerCase();

        if (title.includes('two sum') || title.includes('pair')) {
            return '💡 Consider using a Hash Map to store complements as you iterate through the array.';
        } else if (title.includes('subarray') || title.includes('substring')) {
            return '💡 Try the Sliding Window technique - maintain a window and adjust its size based on conditions.';
        } else if (title.includes('tree') || type.includes('tree')) {
            return '💡 Think about tree traversal - DFS (recursion) or BFS (queue). Which fits better for this problem?';
        } else if (title.includes('linked list') || type.includes('linked')) {
            return '💡 Use the two-pointer technique or consider a dummy node to simplify edge cases.';
        } else if (title.includes('sort') || title.includes('merge')) {
            return '💡 Can you solve this without sorting? If not, think about the optimal sorting algorithm.';
        } else if (type.includes('dp') || type.includes('dynamic')) {
            return '💡 Define your state and recurrence relation. What are the overlapping subproblems?';
        } else if (type.includes('graph') || title.includes('graph')) {
            return '💡 BFS for shortest path, DFS for exploring all possibilities. Remember to track visited nodes!';
        } else if (type.includes('array') || type.includes('vector')) {
            return '💡 Consider two pointers, binary search, or hash maps depending on if the array is sorted.';
        } else {
            return `💡 For "${problem.title || problem.name}": Break down the problem into smaller steps and identify the core algorithm needed.`;
        }
    };

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
                    {error && (
                        <div className="mb-3 p-2 bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500 text-sm text-orange-800 dark:text-orange-200">
                            ⚠️ Using fallback hint (API: {error})
                        </div>
                    )}
                    <div className="bg-gray-100 dark:bg-leet-input p-4 rounded-md border-l-4 border-yellow-500 min-h-[80px] flex items-center">
                        {loading ? (
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <FaSpinner className="animate-spin" />
                                <span>Generating hint...</span>
                            </div>
                        ) : (
                            <p className="text-base whitespace-pre-line">{hint}</p>
                        )}
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

