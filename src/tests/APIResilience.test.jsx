/**
 * Test Suite 3: Data Fetching Resilience
 * 
 * Tests to validate that the application handles API failures gracefully:
 * 1. Shows skeleton loader while fetching data
 * 2. Displays user-friendly error state on failure
 * 3. Handles malformed JSON responses
 * 4. Prevents white screen of death
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React, { useState, useEffect } from 'react';

// Mock fetch globally
global.fetch = vi.fn();

describe('Data Fetching Resilience', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * TEST 1: Show Skeleton Loader While Fetching
     * 
     * Scenario: Component mounts and starts fetching data from LeetCode API.
     * During the loading phase, user should see skeleton loaders.
     * 
     * Expected Result:
     * - Skeleton loader is visible initially
     * - After data loads, skeleton is replaced with actual content
     */
    it('should display SKELETON LOADER during initial data fetch', async () => {
        // Component that fetches user stats
        const UserStatsComponent = () => {
            const [loading, setLoading] = useState(true);
            const [stats, setStats] = useState(null);
            const [error, setError] = useState(null);

            useEffect(() => {
                const fetchStats = async () => {
                    try {
                        const res = await fetch('https://alfa-leetcode-api.onrender.com/userProfile');
                        const data = await res.json();
                        setStats(data);
                    } catch (e) {
                        setError(e.message);
                    } finally {
                        setLoading(false);
                    }
                };
                fetchStats();
            }, []);

            if (loading) {
                return <div data-testid="skeleton-loader">Loading...</div>;
            }

            if (error) {
                return <div data-testid="error-state">Error: {error}</div>;
            }

            return <div data-testid="stats-content">Total Solved: {stats.totalSolved}</div>;
        };

        // Mock successful API response (delayed)
        global.fetch.mockImplementationOnce(() =>
            new Promise((resolve) =>
                setTimeout(
                    () =>
                        resolve({
                            ok: true,
                            json: async () => ({ totalSolved: 42 }),
                        }),
                    100
                )
            )
        );

        render(<UserStatsComponent />);

        // Initially should show skeleton
        expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
        expect(screen.queryByTestId('stats-content')).not.toBeInTheDocument();

        // After loading, should show content
        await waitFor(
            () => {
                expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument();
                expect(screen.getByTestId('stats-content')).toBeInTheDocument();
                expect(screen.getByText('Total Solved: 42')).toBeInTheDocument();
            },
            { timeout: 2000 }
        );
    });

    /**
     * TEST 2: Display Error State on API Failure
     * 
     * Scenario: LeetCode API returns 500 Internal Server Error.
     * 
     * Expected Result:
     * - Error message is displayed
     * - NO white screen of death
     * - User can retry or see helpful message
     */
    it('should display ERROR STATE when API returns error status', async () => {
        const ProblemListComponent = () => {
            const [loading, setLoading] = useState(true);
            const [problems, setProblems] = useState([]);
            const [error, setError] = useState(null);

            useEffect(() => {
                const fetchProblems = async () => {
                    try {
                        const res = await fetch('https://alfa-leetcode-api.onrender.com/problems');

                        if (!res.ok) {
                            throw new Error(`API Error: ${res.status} ${res.statusText}`);
                        }

                        const data = await res.json();
                        setProblems(data);
                    } catch (e) {
                        setError(e.message);
                    } finally {
                        setLoading(false);
                    }
                };
                fetchProblems();
            }, []);

            if (loading) {
                return <div data-testid="loading">Loading problems...</div>;
            }

            if (error) {
                return (
                    <div data-testid="error-state" className="error-container">
                        <h2>Oops! Something went wrong</h2>
                        <p>{error}</p>
                        <button data-testid="retry-button">Retry</button>
                    </div>
                );
            }

            return (
                <div data-testid="problems-list">
                    {problems.map((p) => (
                        <div key={p.id}>{p.title}</div>
                    ))}
                </div>
            );
        };

        // Mock API error response
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: async () => ({ error: 'Database connection failed' }),
        });

        render(<ProblemListComponent />);

        // Should show loading initially
        expect(screen.getByTestId('loading')).toBeInTheDocument();

        // After error, should show error state
        await waitFor(() => {
            expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
            expect(screen.getByTestId('error-state')).toBeInTheDocument();
            expect(screen.getByText(/API Error: 500/)).toBeInTheDocument();
            expect(screen.getByTestId('retry-button')).toBeInTheDocument(); // ✅ User can retry
        });
    });

    /**
     * TEST 3: Handle Malformed JSON Gracefully
     * 
     * Scenario: API returns HTML error page instead of JSON (common when proxy fails).
     * 
     * Expected Result:
     * - App DOES NOT crash
     * - Shows error message "Invalid response format"
     * - Logs error for debugging
     */
    it('should handle MALFORMED JSON without crashing', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const ContestDataComponent = () => {
            const [loading, setLoading] = useState(true);
            const [contest, setContest] = useState(null);
            const [error, setError] = useState(null);

            useEffect(() => {
                const fetchContest = async () => {
                    try {
                        const res = await fetch('https://alfa-leetcode-api.onrender.com/contests/weekly-1');

                        // Check content type
                        const contentType = res.headers.get('content-type');
                        if (!contentType || !contentType.includes('application/json')) {
                            throw new Error('Invalid response format: Expected JSON');
                        }

                        const data = await res.json();
                        setContest(data);
                    } catch (e) {
                        console.error('Contest fetch error:', e);
                        setError(e.message);
                    } finally {
                        setLoading(false);
                    }
                };
                fetchContest();
            }, []);

            if (loading) return <div data-testid="loading">Loading...</div>;
            if (error) return <div data-testid="error-state">{error}</div>;
            return <div data-testid="contest-data">{contest.title}</div>;
        };

        // Mock response with HTML instead of JSON
        global.fetch.mockResolvedValueOnce({
            ok: true,
            headers: {
                get: (header) => (header === 'content-type' ? 'text/html' : null),
            },
            json: async () => {
                throw new Error('Unexpected token < in JSON at position 0');
            },
        });

        render(<ContestDataComponent />);

        await waitFor(() => {
            expect(screen.getByTestId('error-state')).toBeInTheDocument();
            expect(screen.getByText(/Invalid response format/)).toBeInTheDocument();
            expect(consoleSpy).toHaveBeenCalledWith('Contest fetch error:', expect.any(Error));
        });

        // ✅ App is still functional, no white screen
        expect(document.querySelector('[data-testid="contest-data"]')).not.toBeInTheDocument();
    });

    /**
     * TEST 4: Network Error (Offline) Handling
     * 
     * Scenario: User is offline OR API is completely unreachable.
     * 
     * Expected Result:
     * - Shows "Network error" message
     * - Offers option to retry or use cached data (PWA)
     */
    it('should handle NETWORK ERRORS (offline scenario)', async () => {
        const LeaderboardComponent = () => {
            const [loading, setLoading] = useState(true);
            const [leaderboard, setLeaderboard] = useState([]);
            const [error, setError] = useState(null);

            useEffect(() => {
                const fetchLeaderboard = async () => {
                    try {
                        const res = await fetch('https://alfa-leetcode-api.onrender.com/leaderboard');

                        if (!res.ok) {
                            throw new Error('Network error: Failed to fetch');
                        }

                        const data = await res.json();
                        setLeaderboard(data);
                    } catch (e) {
                        // Network error or fetch failed
                        if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
                            setError('Network error: Please check your internet connection');
                        } else {
                            setError(e.message);
                        }
                    } finally {
                        setLoading(false);
                    }
                };
                fetchLeaderboard();
            }, []);

            if (loading) return <div data-testid="loading">Loading...</div>;

            if (error) {
                return (
                    <div data-testid="error-state">
                        <p>{error}</p>
                        <button data-testid="retry-button">Retry</button>
                    </div>
                );
            }

            return (
                <div data-testid="leaderboard">
                    {leaderboard.map((user) => (
                        <div key={user.id}>{user.name}</div>
                    ))}
                </div>
            );
        };

        // Mock network failure
        global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        render(<LeaderboardComponent />);

        await waitFor(() => {
            expect(screen.getByTestId('error-state')).toBeInTheDocument();
            expect(screen.getByText(/Network error/)).toBeInTheDocument();
            expect(screen.getByText(/check your internet connection/)).toBeInTheDocument();
            expect(screen.getByTestId('retry-button')).toBeInTheDocument();
        });
    });

    /**
     * TEST 5: Empty API Response Handling
     * 
     * Scenario: API returns success but with empty array (no data).
     * 
     * Expected Result:
     * - Shows "No data available" message
     * - Does NOT show error state
     * - Provides helpful message to user
     */
    it('should handle EMPTY API RESPONSES gracefully', async () => {
        const AssignmentsComponent = () => {
            const [loading, setLoading] = useState(true);
            const [assignments, setAssignments] = useState([]);
            const [error, setError] = useState(null);

            useEffect(() => {
                const fetchAssignments = async () => {
                    try {
                        const res = await fetch('https://api.example.com/assignments');

                        if (!res.ok) {
                            throw new Error('Failed to load assignments');
                        }

                        const data = await res.json();
                        setAssignments(data || []);
                    } catch (e) {
                        setError(e.message);
                    } finally {
                        setLoading(false);
                    }
                };
                fetchAssignments();
            }, []);

            if (loading) return <div data-testid="loading">Loading...</div>;
            if (error) return <div data-testid="error-state">{error}</div>;

            if (assignments.length === 0) {
                return (
                    <div data-testid="empty-state">
                        <p>No assignments available yet.</p>
                        <p>Check back later!</p>
                    </div>
                );
            }

            return (
                <div data-testid="assignments-list">
                    {assignments.map((a) => (
                        <div key={a.id}>{a.title}</div>
                    ))}
                </div>
            );
        };

        // Mock successful but empty response
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        render(<AssignmentsComponent />);

        await waitFor(() => {
            expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
            expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
            expect(screen.getByTestId('empty-state')).toBeInTheDocument();
            expect(screen.getByText(/No assignments available/)).toBeInTheDocument();
        });
    });

    /**
     * TEST 6: Concurrent API Calls Don't Cause Race Conditions
     * 
     * Scenario: User rapidly switches between tabs, triggering multiple API calls.
     * 
     * Expected Result:
     * - Only the latest request's data is displayed
     * - Old requests are ignored if they complete after newer ones
     */
    it('should handle CONCURRENT API CALLS without race conditions', async () => {
        let requestCounter = 0;

        const UserProfileComponent = ({ userId }) => {
            const [loading, setLoading] = useState(true);
            const [profile, setProfile] = useState(null);

            useEffect(() => {
                let cancelled = false;
                const currentRequest = ++requestCounter;

                const fetchProfile = async () => {
                    setLoading(true);
                    try {
                        const res = await fetch(`https://api.example.com/users/${userId}`);
                        const data = await res.json();

                        // Only update if this request wasn't cancelled
                        if (!cancelled) {
                            setProfile(data);
                        }
                    } catch (e) {
                        if (!cancelled) {
                            setProfile(null);
                        }
                    } finally {
                        if (!cancelled) {
                            setLoading(false);
                        }
                    }
                };

                fetchProfile();

                // Cleanup function
                return () => {
                    cancelled = true;
                };
            }, [userId]);

            if (loading) return <div data-testid="loading">Loading...</div>;
            return <div data-testid="profile">User: {profile?.name}</div>;
        };

        // Mock slower first request, faster second request
        global.fetch
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) =>
                        setTimeout(
                            () =>
                                resolve({
                                    ok: true,
                                    json: async () => ({ id: 1, name: 'User 1' }),
                                }),
                            200
                        )
                    )
            )
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) =>
                        setTimeout(
                            () =>
                                resolve({
                                    ok: true,
                                    json: async () => ({ id: 2, name: 'User 2' }),
                                }),
                            50
                        )
                    )
            );

        const { rerender } = render(<UserProfileComponent userId={1} />);

        // Immediately change user (second request)
        rerender(<UserProfileComponent userId={2} />);

        await waitFor(() => {
            // Should show User 2 (latest request), NOT User 1
            expect(screen.getByTestId('profile')).toBeInTheDocument();
            expect(screen.getByText('User: User 2')).toBeInTheDocument();
        });
    });
});
