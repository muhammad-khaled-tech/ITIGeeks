import React, { useState } from 'react';
import { FaMagic, FaSpinner, FaInfoCircle } from 'react-icons/fa';
import { useProblemSetBuilder } from '../../hooks/useProblemSetBuilder';
import { DIFFICULTY_LEVELS, DEFAULT_LEVEL } from '../../config/difficultyLevels';
import PresetLevelSelector from './PresetLevelSelector';
import CustomMixSliders from './CustomMixSliders';
import TopicMultiSelect from './TopicMultiSelect';
import DifficultyDistributionBar from './DifficultyDistributionBar';

/**
 * Smart Selection Tab Component
 * Allows admins to randomly select problems based on difficulty levels and topics
 */
const SmartSelectionTab = ({ onGenerate }) => {
  const { availableTopics, loading, error, generateRandomSet, getAvailableStats } = useProblemSetBuilder();
  
  // Selection mode: 'preset' or 'custom'
  const [mode, setMode] = useState('preset');
  
  // Preset mode settings
  const [selectedLevel, setSelectedLevel] = useState(DEFAULT_LEVEL);
  const [totalProblems, setTotalProblems] = useState(DIFFICULTY_LEVELS[DEFAULT_LEVEL].defaultTotal);
  
  // Custom mode settings
  const [customMix, setCustomMix] = useState({ easy: 50, medium: 40, hard: 10 });
  const [customTotal, setCustomTotal] = useState(15);
  
  // Topic filter
  const [selectedTopics, setSelectedTopics] = useState([]);
  
  // Generating state
  const [generating, setGenerating] = useState(false);

  // Get current mix based on mode
  const currentMix = mode === 'preset' 
    ? DIFFICULTY_LEVELS[selectedLevel].mix 
    : customMix;
  
  const currentTotal = mode === 'preset' ? totalProblems : customTotal;

  // Get available stats for selected topics
  const availableStats = getAvailableStats(selectedTopics);

  const handleGenerate = () => {
    setGenerating(true);
    
    // Small delay for UX feedback
    setTimeout(() => {
      const result = generateRandomSet({
        level: mode === 'preset' ? selectedLevel : null,
        customMix: mode === 'custom' ? customMix : null,
        totalProblems: currentTotal,
        topics: selectedTopics.length > 0 ? selectedTopics : null
      });

      setGenerating(false);
      
      if (result.problems.length > 0 || result.warnings.length > 0) {
        onGenerate(result);
      }
    }, 300);
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <FaInfoCircle className="text-red-500 text-4xl mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
          Failed to load problem database
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Selection Mode
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setMode('preset')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              mode === 'preset'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🎯 Preset Levels
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              mode === 'custom'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🎨 Custom Mix
          </button>
        </div>
      </div>

      {/* Mode-specific Settings */}
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
        {mode === 'preset' ? (
          <PresetLevelSelector
            selectedLevel={selectedLevel}
            onLevelChange={setSelectedLevel}
            totalProblems={totalProblems}
            onTotalChange={setTotalProblems}
          />
        ) : (
          <div className="space-y-4">
            <CustomMixSliders
              mix={customMix}
              onChange={setCustomMix}
              totalProblems={customTotal}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Number of Problems
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={customTotal}
                onChange={(e) => setCustomTotal(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent
                         transition-all duration-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Difficulty Distribution Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          📊 Difficulty Distribution
        </label>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
          <DifficultyDistributionBar mix={currentMix} totalProblems={currentTotal} />
        </div>
      </div>

      {/* Topic Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          🏷️ Topic Filter
        </label>
        <TopicMultiSelect
          availableTopics={availableTopics}
          selectedTopics={selectedTopics}
          onChange={setSelectedTopics}
          loading={loading}
        />
      </div>

      {/* Available Problems Info */}
      {!loading && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <FaInfoCircle className="text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200">
                Available Problems {selectedTopics.length > 0 ? '(Filtered)' : ''}
              </h4>
              <div className="flex gap-4 mt-2 text-sm text-blue-700 dark:text-blue-300">
                <span>Total: <strong>{availableStats.total}</strong></span>
                <span>Easy: <strong>{availableStats.easy}</strong></span>
                <span>Medium: <strong>{availableStats.medium}</strong></span>
                <span>Hard: <strong>{availableStats.hard}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || generating}
        className="w-full py-4 rounded-xl font-bold text-lg
                 bg-gradient-to-r from-purple-600 to-blue-600
                 text-white shadow-lg shadow-purple-500/30
                 hover:from-purple-700 hover:to-blue-700
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-200
                 flex items-center justify-center gap-3"
      >
        {generating ? (
          <>
            <FaSpinner className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FaMagic />
            Generate {currentTotal} Problem{currentTotal !== 1 ? 's' : ''}
          </>
        )}
      </button>
    </div>
  );
};

export default SmartSelectionTab;
