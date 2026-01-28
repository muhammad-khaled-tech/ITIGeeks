import React from 'react';

/**
 * Difficulty Distribution Bar Chart
 * Visual representation of problem difficulty mix
 */
const DifficultyDistributionBar = ({ mix, totalProblems }) => {
  const counts = {
    easy: Math.round(totalProblems * (mix.easy / 100)),
    medium: Math.round(totalProblems * (mix.medium / 100)),
    hard: Math.round(totalProblems * (mix.hard / 100))
  };

  // Adjust for rounding
  const total = counts.easy + counts.medium + counts.hard;
  if (total < totalProblems) counts.medium += (totalProblems - total);
  else if (total > totalProblems) counts.medium -= (total - totalProblems);

  return (
    <div className="space-y-3">
      {/* Easy */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-green-600 dark:text-green-400">Easy</span>
          <span className="text-gray-600 dark:text-gray-400">
            {mix.easy}% ({counts.easy} problem{counts.easy !== 1 ? 's' : ''})
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${mix.easy}%` }}
          />
        </div>
      </div>

      {/* Medium */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-yellow-600 dark:text-yellow-400">Medium</span>
          <span className="text-gray-600 dark:text-gray-400">
            {mix.medium}% ({counts.medium} problem{counts.medium !== 1 ? 's' : ''})
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${mix.medium}%` }}
          />
        </div>
      </div>

      {/* Hard */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-red-600 dark:text-red-400">Hard</span>
          <span className="text-gray-600 dark:text-gray-400">
            {mix.hard}% ({counts.hard} problem{counts.hard !== 1 ? 's' : ''})
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-red-400 to-red-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${mix.hard}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default DifficultyDistributionBar;
