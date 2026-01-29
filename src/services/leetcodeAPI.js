/**
 * LeetCode API Service
 * Interfaces with the dedicated alfa-leetcode-api deployment
 */

const API_BASE =
  import.meta.env.VITE_LEETCODE_API_URL ||
  "https://alfa-leetcode-api.onrender.com";

export class LeetCodeAPI {
  /**
   * Get user profile summary
   */
  static async getUserProfile(username) {
    try {
      const response = await fetch(`${API_BASE}/${username}`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching profile for ${username}:`, error);
      return null;
    }
  }

  /**
   * Get solved problems breakdown (Easy, Medium, Hard)
   */
  static async getSolved(username) {
    try {
      const response = await fetch(`${API_BASE}/${username}/solved`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching solved stats for ${username}:`, error);
      return {
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        solvedProblem: 0,
      };
    }
  }

  /**
   * Get submission calendar for streak calculation
   */
  static async getCalendar(username) {
    try {
      const response = await fetch(`${API_BASE}/${username}/calendar`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching calendar for ${username}:`, error);
      return { submissionCalendar: "{}" };
    }
  }

  /**
   * Get skill stats (Tags like Arrays, DP, etc.)
   */
  static async getSkillStats(username) {
    try {
      const response = await fetch(`${API_BASE}/${username}/skill`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching skill stats for ${username}:`, error);
      return {
        data: {
          matchedUser: {
            tagProblemCounts: {
              advanced: [],
              intermediate: [],
              fundamental: [],
            },
          },
        },
      };
    }
  }

  /**
   * Get language stats
   */
  static async getLanguageStats(username) {
    try {
      const response = await fetch(`${API_BASE}/${username}/language`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching language stats for ${username}:`, error);
      return { data: { matchedUser: { languageProblemCount: [] } } };
    }
  }

  /**
   * Get recent submissions
   */
  static async getSubmissions(username, limit = 20) {
    try {
      const response = await fetch(
        `${API_BASE}/${username}/submission?limit=${limit}`,
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching submissions for ${username}:`, error);
      return { count: 0, submission: [] };
    }
  }
}
