import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import { DIFFICULTY_LEVELS, DEFAULT_LEVEL } from '../config/difficultyLevels';

const META_SHEET_CSV = "https://docs.google.com/spreadsheets/d/1sRWp95wqo3a7lLBbtNd_3KkTyGjx_9sctTOL5JOb6pA/export?format=csv";

/**
 * Custom hook for building problem sets from Google Sheets database
 * Supports smart random selection with difficulty levels and topic filtering
 */
export const useProblemSetBuilder = () => {
  const [allProblems, setAllProblems] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load problems from Google Sheets on mount
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const res = await fetch(META_SHEET_CSV);
        
        if (!res.ok) {
          throw new Error('Failed to fetch problem database');
        }
        
        const text = await res.text();
        
        Papa.parse(text, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            const problems = [];
            const topics = new Set();

            // Skip first 3 rows (headers) - based on existing code pattern
            results.data.slice(3).forEach(row => {
              if (row.length > 6) {
                const title = row[1]?.trim();
                const topic = row[5]?.trim();
                const difficulty = row[6]?.trim();

                if (title && difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
                  const slug = title.toLowerCase().replace(/\s+/g, '-');
                  
                  problems.push({
                    title,
                    titleSlug: slug,
                    difficulty,
                    topic: topic || 'Uncategorized',
                    type: topic || 'Uncategorized', // Alias for compatibility
                    url: `https://leetcode.com/problems/${slug}/`,
                    status: 'Todo', // Default status
                    addedAt: new Date().toISOString()
                  });

                  if (topic) topics.add(topic);
                }
              }
            });

            setAllProblems(problems);
            setAvailableTopics(Array.from(topics).sort());
            setLoading(false);
            console.log(`Loaded ${problems.length} problems from database`);
          },
          error: (err) => {
            console.error('CSV parsing error:', err);
            setError('Failed to parse problem database');
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('Failed to load problems:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  /**
   * Generate random problem set based on configuration
   * @param {Object} config - Configuration object
   * @param {number} config.level - Preset level (1-5) or null for custom
   * @param {Object} config.customMix - Custom mix {easy: %, medium: %, hard: %} or null
   * @param {number} config.totalProblems - Total number of problems
   * @param {Array<string>} config.topics - Selected topics or empty for all
   * @returns {Object} - Result object with problems, warnings, and stats
   */
  const generateRandomSet = useCallback((config) => {
    const { level, customMix, totalProblems, topics } = config;

    // Determine difficulty mix
    let mix;
    if (customMix) {
      mix = customMix;
    } else if (level && DIFFICULTY_LEVELS[level]) {
      mix = DIFFICULTY_LEVELS[level].mix;
    } else {
      mix = DIFFICULTY_LEVELS[DEFAULT_LEVEL].mix;
    }

    // Calculate problem counts per difficulty
    const counts = {
      Easy: Math.round(totalProblems * mix.easy / 100),
      Medium: Math.round(totalProblems * mix.medium / 100),
      Hard: Math.round(totalProblems * mix.hard / 100)
    };

    // Adjust for rounding errors to ensure exact total
    const total = counts.Easy + counts.Medium + counts.Hard;
    if (total < totalProblems) {
      counts.Medium += (totalProblems - total);
    } else if (total > totalProblems) {
      counts.Medium -= (total - totalProblems);
    }

    // Filter problems by topics if specified
    let filteredProblems = allProblems;
    if (topics && topics.length > 0) {
      filteredProblems = allProblems.filter(p => topics.includes(p.topic));
    }

    // Check if we have any problems after filtering
    if (filteredProblems.length === 0) {
      return {
        success: false,
        problems: [],
        warnings: ['No problems found for selected topics. Please choose different topics or select "All Topics".'],
        stats: { requested: counts, actual: { Easy: 0, Medium: 0, Hard: 0 } }
      };
    }

    // Group by difficulty
    const problemsByDifficulty = {
      Easy: filteredProblems.filter(p => p.difficulty === 'Easy'),
      Medium: filteredProblems.filter(p => p.difficulty === 'Medium'),
      Hard: filteredProblems.filter(p => p.difficulty === 'Hard')
    };

    // Check availability and generate warnings
    const warnings = [];
    const selectedProblems = [];

    Object.entries(counts).forEach(([difficulty, count]) => {
      if (count === 0) return; // Skip if no problems requested for this difficulty
      
      const available = problemsByDifficulty[difficulty];
      
      if (available.length === 0) {
        warnings.push(`No ${difficulty} problems available for selected topics.`);
        return;
      }
      
      if (available.length < count) {
        warnings.push(
          `Only ${available.length} ${difficulty} problem${available.length === 1 ? '' : 's'} available, requested ${count}. ` +
          `Selecting all ${available.length}.`
        );
      }

      // Randomly select problems using Fisher-Yates shuffle
      const shuffled = shuffleArray([...available]);
      const selected = shuffled.slice(0, Math.min(count, available.length));
      selectedProblems.push(...selected);
    });

    const actualCounts = {
      Easy: selectedProblems.filter(p => p.difficulty === 'Easy').length,
      Medium: selectedProblems.filter(p => p.difficulty === 'Medium').length,
      Hard: selectedProblems.filter(p => p.difficulty === 'Hard').length
    };

    return {
      success: true,
      problems: selectedProblems,
      warnings,
      stats: {
        requested: counts,
        actual: actualCounts,
        total: selectedProblems.length
      }
    };
  }, [allProblems]);

  /**
   * Get statistics about available problems
   * @param {Array<string>} topics - Filter by topics (optional)
   * @returns {Object} Statistics object
   */
  const getAvailableStats = useCallback((topics = []) => {
    let filteredProblems = allProblems;
    
    if (topics && topics.length > 0) {
      filteredProblems = allProblems.filter(p => topics.includes(p.topic));
    }

    return {
      total: filteredProblems.length,
      easy: filteredProblems.filter(p => p.difficulty === 'Easy').length,
      medium: filteredProblems.filter(p => p.difficulty === 'Medium').length,
      hard: filteredProblems.filter(p => p.difficulty === 'Hard').length,
      byTopic: topics.length > 0 ? null : groupByTopic(filteredProblems)
    };
  }, [allProblems]);

  return {
    allProblems,
    availableTopics,
    loading,
    error,
    generateRandomSet,
    getAvailableStats
  };
};

/**
 * Utility: Shuffle array randomly using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Utility: Group problems by topic
 * @param {Array} problems - Problems array
 * @returns {Object} Topic counts
 */
function groupByTopic(problems) {
  return problems.reduce((acc, p) => {
    acc[p.topic] = (acc[p.topic] || 0) + 1;
    return acc;
  }, {});
}
