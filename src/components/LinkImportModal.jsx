import React, { useState } from 'react';
import { FaTimes, FaLink, FaSpinner } from 'react-icons/fa';
import { useLinkImport } from '../hooks/useLinkImport';

const LinkImportModal = ({ isOpen, onClose }) => {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const { importFromLink, importing } = useLinkImport();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!url.trim()) {
            setError('Please enter a URL');
            return;
        }

        // Validate URL format
        if (!url.includes('leetcode.com')) {
            setError('Please enter a valid LeetCode URL');
            return;
        }

        try {
            await importFromLink(url);
            setUrl('');
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to import from link');
        }
    };

    const handleClose = () => {
        if (!importing) {
            setUrl('');
            setError('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-leet-card rounded-lg shadow-xl max-w-lg w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-leet-text flex items-center">
                        <FaLink className="mr-2 text-brand" />
                        Import from Link
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={importing}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            LeetCode List/Collection URL
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={importing}
                            placeholder="https://leetcode.com/list/xxxxx or study plan URL"
                            className="w-full px-3 py-2 bg-white dark:bg-leet-input border border-gray-300 dark:border-leet-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-gray-900 dark:text-leet-text disabled:opacity-50"
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                        )}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Supported URLs:</strong>
                        </p>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 ml-4 list-disc">
                            <li>LeetCode Lists: https://leetcode.com/list/xxxxx</li>
                            <li>Study Plans: https://leetcode.com/studyplan/xxxxx</li>
                            <li>Problem Tags: https://leetcode.com/tag/xxxxx</li>
                        </ul>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={importing}
                            className="flex-1 bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {importing ? (
                                <>
                                    <FaSpinner className="animate-spin mr-2" />
                                    Importing...
                                </>
                            ) : (
                                'Import'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={importing}
                            className="px-4 py-2 border border-gray-300 dark:border-leet-border rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-leet-input transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LinkImportModal;
