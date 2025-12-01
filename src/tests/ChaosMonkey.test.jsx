import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ContestArena from '../pages/ContestArena';
import App from '../App';
import * as AuthContext from '../context/AuthContext';

// Mock Firebase
vi.mock('../firebase', () => ({
    db: {},
    auth: {}
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    getDoc: vi.fn(),
    collection: vi.fn(),
    addDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
    setDoc: vi.fn()
}));

// Mock Canvas Confetti
vi.mock('canvas-confetti', () => ({
    default: vi.fn()
}));

describe('Chaos Monkey Test Suite', () => {

    // --- Test Suite 1: Contest Integrity (The Anti-Cheat) ---
    describe('Contest Integrity', () => {
        it('should reject a submission with a timestamp older than contest start', async () => {
            // Mock Auth
            vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
                userData: { leetcodeUsername: 'cheater123' },
                currentUser: { uid: '123' }
            });

            // Mock Contest Data
            const mockContest = {
                id: 'contest_1',
                title: 'Chaos Contest',
                startTime: new Date('2025-01-01T10:00:00Z').toISOString(),
                endTime: new Date('2025-01-01T12:00:00Z').toISOString(),
                problems: [{ slug: 'two-sum', score: 10 }]
            };

            // Mock Firestore getDoc for contest
            const { getDoc } = await import('firebase/firestore');
            getDoc.mockResolvedValue({
                exists: () => true,
                id: 'contest_1',
                data: () => mockContest
            });

            // Mock API Response (Old Submission)
            global.fetch = vi.fn(() => Promise.resolve({
                json: () => Promise.resolve({
                    submission: [{
                        titleSlug: 'two-sum',
                        timestamp: '1600000000' // Year 2020 (Old)
                    }]
                })
            }));

            // Mock Alert
            window.alert = vi.fn();

            render(
                <MemoryRouter initialEntries={['/contests/contest_1']}>
                    <Routes>
                        <Route path="/contests/:contestId" element={<ContestArena />} />
                    </Routes>
                </MemoryRouter>
            );

            // Wait for contest to load
            await waitFor(() => screen.getByText('Chaos Contest'));

            // Click Verify
            const verifyBtn = screen.getByText('Verify');
            fireEvent.click(verifyBtn);

            // Expect Alert for Rejection
            await waitFor(() => {
                expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('No valid submission found'));
            });
        });
    });

    // --- Test Suite 2: RBAC & Route Protection ---
    describe('RBAC & Route Protection', () => {
        it('should redirect a student trying to access supervisor dashboard', async () => {
            // Mock Auth as Student
            vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
                currentUser: { uid: 'student1' },
                userData: { role: 'student' },
                loading: false
            });

            render(
                <MemoryRouter initialEntries={['/supervisor']}>
                    <App />
                </MemoryRouter>
            );

            // Expect redirection to Home (ProblemList) or at least NOT Supervisor Dashboard
            await waitFor(() => {
                const dashboardTitle = screen.queryByText('Supervisor Dashboard');
                expect(dashboardTitle).not.toBeInTheDocument();
            });
        });
    });

    // --- Test Suite 3: Data Fetching Resilience ---
    describe('Data Fetching Resilience', () => {
        it('should handle API failure gracefully without crashing', async () => {
            // Mock Auth
            vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
                userData: { leetcodeUsername: 'victim' },
                currentUser: { uid: '456' }
            });

            // Mock Contest Data
            const mockContest = {
                id: 'contest_2',
                title: 'Resilience Test',
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 3600000).toISOString(),
                problems: [{ slug: 'hard-problem', score: 50 }]
            };

            const { getDoc } = await import('firebase/firestore');
            getDoc.mockResolvedValue({
                exists: () => true,
                id: 'contest_2',
                data: () => mockContest
            });

            // Mock API Failure (500)
            global.fetch = vi.fn(() => Promise.reject(new Error('API Down')));
            window.alert = vi.fn();
            console.error = vi.fn(); // Suppress console error

            render(
                <MemoryRouter initialEntries={['/contests/contest_2']}>
                    <Routes>
                        <Route path="/contests/:contestId" element={<ContestArena />} />
                    </Routes>
                </MemoryRouter>
            );

            await waitFor(() => screen.getByText('Resilience Test'));

            const verifyBtn = screen.getByText('Verify');
            fireEvent.click(verifyBtn);

            // Expect Alert for Failure (Graceful handling)
            await waitFor(() => {
                expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Verification failed'));
            });

            // Ensure app didn't crash (Verify button still exists)
            expect(screen.getByText('Verify')).toBeInTheDocument();
        });
    });
});
