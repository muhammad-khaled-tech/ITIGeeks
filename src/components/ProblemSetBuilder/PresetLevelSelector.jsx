import React from 'react';
import { DIFFICULTY_LEVELS } from '../../config/difficultyLevels';

/**
 * Preset Level Selector Component
 * Dropdown for selecting one of 5 difficulty presets
 */
const PresetLevelSelector = ({ selectedLevel, onLevelChange, onTotalChange, totalProblems }) => {
  const level = DIFFICULTY_LEVELS[selectedLevel];

  const handleLevelChange = (e) => {
    const newLevel = parseInt(e.target.value);
    onLevelChange(newLevel);
    
    // Update total to default for this level
    if (DIFFICULTY_LEVELS[newLevel]) {
      onTotalChange(DIFFICULTY_LEVELS[newLevel].defaultTotal);
    }
  };

  return (
    <div className="space-y-4">
      {/* Level Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Difficulty Level
        </label>
        <select
          value={selectedLevel}
          onChange={handleLevelChange}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-purple-500 focus:border-transparent
                   transition-all duration-200"
        >
          {Object.entries(DIFFICULTY_LEVELS).map(([key, config]) => (
            <option key={key} value={key}>
              {config.icon} Level {key}: {config.name} - {config.description}
            </option>
          ))}
        </select>
      </div>

      {/* Level Info Card */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 
                    rounded-lg p-4 border border-purple-200 dark:border-gray-600">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{level.icon}</span>
          <div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">
              {level.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {level.description}
            </p>
          </div>
        </div>

        {/* Recommended Topics */}
        {level.recommendedTopics.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Recommended Topics:
            </p>
            <div className="flex flex-wrap gap-1">
              {level.recommendedTopics.map(topic => (
                <span
                  key={topic}
                  className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 
                           text-purple-700 dark:text-purple-300"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Total Problems Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Total Number of Problems
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={totalProblems}
          onChange={(e) => onTotalChange(parseInt(e.target.value) || 1)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-purple-500 focus:border-transparent
                   transition-all duration-200"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Default for this level: {level.defaultTotal} problems
        </p>
      </div>
    </div>
  );
};

export default PresetLevelSelector;
