/**
 * Difficulty Level Presets for Smart Problem Set Builder
 * Used in Assignments and Contests to generate balanced problem sets
 */

export const DIFFICULTY_LEVELS = {
  1: {
    name: "Foundation",
    description: "Perfect for beginners - Focus on fundamentals",
    mix: { easy: 70, medium: 30, hard: 0 },
    defaultTotal: 10,
    recommendedTopics: ["Array", "String", "Hash Table", "Two Pointers"],
    icon: "🌱"
  },
  2: {
    name: "Intermediate",
    description: "Building core problem-solving skills",
    mix: { easy: 50, medium: 40, hard: 10 },
    defaultTotal: 15,
    recommendedTopics: ["Array", "String", "Hash Table", "Two Pointers", "Sorting", "Binary Search"],
    icon: "📈"
  },
  3: {
    name: "Advanced",
    description: "Competitive programming preparation",
    mix: { easy: 30, medium: 50, hard: 20 },
    defaultTotal: 20,
    recommendedTopics: ["Dynamic Programming", "Tree", "Graph", "Backtracking", "Greedy"],
    icon: "🚀"
  },
  4: {
    name: "Expert",
    description: "Master advanced algorithms",
    mix: { easy: 20, medium: 50, hard: 30 },
    defaultTotal: 25,
    recommendedTopics: ["Dynamic Programming", "Graph", "Segment Tree", "Bit Manipulation", "Trie"],
    icon: "🎯"
  },
  5: {
    name: "Champion",
    description: "Elite-level challenges",
    mix: { easy: 10, medium: 40, hard: 50 },
    defaultTotal: 30,
    recommendedTopics: [], // All topics
    icon: "🏆"
  }
};

export const DEFAULT_LEVEL = 2; // Intermediate

/**
 * Get level configuration by level number
 * @param {number} level - Level number (1-5)
 * @returns {Object} Level configuration
 */
export const getLevelConfig = (level) => {
  return DIFFICULTY_LEVELS[level] || DIFFICULTY_LEVELS[DEFAULT_LEVEL];
};

/**
 * Validate custom mix percentages
 * @param {Object} mix - Custom mix {easy, medium, hard}
 * @returns {boolean} Whether the mix is valid (sums to 100)
 */
export const validateMix = (mix) => {
  const total = (mix.easy || 0) + (mix.medium || 0) + (mix.hard || 0);
  return total === 100;
};
