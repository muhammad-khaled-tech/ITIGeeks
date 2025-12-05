import React, { useState, Suspense, lazy } from 'react';
import { FaTimes, FaRobot, FaPlay, FaSpinner } from 'react-icons/fa';
import * as markedLib from 'marked';
const marked = markedLib.marked || markedLib;

const Editor = lazy(() => import('@monaco-editor/react'));

const CodeReviewModal = ({ isOpen, onClose, problemName }) => {
    const [code, setCode] = useState('// Paste your solution here');
    const [language, setLanguage] = useState('javascript');
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReview = async () => {
        setLoading(true);
        setReview('');

        try {
            // Import Gemini service
            const { reviewCode } = await import('../services/geminiService');

            // Call Gemini API for code review
            const geminiReview = await reviewCode(code, problemName, language);
            setReview(geminiReview);
        } catch (error) {
            console.error('Code Review Error:', error);

            // Fallback to mock response on error
            const mockResponse = `### ⚠️ API Error - Using Fallback Review

**Error**: ${error.message}

### Performance Report for ${problemName}

| Metric | Value | Notes |
| :--- | :--- | :--- |
| **Time Complexity** | O(n) | Linear scan is typical for this problem type. |
| **Space Complexity** | O(1) | Minimal extra space used. |

**General Feedback:**
- Code structure looks reasonable
- Consider edge cases (empty input, null values)
- Add comments for complex logic
- Test with various input sizes

**Note**: Configure Gemini API key for detailed AI-powered reviews.`;

            setReview(mockResponse);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-leet-card w-full max-w-7xl rounded-lg shadow-2xl overflow-hidden flex flex-col h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b dark:border-leet-border bg-gray-50 dark:bg-leet-input">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                        <FaRobot className="text-purple-500" /> AI Code Review: {problemName}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    {/* Editor Section */}
                    <div className="w-full md:w-1/2 flex flex-col border-r dark:border-leet-border">
                        <div className="p-2 bg-gray-100 dark:bg-leet-card flex justify-between items-center">
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="text-sm rounded border-gray-300 dark:bg-leet-input dark:text-white p-1"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                            </select>
                            <button
                                onClick={handleReview}
                                disabled={loading}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                            >
                                {loading ? 'Analyzing...' : <><FaPlay size={10} /> Review</>}
                            </button>
                        </div>
                        <div className="flex-grow relative">
                            <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-leet-input"><FaSpinner className="animate-spin" /></div>}>
                                <Editor
                                    height="100%"
                                    defaultLanguage="javascript"
                                    language={language}
                                    value={code}
                                    onChange={(value) => setCode(value)}
                                    theme="vs-dark"
                                    options={{
                                        minimap: { enabled: true },
                                        fontSize: 14,
                                        scrollBeyondLastLine: false,
                                    }}
                                />
                            </Suspense>
                        </div>
                    </div>

                    {/* Review Output Section */}
                    <div className="w-full md:w-1/2 p-4 overflow-y-auto bg-gray-50 dark:bg-leet-bg dark:text-gray-300 prose dark:prose-invert">
                        {review ? (
                            <div dangerouslySetInnerHTML={{ __html: marked.parse(review) }} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                                <FaRobot size={48} className="mb-4" />
                                <p>Click "Review" to get AI feedback.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeReviewModal;
