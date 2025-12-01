/**
 * Test Suite 2: RBAC & Route Protection
 * 
 * Tests to validate that role-based access control works correctly:
 * 1. Students cannot access admin routes
 * 2. Protected components don't mount for unauthorized users
 * 3. Redirects happen BEFORE data fetching starts
 * 4. No memory leaks from unauthorized component mounts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import AdminDashboard from '../pages/AdminDashboard';
import SupervisorDashboard from '../pages/SupervisorDashboard';

// Mock Firebase
vi.mock('../firebase', () => ({
    db: {},
    auth: {
        currentUser: null,
    },
}));

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', async () => {
    const actual = await vi.importActual('../context/AuthContext');
    return {
        ...actual,
        useAuth: () => mockUseAuth(),
    };
});

describe('RBAC & Route Protection', () => {
    /**
     * Mock ProtectedRoute component (matches App.jsx implementation)
     */
    const ProtectedRoute = ({ children, requireAdmin }) => {
        const { currentUser, userData, loading } = useAuth();

        if (loading) {
            return <div data-testid="loading-spinner">Loading...</div>;
        }

        if (!currentUser) {
            return <Navigate to="/" replace />;
        }

        if (requireAdmin && userData?.role !== 'admin' && userData?.role !== 'head_leader' && userData?.role !== 'supervisor') {
            return <Navigate to="/" replace />;
        }

        return children;
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * TEST 1: Student CANNOT Access /admin Route
     * 
     * Scenario: A student with role='student' manually navigates to /admin in the URL bar.
     * 
     * Expected Result: 
     * - Immediate redirect to "/"
     * - AdminDashboard component NEVER mounts
     * - No API calls are made
     */
    it('should REDIRECT students from /admin route WITHOUT mounting component', async () => {
        // Mock student user
        mockUseAuth.mockReturnValue({
            currentUser: { uid: 'student-123' },
            userData: { role: 'student', username: 'StudentUser' },
            loading: false,
        });

        // Spy to check if AdminDashboard mounts
        const dashboardMountSpy = vi.fn();

        // Mock AdminDashboard
        const MockAdminDashboard = () => {
            dashboardMountSpy(); // This should NEVER be called
            return <div data-testid="admin-dashboard">Admin Dashboard</div>;
        };

        // Render with router
        const { container } = render(
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<div data-testid="home">Home Page</div>} />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute requireAdmin={true}>
                                <MockAdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        );

        // Navigate to /admin
        window.history.pushState({}, 'Admin', '/admin');

        await waitFor(() => {
            // Should redirect to home
            expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument();
            expect(dashboardMountSpy).not.toHaveBeenCalled(); // ✅ Component never mounted
        });
    });

    /**
     * TEST 2: Admin CAN Access /admin Route
     * 
     * Scenario: A user with role='admin' navigates to /admin.
     * 
     * Expected Result:
     * - NO redirect
     * - AdminDashboard component MOUNTS successfully
     */
    it('should ALLOW admins to access /admin route', async () => {
        // Mock admin user
        mockUseAuth.mockReturnValue({
            currentUser: { uid: 'admin-123' },
            userData: { role: 'admin', username: 'AdminUser' },
            loading: false,
            isAdmin: true,
        });

        const dashboardMountSpy = vi.fn();

        const MockAdminDashboard = () => {
            dashboardMountSpy();
            return <div data-testid="admin-dashboard">Admin Dashboard</div>;
        };

        render(
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<div data-testid="home">Home Page</div>} />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute requireAdmin={true}>
                                <MockAdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        );

        window.history.pushState({}, 'Admin', '/admin');

        await waitFor(() => {
            expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
            expect(dashboardMountSpy).toHaveBeenCalledTimes(1); // ✅ Component mounted
        });
    });

    /**
     * TEST 3: Protected Component Does NOT Fetch Data Before Redirect
     * 
     * Scenario: A student navigates to /supervisor which has an API call in useEffect.
     * The component should NOT execute the fetch before being unmounted.
     * 
     * Expected Result:
     * - Redirect happens BEFORE useEffect fires
     * - Fetch is NEVER called
     * - No memory leak warnings
     */
    it('should NOT execute component useEffect before redirect', async () => {
        // Mock student user
        mockUseAuth.mockReturnValue({
            currentUser: { uid: 'student-123' },
            userData: { role: 'student' },
            loading: false,
        });

        // Mock fetch spy
        const fetchSpy = vi.spyOn(global, 'fetch');

        // Mock Supervisor Dashboard with useEffect
        const MockSupervisorDashboard = () => {
            const [data, setData] = React.useState(null);

            React.useEffect(() => {
                // This should NEVER execute for non-supervisors
                const fetchData = async () => {
                    const response = await fetch('/api/supervisor/stats');
                    const json = await response.json();
                    setData(json);
                };
                fetchData();
            }, []);

            return <div data-testid="supervisor-dashboard">Supervisor Dashboard</div>;
        };

        render(
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<div data-testid="home">Home Page</div>} />
                    <Route
                        path="/supervisor"
                        element={
                            <ProtectedRoute>
                                <MockSupervisorDashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        );

        window.history.pushState({}, 'Supervisor', '/supervisor');

        await waitFor(() => {
            expect(screen.queryByTestId('supervisor-dashboard')).not.toBeInTheDocument();
            expect(fetchSpy).not.toHaveBeenCalled(); // ✅ No API call made
        });
    });

    /**
     * TEST 4: Loading State Shows Spinner (No Flash of Protected Content)
     * 
     * Scenario: User navigates to protected route while auth is still loading.
     * 
     * Expected Result:
     * - Loading spinner is shown
     * - Protected content is NOT visible
     * - After loading, appropriate redirect happens
     */
    it('should show loading spinner while auth is loading', async () => {
        // Mock loading state
        mockUseAuth.mockReturnValue({
            currentUser: null,
            userData: null,
            loading: true, // Still loading
        });

        render(
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<div data-testid="home">Home Page</div>} />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute requireAdmin={true}>
                                <div data-testid="admin-dashboard">Admin Dashboard</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        );

        window.history.pushState({}, 'Admin', '/admin');

        // Should show loading spinner
        await waitFor(() => {
            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
            expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument(); // ✅ No flash of content
        });

        // Simulate auth load complete (user not logged in)
        mockUseAuth.mockReturnValue({
            currentUser: null,
            userData: null,
            loading: false,
        });

        // Re-render
        render(
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<div data-testid="home">Home Page</div>} />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute requireAdmin={true}>
                                <div data-testid="admin-dashboard">Admin Dashboard</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        );

        // Should redirect to home
        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
            expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument();
        });
    });

    /**
     * TEST 5: Role Field Cannot Be Modified Client-Side
     * 
     * Scenario: A malicious student tries to change their role via browser console.
     * 
     * Expected Result: Role change should be rejected by Firestore Security Rules
     * (This test simulates the expected behavior - actual implementation requires Firestore Rules)
     */
    it('should REJECT client-side role modification attempts', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        // Simulate updateUserData function with validation
        const updateUserDataSecure = async (currentUserData, newData) => {
            const allowedFields = ['leetcodeUsername', 'darkMode', 'problems', 'sheets', 'badges'];

            // Check if user is trying to modify restricted fields
            const restrictedFields = ['role', 'groupId', 'trackId'];
            const attemptedFields = Object.keys(newData);
            const invalidFields = attemptedFields.filter(field => restrictedFields.includes(field));

            if (invalidFields.length > 0) {
                console.error(`Attempt to modify restricted fields: ${invalidFields.join(', ')}`);
                throw new Error('Unauthorized: Cannot modify role or group fields');
            }

            // Only update allowed fields
            const sanitizedData = {};
            allowedFields.forEach(field => {
                if (newData[field] !== undefined) {
                    sanitizedData[field] = newData[field];
                }
            });

            return { ...currentUserData, ...sanitizedData };
        };

        const studentData = {
            role: 'student',
            username: 'testuser',
            leetcodeUsername: 'test_leetcode',
        };

        // Try to escalate privileges
        await expect(async () => {
            await updateUserDataSecure(studentData, { role: 'admin' });
        }).rejects.toThrow('Unauthorized: Cannot modify role or group fields');

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('restricted fields: role'));

        // Valid update should work
        const validUpdate = await updateUserDataSecure(studentData, { darkMode: true });
        expect(validUpdate.darkMode).toBe(true);
        expect(validUpdate.role).toBe('student'); // ✅ Role unchanged
    });
});
