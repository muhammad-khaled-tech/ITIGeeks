import React, { useState } from 'react';
import { FaCheck, FaTimes, FaSearch } from 'react-icons/fa';

/**
 * Topic Multi-Select Component
 * Allows selecting multiple topics for problem filtering
 */
const TopicMultiSelect = ({ availableTopics, selectedTopics, onChange, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const isAllTopics = selectedTopics.length === 0;

  const filteredTopics = availableTopics.filter(topic =>
    topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      onChange(selectedTopics.filter(t => t !== topic));
    } else {
      onChange([...selectedTopics, topic]);
    }
  };

  const selectAll = () => { onChange([]); setIsOpen(false); };
  const clearAll = () => onChange([...availableTopics]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* All Topics Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={selectAll}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isAllTopics
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          All Topics
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            !isAllTopics
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Specific Topics {!isAllTopics && `(${selectedTopics.length})`}
        </button>
      </div>

      {/* Topic Selection Dropdown */}
      {isOpen && (
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 
                         border border-gray-200 dark:border-gray-600
                         text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Topic List */}
          <div className="max-h-48 overflow-y-auto p-2">
            {filteredTopics.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No topics found
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredTopics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left
                               transition-all duration-150 ${
                      selectedTopics.includes(topic)
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-650'
                    }`}
                  >
                    {selectedTopics.includes(topic) && (
                      <FaCheck className="text-purple-600 dark:text-purple-400 shrink-0" size={12} />
                    )}
                    <span className="truncate">{topic}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-600 flex justify-between">
            <button
              onClick={() => onChange([...availableTopics])}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              Select All
            </button>
            <button
              onClick={selectAll}
              className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Selected Topics Pills */}
      {!isAllTopics && selectedTopics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTopics.map(topic => (
            <span
              key={topic}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full 
                       bg-purple-100 dark:bg-purple-900/30 
                       text-purple-700 dark:text-purple-300 text-sm"
            >
              {topic}
              <button
                onClick={() => toggleTopic(topic)}
                className="hover:text-purple-900 dark:hover:text-purple-100"
              >
                <FaTimes size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicMultiSelect;
