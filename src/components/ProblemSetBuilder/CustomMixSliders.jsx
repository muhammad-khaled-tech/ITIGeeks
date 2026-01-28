import React, { useState, useEffect } from 'react';

/**
 * Custom Mix Sliders Component
 * Interactive sliders for customizing difficulty percentages
 */
const CustomMixSliders = ({ mix, onChange, totalProblems }) => {
  const [tempMix, setTempMix] = useState(mix);

  useEffect(() => {
    setTempMix(mix);
  }, [mix]);

  const handleSliderChange = (difficulty, value) => {
    const newValue = parseInt(value);
    let newMix = { ...tempMix, [difficulty]: newValue };

    // Calculate remaining percentage
    const others = difficulty === 'easy' ? ['medium', 'hard'] :
                   difficulty === 'medium' ? ['easy', 'hard'] : ['easy', 'medium'];
    
    const remaining = 100 - newValue;
    const currentOthersTotal = others.reduce((sum, key) => sum + newMix[key], 0);

    // Distribute remaining proportionally
    if (currentOthersTotal > 0) {
      others.forEach(key => {
        newMix[key] = Math.round((newMix[key] / currentOthersTotal) * remaining);
      });
    } else {
      // If both others are 0, split evenly
      newMix[others[0]] = Math.floor(remaining / 2);
      newMix[others[1]] = remaining - newMix[others[0]];
    }

    // Final adjustment to ensure exactly 100%
    const total = newMix.easy + newMix.medium + newMix.hard;
    if (total !== 100) {
      newMix.medium += (100 - total);
    }

    setTempMix(newMix);
    onChange(newMix);
  };

  const counts = {
    easy: Math.round(totalProblems * (tempMix.easy / 100)),
    medium: Math.round(totalProblems * (tempMix.medium / 100)),
    hard: Math.round(totalProblems * (tempMix.hard / 100))
  };

  const total = tempMix.easy + tempMix.medium + tempMix.hard;
  const isValid = total === 100;

  return (
    <div className="space-y-6">
      {/* Easy Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-green-600 dark:text-green-400">
            Easy
          </label>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {tempMix.easy}% ({counts.easy} problems)
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={tempMix.easy}
          onChange={(e) => handleSliderChange('easy', e.target.value)}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer 
                   dark:bg-gray-700
                   [&::-webkit-slider-thumb]:appearance-none 
                   [&::-webkit-slider-thumb]:w-5 
                   [&::-webkit-slider-thumb]:h-5 
                   [&::-webkit-slider-thumb]:bg-green-500 
                   [&::-webkit-slider-thumb]:rounded-full 
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:shadow-lg
                   [&::-moz-range-thumb]:w-5 
                   [&::-moz-range-thumb]:h-5 
                   [&::-moz-range-thumb]:bg-green-500 
                   [&::-moz-range-thumb]:rounded-full 
                   [&::-moz-range-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:shadow-lg"
        />
      </div>

      {/* Medium Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
            Medium
          </label>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {tempMix.medium}% ({counts.medium} problems)
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={tempMix.medium}
          onChange={(e) => handleSliderChange('medium', e.target.value)}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer 
                   dark:bg-gray-700
                   [&::-webkit-slider-thumb]:appearance-none 
                   [&::-webkit-slider-thumb]:w-5 
                   [&::-webkit-slider-thumb]:h-5 
                   [&::-webkit-slider-thumb]:bg-yellow-500 
                   [&::-webkit-slider-thumb]:rounded-full 
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:shadow-lg
                   [&::-moz-range-thumb]:w-5 
                   [&::-moz-range-thumb]:h-5 
                   [&::-moz-range-thumb]:bg-yellow-500 
                   [&::-moz-range-thumb]:rounded-full 
                   [&::-moz-range-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:shadow-lg"
        />
      </div>

      {/* Hard Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-red-600 dark:text-red-400">
            Hard
          </label>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {tempMix.hard}% ({counts.hard} problems)
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={tempMix.hard}
          onChange={(e) => handleSliderChange('hard', e.target.value)}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer 
                   dark:bg-gray-700
                   [&::-webkit-slider-thumb]:appearance-none 
                   [&::-webkit-slider-thumb]:w-5 
                   [&::-webkit-slider-thumb]:h-5 
                   [&::-webkit-slider-thumb]:bg-red-500 
                   [&::-webkit-slider-thumb]:rounded-full 
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:shadow-lg
                   [&::-moz-range-thumb]:w-5 
                   [&::-moz-range-thumb]:h-5 
                   [&::-moz-range-thumb]:bg-red-500 
                   [&::-moz-range-thumb]:rounded-full 
                   [&::-moz-range-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:shadow-lg"
        />
      </div>

      {/* Total Validation */}
      <div className={`p-3 rounded-lg ${isValid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total:
          </span>
          <span className={`text-lg font-bold ${isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {total}% {isValid ? '✅' : '❌'}
          </span>
        </div>
        {!isValid && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Total must equal 100%
          </p>
        )}
      </div>
    </div>
  );
};

export default CustomMixSliders;
