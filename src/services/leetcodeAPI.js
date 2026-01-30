const API_BASE_EXTERNAL =
  import.meta.env.VITE_LEETCODE_API_URL ||
  "https://alfa-leetcode-api.onrender.com";

const API_BASE_INTERNAL = "/api/v2/leetcode";

export class LeetCodeAPI {
  // Cache for reducing redundant calls (5 min TTL)
  static cache = new Map();
  static CACHE_TTL = 5 * 60 * 1000;

  // Health Statistics
  static stats = {
    primarySuccess: 0,
    primaryFailure: 0,
    fallbackSuccess: 0,
    fallbackFailure: 0,
    cacheHits: 0,
  };

  // Centralized queue to prevent 429 Too Many Requests errors
  static requestQueue = Promise.resolve();
  static MIN_DELAY = 3000; // Increased to 3s base
  static FETCH_TIMEOUT = 60000; // 60s timeout (Render cold starts)
  static backoffMultiplier = 1;

  // ===== VALIDATION FUNCTIONS =====

  static validateSolvedData(data, source) {
    const total = data.solvedProblem || data.totalSolved || 0;
    const easy = data.easySolved || 0;
    const medium = data.mediumSolved || 0;
    const hard = data.hardSolved || 0;

    // Calculate sum
    const sum = easy + medium + hard;

    // Validation rules
    const hasTotal = total > 0;
    const hasBreakdown = sum > 0;
    const isConsistent = Math.abs(total - sum) <= 1; // Allow 1 diff for rounding

    const isValid = (hasTotal || hasBreakdown) && isConsistent;

    if (!isValid) {
      console.warn(
        `[LeetCodeAPI] ❌ [${source}] INVALID DATA: ` +
          `total=${total}, sum=${sum}, e=${easy}, m=${medium}, h=${hard}`,
      );
    } else {
      console.log(
        `[LeetCodeAPI] ✅ [${source}] VALID: ` +
          `${total} total (${easy}/${medium}/${hard})`,
      );
    }

    return {
      isValid,
      total: Math.max(total, sum),
      easy,
      medium,
      hard,
    };
  }

  static normalizePrimaryData(rawData) {
    return {
      username: rawData.username,
      avatar: rawData.avatar,
      ranking: rawData.ranking,
      reputation: rawData.reputation,
      contributionPoints: rawData.contributionPoints,

      // Core stats
      solvedProblem: rawData.solvedProblem || rawData.totalSolved,
      totalSolved: rawData.solvedProblem || rawData.totalSolved,
      easySolved: rawData.easySolved || 0,
      mediumSolved: rawData.mediumSolved || 0,
      hardSolved: rawData.hardSolved || 0,

      submissionCalendar: rawData.submissionCalendar,
      recentSubmissions: rawData.recentSubmissions || [],

      _source: "primary",
    };
  }

  static normalizeFallbackData(profile, submissions) {
    return {
      username: profile.username || profile.name,
      avatar: profile.avatar,
      ranking: profile.ranking,
      reputation: profile.reputation,
      contributionPoints: profile.contributionPoints || profile.reputation,

      // Core stats
      solvedProblem: profile.totalSolved || profile.solvedProblem,
      totalSolved: profile.totalSolved || profile.solvedProblem,
      easySolved: profile.easySolved || 0,
      mediumSolved: profile.mediumSolved || 0,
      hardSolved: profile.hardSolved || 0,

      submissionCalendar: profile.submissionCalendar,
      recentSubmissions: submissions?.submission || submissions || [],

      _source: "fallback",
    };
  }

  /**
   * Smart fetcher with Primary(leetcode-query) -> Fallback(Alfa-API) -> Cache
   */
  static async fetchWithFallback(username, type, externalPath) {
    const cacheKey = `${username}:${type}:${externalPath || ""}`;

    // 0. Check Cache
    if (this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < this.CACHE_TTL) {
        console.log(`[LeetCodeAPI] [CACHE HIT] ${cacheKey}`);
        this.stats.cacheHits++;
        return data; // Return cached data immediately
      }
      this.cache.delete(cacheKey); // Expired
    }

