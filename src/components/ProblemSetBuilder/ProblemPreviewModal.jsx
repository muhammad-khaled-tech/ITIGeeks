import React, { useState } from 'react';
import { FaTimes, FaCheck, FaExclamationTriangle, FaRedo, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';

/**
 * Problem Preview Modal
 * Shows generated problems before confirming addition to assignment/contest
 */
const ProblemPreviewModal = ({ problems, warnings, stats, onClose, onConfirm, onRegenerate }) => {
  const [selectedProblems, setSelectedProblems] = useState(problems);

  const removeProblem = (titleSlug) => {
    setSelectedProblems(selectedProblems.filter(p => p.titleSlug !== titleSlug));
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'Hard': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const currentStats = {
    Easy: selectedProblems.filter(p => p.difficulty === 'Easy').length,
    Medium: selectedProblems.filter(p => p.difficulty === 'Medium').length,
    Hard: selectedProblems.filter(p => p.difficulty === 'Hard').length
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              📋 Preview Problem Set
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {selectedProblems.length} problem{selectedProblems.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Warnings</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                  {warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="px-6 py-4 flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/30">
            <span className="text-green-600 dark:text-green-400 font-medium">Easy:</span>
            <span className="font-bold text-green-700 dark:text-green-300">{currentStats.Easy}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
            <span className="text-yellow-600 dark:text-yellow-400 font-medium">Medium:</span>
            <span className="font-bold text-yellow-700 dark:text-yellow-300">{currentStats.Medium}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30">
            <span className="text-red-600 dark:text-red-400 font-medium">Hard:</span>
            <span className="font-bold text-red-700 dark:text-red-300">{currentStats.Hard}</span>
          </div>
        </div>

        {/* Problem List */}
        <div className="overflow-y-auto max-h-[calc(80vh-380px)] p-6">
          {selectedProblems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No problems selected</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedProblems.map((problem, idx) => (
                <div
                  key={problem.titleSlug}
                  className="flex items-center justify-between p-4 rounded-lg
                           bg-gray-50 dark:bg-gray-700/50 
                           hover:bg-gray-100 dark:hover:bg-gray-700
                           transition-colors duration-150"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 dark:text-gray-500 w-6">
                      {idx + 1}.
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white">
                        {problem.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {problem.topic}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
                      title="Open in LeetCode"
                    >
                      <FaExternalLinkAlt size={14} />
                    </a>
                    <button
                      onClick={() => removeProblem(problem.titleSlug)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                      title="Remove problem"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={onRegenerate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
                     bg-gray-200 dark:bg-gray-700 
                     text-gray-700 dark:text-gray-300
                     hover:bg-gray-300 dark:hover:bg-gray-600
                     transition-colors duration-200"
          >
            <FaRedo />
            Regenerate
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg
                       bg-gray-200 dark:bg-gray-700 
                       text-gray-700 dark:text-gray-300
                       hover:bg-gray-300 dark:hover:bg-gray-600
                       transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedProblems)}
              disabled={selectedProblems.length === 0}
              className="flex items-center gap-2 px-6 py-2 rounded-lg
                       bg-gradient-to-r from-purple-600 to-blue-600
                       text-white font-medium
                       hover:from-purple-700 hover:to-blue-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              <FaCheck />
              Add {selectedProblems.length} Problem{selectedProblems.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemPreviewModal;
