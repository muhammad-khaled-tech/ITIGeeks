import React, { useState, useEffect } from 'react';
import { FaTimes, FaLightbulb, FaSpinner, FaChevronDown, FaChevronUp, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { generateProgressiveHints } from '../services/geminiService';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const HintModal = ({ isOpen, onClose, problem }) => {
    const { checkAIQuota, currentUser } = useAuth();
    const [hints, setHints] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [revealedHints, setRevealedHints] = useState([false, false, false]);
    const [expandedHint, setExpandedHint] = useState(null);

    // Generate cache key for this problem
    const getCacheKey = (problemObj) => {
        const title = (problemObj?.title || problemObj?.name || '').toLowerCase().replace(/\s+/g, '_');
        return `hint_${title}`;
    };

    useEffect(() => {
        if (isOpen && problem) {
            loadHints();
        }
    }, [isOpen, problem]);

    const loadHints = async () => {
        if (!problem || !currentUser) return;

        setLoading(true);
        setError(null);
        setRevealedHints([false, false, false]);
        setExpandedHint(null);

        try {
            // Check Firestore cache first
            const cacheKey = getCacheKey(problem);
            const cacheRef = doc(db, 'hintCache', cacheKey);
            const cacheSnap = await getDoc(cacheRef);

            if (cacheSnap.exists()) {
                console.log('Using cached hints');
                setHints(cacheSnap.data());
                setLoading(false);
                return;
            }

            // Check AI quota
            const allowed = await checkAIQuota();
            if (!allowed) {
                setError("Daily AI Limit Reached (30/30). Please try again tomorrow!");
                setHints(generateFallbackHints(problem));
                setLoading(false);
                return;
            }

            // Generate new hints via Gemini API
            const generatedHints = await generateProgressiveHints(problem);
            setHints(generatedHints);

            // Cache in Firestore
            await setDoc(cacheRef, {
                ...generatedHints,
                problemTitle: problem.title || problem.name,
                createdAt: new Date()
            });

        } catch (err) {
            console.error('Failed to generate hints:', err);
            setError(err.message);
            // Use fallback hints
            setHints(generateFallbackHints(problem));
        } finally {
            setLoading(false);
        }
    };

    // Fallback hints when API fails
    const generateFallbackHints = (problem) => {
        const title = (problem.title || problem.name || '').toLowerCase();
        const type = (problem.type || '').toLowerCase();

        if (title.includes('two sum') || title.includes('pair')) {
            return {
                hint1: "💡 Think about what operation you need to perform for each element...",
                hint2: "💡 A Hash Map can help you find complements in O(1) time.",
                hint3: "💡 For each number, calculate the complement (target - num) and check if it exists in your hash map. Store numbers as you go."
            };
        } else if (type.includes('tree') || title.includes('tree')) {
            return {
                hint1: "💡 Consider whether you need to traverse the entire tree or just a portion...",
                hint2: "💡 DFS (recursion) or BFS (queue) - which fits better for this problem?",
                hint3: "💡 Think about what information each node needs to pass to its children or receive from them."
            };
        } else if (type.includes('dp') || type.includes('dynamic')) {
            return {
                hint1: "💡 Can you break this problem into smaller overlapping subproblems?",
                hint2: "💡 Define your state: what variables do you need to track? What's the recurrence relation?",
                hint3: "💡 Start with the base case, then build up. Consider using memoization or bottom-up tabulation."
            };
        } else {
            return {
                hint1: `💡 Start by understanding what the problem is really asking...`,
                hint2: "💡 Think about the data structures that would be most efficient here.",
                hint3: "💡 Break down the problem into steps: what's the input, what's the output, what transformation is needed?"
            };
        }
    };

    const revealHint = (index) => {
        const newRevealed = [...revealedHints];
        newRevealed[index] = true;
        setRevealedHints(newRevealed);
        setExpandedHint(index);
    };

    const toggleExpand = (index) => {
        setExpandedHint(expandedHint === index ? null : index);
    };

    const canReveal = (index) => {
        if (index === 0) return true;
        return revealedHints[index - 1];
    };

    if (!isOpen) return null;

    const hintLabels = [
        { level: 1, title: "Gentle Nudge", description: "A light push in the right direction" },
        { level: 2, title: "Specific Direction", description: "The technique or pattern you need" },
        { level: 3, title: "Almost There", description: "Step-by-step approach (no code)" }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-leet-card w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b dark:border-leet-border bg-gradient-to-r from-yellow-400 to-orange-500">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FaLightbulb className="text-xl" />
                        Hints: {problem?.title || problem?.name || 'Problem'}
                    </h3>
                    <button onClick={onClose} className="text-white hover:opacity-80 transition-opacity">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500 rounded-r-lg">
                            <p className="text-sm text-orange-800 dark:text-orange-200">
                                ⚠️ {error}
                            </p>
                            <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                                Using fallback hints instead.
                            </p>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <FaSpinner className="animate-spin text-4xl text-yellow-500 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Generating personalized hints...</p>
                        </div>
                    )}

                    {/* Hints */}
                    {!loading && hints && (
                        <div className="space-y-3">
                            {['hint1', 'hint2', 'hint3'].map((key, index) => (
                                <div 
                                    key={key}
                                    className={`rounded-lg border-2 transition-all duration-300 ${
                                        revealedHints[index] 
                                            ? 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' 
                                            : 'border-gray-200 dark:border-leet-border bg-gray-50 dark:bg-leet-input'
                                    }`}
                                >
                                    <button
                                        onClick={() => revealedHints[index] ? toggleExpand(index) : revealHint(index)}
                                        disabled={!canReveal(index)}
                                        className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                                            !canReveal(index) ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100 dark:hover:bg-leet-border/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                                revealedHints[index]
                                                    ? 'bg-yellow-400 text-yellow-900'
                                                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                            }`}>
                                                {index + 1}
                                            </span>
                                            <div>
                                                <p className="font-medium dark:text-white">
                                                    {hintLabels[index].title}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {hintLabels[index].description}
                                                </p>
                                            </div>
                                        </div>
                                        {!canReveal(index) ? (
                                            <FaLock className="text-gray-400" />
                                        ) : revealedHints[index] ? (
                                            expandedHint === index ? <FaChevronUp /> : <FaChevronDown />
                                        ) : (
                                            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                                Click to reveal
                                            </span>
                                        )}
                                    </button>
                                    
                                    {/* Expanded Hint Content */}
                                    {revealedHints[index] && expandedHint === index && (
                                        <div className="px-4 pb-4 pt-2 border-t border-yellow-200 dark:border-yellow-700/50">
                                            <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line">
                                                {hints[key]}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Progress Indicator */}
                    {!loading && hints && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                            {revealedHints.map((revealed, idx) => (
                                <div
                                    key={idx}
                                    className={`w-3 h-3 rounded-full transition-colors ${
                                        revealed ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t dark:border-leet-border bg-gray-50 dark:bg-leet-input flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-leet-border dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HintModal;