    // Add this request to the global sequence
    const currentRequest = this.requestQueue.then(async () => {
      // Apply delay + Backoff
      const delay =
        this.MIN_DELAY * this.backoffMultiplier + Math.random() * 1000;
      await new Promise((r) => setTimeout(r, delay));

      // 1. PRIMARY: Internal Proxy (leetcode-query)
      try {
        console.log(
          `[LeetCodeAPI] [PRIMARY] Fetching ${type} for ${username}...`,
        );
        let internalUrl = `${API_BASE_INTERNAL}?username=${username}&type=${type}`;
        if (externalPath?.includes("limit=")) {
          const limit = externalPath.match(/limit=(\d+)/)?.[1];
          if (limit) internalUrl += `&limit=${limit}`;
        }

        const response = await fetch(internalUrl, {
          signal: AbortSignal.timeout(this.FETCH_TIMEOUT),
        });

        if (response.ok) {
          const rawData = await response.json();
          const normalized = this.normalizePrimaryData(rawData);
          const validation = this.validateSolvedData(normalized, "PRIMARY");

          if (validation.isValid) {
            this.stats.primarySuccess++;
            this.backoffMultiplier = 1;

            // Use validated totals
            normalized.totalSolved = validation.total;
            normalized.solvedProblem = validation.total;

            this.cache.set(cacheKey, {
              data: normalized,
              timestamp: Date.now(),
            });
            return normalized;
          } else {
            console.warn(
              `[LeetCodeAPI] [PRIMARY SUSPICIOUS] Data invalid for ${username}, trying fallback...`,
            );
          }
        } else if (response.status === 503) {
          console.warn(
            `[LeetCodeAPI] [PRIMARY UNAVAILABLE] 503 for ${username}, trying fallback...`,
          );
        } else {
          throw new Error(`Primary status: ${response.status}`);
        }
      } catch (e) {
        this.stats.primaryFailure++;
        console.warn(
          `[LeetCodeAPI] [PRIMARY FAILED] ${type} for ${username}:`,
          e.message,
        );
      }

      // 2. FALLBACK: External Fallback
      try {
        console.log(
          `[LeetCodeAPI] [FALLBACK] Fetching ${type} for ${username} via External API...`,
        );

        // SPECIAL CASE: Fixing the "8 vs 26" discrepancy
        if (type === "combined") {
          const [profile, submissions] = await Promise.all([
            fetch(`${API_BASE_EXTERNAL}/${username}`, {
              signal: AbortSignal.timeout(this.FETCH_TIMEOUT),
            })
              .then((r) => r.json())
              .catch(() => ({})),
            fetch(`${API_BASE_EXTERNAL}/${username}${externalPath || ""}`, {
              signal: AbortSignal.timeout(this.FETCH_TIMEOUT),
            })
              .then((r) => r.json())
              .catch(() => ({})),
          ]);

          const normalized = this.normalizeFallbackData(profile, submissions);
          const validation = this.validateSolvedData(normalized, "FALLBACK");

          if (validation.isValid) {
            console.log(
              `[LeetCodeAPI] [FALLBACK SUCCESS] ${username}: ${validation.total} solved.`,
            );
            this.stats.fallbackSuccess++;
            this.backoffMultiplier = Math.max(1, this.backoffMultiplier - 0.5);

            normalized.totalSolved = validation.total;
            normalized.solvedProblem = validation.total;

            this.cache.set(cacheKey, {
              data: normalized,
              timestamp: Date.now(),
            });
            return normalized;
          } else {
            throw new Error("Fallback data also invalid");
          }
        }

        const response = await fetch(
          `${API_BASE_EXTERNAL}/${username}${externalPath || ""}`,
          { signal: AbortSignal.timeout(this.FETCH_TIMEOUT) },
        );

        if (!response.ok) {
          if (response.status === 429) {
            console.warn(`[LeetCodeAPI] [429 ERROR] Rate limited!`);
            this.backoffMultiplier = Math.min(this.backoffMultiplier * 2, 10); // Cap at 10x
            // Pause queue for a recovery period
            await new Promise((r) => setTimeout(r, 10000));
          }
          throw new Error(`External API status: ${response.status}`);
        }

        const data = await response.json();

        this.stats.fallbackSuccess++;
        // Success: Reset backoff slightly (slow recovery)
        this.backoffMultiplier = Math.max(1, this.backoffMultiplier - 0.5);
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } catch (e) {
        this.stats.fallbackFailure++;
        if (e.name === "AbortError") {
          console.error(
            `[LeetCodeAPI] Request timed out after ${this.FETCH_TIMEOUT}ms. External API might be sleeping.`,
          );
        } else {
          console.error(`Both LeetCode sources failed for ${type}:`, e.message);
        }
        throw e;
      }
    });

    // Update the queue tail and return the current request's promise
    this.requestQueue = currentRequest.catch(() => {});
    return currentRequest;
  }

  /**
   * Monitoring: Get current health stats
   */
  static getStats() {
    return { ...this.stats, backoff: this.backoffMultiplier };
  }

  /**
   * Get all essential stats in one call (profile, solved, calendar, submissions)
   */
  static async getCombinedStats(username, limit = 100) {
    return this.fetchWithFallback(
      username,
      "combined",
      `/submission?limit=${limit}`,
    );
  }

  /**
   * Get user profile summary
   */
  static async getUserProfile(username) {
    return this.fetchWithFallback(username, "profile");
  }

  /**
   * Get solved problems breakdown (Easy, Medium, Hard)
   */
  static async getSolved(username) {
    return this.fetchWithFallback(username, "solved", "/solved");
  }

  /**
   * Get submission calendar for streak calculation
   */
  static async getCalendar(username) {
    return this.fetchWithFallback(username, "calendar", "/calendar");
  }

  /**
   * Get skill stats (Tags like Arrays, DP, etc.)
   */
  static async getSkillStats(username) {
    return this.fetchWithFallback(username, "profile", "/skill");
  }

  /**
   * Get language stats
   */
  static async getLanguageStats(username) {
    return this.fetchWithFallback(username, "profile", "/language");
  }

  /**
   * Get recent submissions
   */
  static async getSubmissions(username, limit = 20) {
    return this.fetchWithFallback(
      username,
      "submissions",
      `/submission?limit=${limit}`,
    );
  }
}
