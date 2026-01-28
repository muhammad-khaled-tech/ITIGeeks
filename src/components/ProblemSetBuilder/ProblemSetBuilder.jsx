import React, { useState } from 'react';
import { FaTimes, FaFileImport, FaMagic } from 'react-icons/fa';
import ImportTab from './ImportTab';
import SmartSelectionTab from './SmartSelectionTab';
import ProblemPreviewModal from './ProblemPreviewModal';

/**
 * Problem Set Builder Component
 * Main modal for building problem sets through import or smart selection
 * Used in Assignments and Contests admin pages
 */
const ProblemSetBuilder = ({ isOpen, onClose, onConfirm }) => {
  const [activeTab, setActiveTab] = useState('smart'); // 'import' or 'smart'
  const [generatedResult, setGeneratedResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  // Handle generated problems from SmartSelectionTab
  const handleSmartGenerate = (result) => {
    setGeneratedResult(result);
    setShowPreview(true);
  };

  // Handle imported problems from ImportTab
  const handleImportComplete = (result) => {
    if (result.problems && result.problems.length > 0) {
      setGeneratedResult(result);
      setShowPreview(true);
    }
  };

  // Confirm and add problems
  const handleConfirm = (problems) => {
    onConfirm(problems);
    setShowPreview(false);
    setGeneratedResult(null);
    onClose();
  };

  // Regenerate with same settings
  const handleRegenerate = () => {
    setShowPreview(false);
    // SmartSelectionTab will handle regeneration through its own button
  };

  // Close and reset
  const handleClose = () => {
    setShowPreview(false);
    setGeneratedResult(null);
    onClose();
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                Build Problem Set
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Import from files or generate a smart selection from our database
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition
                       p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <FaTimes size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('smart')}
              className={`flex-1 py-4 px-6 font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'smart'
                  ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10'
                  : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <FaMagic />
              Smart Selection
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-4 px-6 font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'import'
                  ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10'
                  : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <FaFileImport />
              Import Files/URLs
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-240px)]">
            {activeTab === 'smart' ? (
              <SmartSelectionTab onGenerate={handleSmartGenerate} />
            ) : (
              <ImportTab onImportComplete={handleImportComplete} />
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && generatedResult && (
        <ProblemPreviewModal
          problems={generatedResult.problems}
          warnings={generatedResult.warnings}
          stats={generatedResult.stats}
          onClose={() => setShowPreview(false)}
          onConfirm={handleConfirm}
          onRegenerate={handleRegenerate}
        />
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default ProblemSetBuilder;
