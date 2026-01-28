
import React, { useState } from 'react';
import { FaPaperPlane, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const WeeklyReport = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSendReport = async () => {
        if (!confirm("Are you sure? This will send REAL emails to all students!")) return;
        
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Call the Cron Job API manually
            // Note: In dev, this calls localhost:3000/api/... 
            // In prod, it calls the serverless function.
            const res = await fetch('/api/cron/weekly-report', {
                method: 'GET',
                headers: {
                    // Start with a mock secret if env not set for testing, or rely on internal protection
                    // 'Authorization': 'Bearer ...' 
                }
            });
            
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to send report');
            
            setResult(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Weekly Report Control</h1>

            <div className="bg-white dark:bg-leet-card rounded-lg shadow p-6 max-w-2xl">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                        <FaPaperPlane className="text-xl" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manual Trigger</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            This will trigger the "Top G" calculation and send emails to all registered students via Resend.
                        </p>
                    </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                        <FaExclamationTriangle className="text-yellow-400 mt-1 mr-3" />
                        <div>
                            <p className="text-sm text-yellow-700 dark:text-yellow-200">
                                <strong>Warning:</strong> This action sends <strong>real emails</strong>. 
                                Ensure you have verified the data logic before clicking.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSendReport}
                    disabled={loading}
                    className={`w-full flex justify-center items-center gap-2 px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white 
                        ${loading ? 'bg-gray-400' : 'bg-brand hover:bg-brand-hover'} transition-colors focus:outline-none`}
                >
                    {loading ? <FaSpinner className="animate-spin" /> : 'Send Weekly Report Now'}
                </button>

                {/* Results Area */}
                <div className="mt-6">
                    {result && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 flex items-center gap-3">
                            <FaCheck /> 
                            <div>
                                <p className="font-bold">Success!</p>
                                <p className="text-sm">{JSON.stringify(result)}</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                            <p className="font-bold">Error:</p>
                            <p className="text-sm">{error}</p>
                            {error.includes('Missing API Key') && (
                                <p className="text-xs mt-2">Make sure RESEND_API_KEY is set in Vercel Environment Variables.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WeeklyReport;
