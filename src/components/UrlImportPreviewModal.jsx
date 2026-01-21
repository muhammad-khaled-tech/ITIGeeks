import React, { useState } from 'react';
import { FaTimes, FaFileAlt, FaCheckCircle, FaExclamationTriangle, FaCheck, FaSpinner } from 'react-icons/fa';

const UrlImportPreviewModal = ({ isOpen, onClose, previewData, onImport, importing }) => {
    const [selectedSlugs, setSelectedSlugs] = useState(() => {
        if (!previewData) return new Set();
        return new Set(previewData.problems.filter(p => p.isNew).map(p => p.titleSlug));
    });

    if (!isOpen || !previewData) return null;

    const { fileName, totalFound, newCount, existingCount, problems } = previewData;

    const toggleSelect = (slug) => {
        setSelectedSlugs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(slug)) {
                newSet.delete(slug);
            } else {
                newSet.add(slug);
            }
            return newSet;
        });
    };

    const selectAll = () => {
        setSelectedSlugs(new Set(problems.filter(p => p.isNew).map(p => p.titleSlug)));
    };

    const selectNone = () => {
        setSelectedSlugs(new Set());
    };

    const handleImport = () => {
        const selectedProblems = problems.filter(p => selectedSlugs.has(p.titleSlug));
        onImport(selectedProblems);
    };

    const selectedCount = selectedSlugs.size;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-leet-card rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b dark:border-leet-border">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-leet-text flex items-center">
                            <FaFileAlt className="mr-2 text-brand" />
                            Import Preview
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-leet-sub mt-1">
                            {fileName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={importing}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                {/* Stats */}
                <div className="p-4 bg-gray-50 dark:bg-leet-input border-b dark:border-leet-border">
                    <div className="flex gap-6 text-sm">
                        <div>
                            <span className="font-medium text-gray-700 dark:text-leet-text">{totalFound}</span>
                            <span className="text-gray-500 dark:text-leet-sub"> URLs found</span>
                        </div>
                        <div className="text-green-600 dark:text-green-400">
                            <span className="font-medium">{newCount}</span>
                            <span> new</span>
                        </div>
                        <div className="text-yellow-600 dark:text-yellow-400">
                            <span className="font-medium">{existingCount}</span>
                            <span> already in list</span>
                        </div>
                    </div>
                </div>

                {/* Selection Controls */}
                <div className="p-3 border-b dark:border-leet-border flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={selectAll}
                            className="text-xs px-3 py-1 bg-brand/10 text-brand rounded hover:bg-brand/20 transition"
                        >
                            Select All New
                        </button>
                        <button
                            onClick={selectNone}
                            className="text-xs px-3 py-1 bg-gray-100 dark:bg-leet-border text-gray-600 dark:text-leet-sub rounded hover:bg-gray-200 dark:hover:bg-leet-input transition"
                        >
                            Clear Selection
                        </button>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-leet-sub">
                        {selectedCount} selected
                    </span>
                </div>

                {/* Problem List */}
                <div className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-1">
                        {problems.map(problem => (
                            <div
                                key={problem.titleSlug}
                                onClick={() => problem.isNew && toggleSelect(problem.titleSlug)}
                                className={`flex items-center gap-3 p-3 rounded-lg transition cursor-pointer ${
                                    !problem.isNew 
                                        ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-leet-input' 
                                        : selectedSlugs.has(problem.titleSlug)
                                            ? 'bg-brand/10 dark:bg-brand/20 border border-brand/30'
                                            : 'bg-gray-50 dark:bg-leet-input hover:bg-gray-100 dark:hover:bg-leet-border'
                                }`}
                            >
                                {/* Checkbox */}
                                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                                    !problem.isNew
                                        ? 'bg-gray-300 dark:bg-gray-600'
                                        : selectedSlugs.has(problem.titleSlug)
                                            ? 'bg-brand text-white'
                                            : 'border-2 border-gray-300 dark:border-gray-600'
                                }`}>
                                    {!problem.isNew ? (
                                        <FaExclamationTriangle className="text-xs text-white" />
                                    ) : selectedSlugs.has(problem.titleSlug) ? (
                                        <FaCheck className="text-xs" />
                                    ) : null}
                                </div>

                                {/* Problem Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-leet-text truncate">
                                        {problem.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-leet-sub truncate">
                                        {problem.url}
                                    </p>
                                </div>

                                {/* Status Badge */}
                                {!problem.isNew && (
                                    <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded flex-shrink-0">
                                        Already exists
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t dark:border-leet-border flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={importing}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-leet-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-leet-input transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={importing || selectedCount === 0}
                        className="flex-1 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center"
                    >
                        {importing ? (
                            <>
                                <FaSpinner className="animate-spin mr-2" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <FaCheckCircle className="mr-2" />
                                Import {selectedCount} Problem{selectedCount !== 1 ? 's' : ''}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UrlImportPreviewModal;
