import React, { useState, Suspense, lazy } from 'react';
import { FaTimes, FaRobot, FaPlay, FaSpinner, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import * as markedLib from 'marked';
const marked = markedLib.marked || markedLib;

const Editor = lazy(() => import('@monaco-editor/react'));

const CodeReviewModal = ({ isOpen, onClose, problemName, problemDescription = '' }) => {
    const [code, setCode] = useState('// Paste your solution here');
    const [language, setLanguage] = useState('javascript');
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [verdict, setVerdict] = useState(null); // 'correct', 'incorrect', 'partial', null

    const parseVerdict = (reviewText) => {
        if (reviewText.includes('✅ LIKELY CORRECT')) return 'correct';
        if (reviewText.includes('❌ LIKELY INCORRECT')) return 'incorrect';
        if (reviewText.includes('⚠️ PARTIALLY CORRECT')) return 'partial';
        return null;
    };

    const handleReview = async () => {
        if (code.trim() === '// Paste your solution here' || code.trim().length < 10) {
            setError('Please paste your solution code first!');
            return;
        }

        setLoading(true);
        setReview('');
        setError(null);
        setVerdict(null);

        try {
            // Import Gemini service
            const { reviewCode } = await import('../services/geminiService');

            // Call Gemini API for code review with problem description
            const geminiReview = await reviewCode(code, problemName, language, problemDescription);
            setReview(geminiReview);
            setVerdict(parseVerdict(geminiReview));
        } catch (err) {
            console.error('Code Review Error:', err);
            setError(err.message);

            // Fallback review
            const mockResponse = `## ⚠️ API Error - Using Fallback Review

**Error**: ${err.message}

---

### Performance Report for "${problemName}"

| Metric | Value | Notes |
| :--- | :--- | :--- |
| **Time Complexity** | Unknown | Configure API key for analysis |
| **Space Complexity** | Unknown | Configure API key for analysis |

### General Feedback:
- Code structure appears reasonable
- Consider edge cases (empty input, null values)
- Add comments for complex logic
- Test with various input sizes

> **Note**: Configure your Gemini API key in Settings for detailed AI-powered reviews with correctness validation.`;

            setReview(mockResponse);
            setVerdict(null);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const VerdictBanner = () => {
        if (!verdict) return null;

        const configs = {
            correct: {
                bg: 'bg-green-100 dark:bg-green-900/30 border-green-500',
                icon: <FaCheckCircle className="text-2xl text-green-500" />,
                text: 'Solution Looks Correct! ✨',
                subtext: 'Great job! The logic appears to be sound.'
            },
            incorrect: {
                bg: 'bg-red-100 dark:bg-red-900/30 border-red-500',
                icon: <FaTimesCircle className="text-2xl text-red-500" />,
                text: 'Solution May Be Incorrect',
                subtext: 'Check the review for specific issues.'
            },
            partial: {
                bg: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500',
                icon: <FaExclamationTriangle className="text-2xl text-yellow-500" />,
                text: 'Partially Correct',
                subtext: 'Works for some cases but has edge case issues.'
            }
        };

        const config = configs[verdict];
        return (
            <div className={`${config.bg} border-l-4 p-4 mb-4 rounded-r-lg flex items-center gap-3`}>
                {config.icon}
                <div>
                    <p className="font-bold text-gray-800 dark:text-gray-100">{config.text}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{config.subtext}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-leet-card w-full max-w-7xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b dark:border-leet-border bg-gradient-to-r from-purple-600 to-indigo-600">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FaRobot className="text-xl" />
                        AI Code Review: {problemName}
                    </h3>
                    <button onClick={onClose} className="text-white hover:opacity-80 transition-opacity">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    {/* Editor Section */}
                    <div className="w-full md:w-1/2 flex flex-col border-r dark:border-leet-border">
                        <div className="p-3 bg-gray-100 dark:bg-leet-input flex justify-between items-center gap-3">
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="text-sm rounded-lg border-gray-300 dark:bg-leet-card dark:border-leet-border dark:text-white px-3 py-2"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                                <option value="c">C</option>
                                <option value="typescript">TypeScript</option>
                                <option value="go">Go</option>
                                <option value="rust">Rust</option>
                            </select>
                            <button
                                onClick={handleReview}
                                disabled={loading}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50 transition-all"
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className="animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <FaPlay size={12} />
                                        Review Code
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="flex-grow relative">
                            <Suspense fallback={
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-leet-input">
                                    <FaSpinner className="animate-spin text-2xl text-gray-400" />
                                </div>
                            }>
                                <Editor
                                    height="100%"
                                    defaultLanguage="javascript"
                                    language={language}
                                    value={code}
                                    onChange={(value) => setCode(value || '')}
                                    theme="vs-dark"
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        scrollBeyondLastLine: false,
                                        lineNumbers: 'on',
                                        padding: { top: 10 }
                                    }}
                                />
                            </Suspense>
                        </div>
                    </div>

                    {/* Review Output Section */}
                    <div className="w-full md:w-1/2 flex flex-col bg-gray-50 dark:bg-leet-bg overflow-hidden">
                        <div className="flex-grow overflow-y-auto p-5">
                            {/* Error Banner */}
                            {error && (
                                <div className="mb-4 p-3 bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500 rounded-r-lg">
                                    <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                                        ⚠️ API Error: {error}
                                    </p>
                                    <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                                        Using fallback review. Configure your Gemini API key for full analysis.
                                    </p>
                                </div>
                            )}

                            {/* Verdict Banner */}
                            <VerdictBanner />

                            {review ? (
                                <div 
                                    className="prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: marked.parse(review) }} 
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <FaRobot size={56} className="mb-4 opacity-30" />
                                    <p className="text-lg font-medium">Ready to Review</p>
                                    <p className="text-sm mt-2">
                                        Paste your code and click "Review Code" for AI analysis
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeReviewModal;
