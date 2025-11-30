import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import { FaSpinner } from 'react-icons/fa';
import ErrorBoundary from './components/ErrorBoundary';
import CommandPalette from './components/CommandPalette';
import OnboardingTour from './components/OnboardingTour';
import Breadcrumbs from './components/Breadcrumbs';
import FileImporter from './components/FileImporter';
import NotFound from './pages/NotFound';

// Lazy Load Pages
const ProblemList = lazy(() => import('./components/ProblemList'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SupervisorDashboard = lazy(() => import('./pages/SupervisorDashboard'));
const ContestLobby = lazy(() => import('./pages/ContestLobby'));
const ContestManager = lazy(() => import('./pages/ContestManager'));
const ContestArena = lazy(() => import('./pages/ContestArena'));
const AssignmentManager = lazy(() => import('./pages/AssignmentManager'));
const MyAssignments = lazy(() => import('./pages/MyAssignments'));
const AssignmentDetail = lazy(() => import('./pages/MyAssignments').then(module => ({ default: module.AssignmentDetail })));

const ProtectedRoute = ({ children, requireAdmin }) => {
    const { currentUser, userData, loading } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center dark:bg-leet-bg dark:text-white"><FaSpinner className="animate-spin text-4xl" /></div>;

    if (!currentUser) {
        return <Navigate to="/" />;
    }

    if (requireAdmin && userData?.role !== 'admin' && userData?.role !== 'head_leader' && userData?.role !== 'supervisor') {
        return <Navigate to="/" />;
    }

    return children;
};

const LoadingFallback = () => (
    <div className="h-full w-full flex items-center justify-center min-h-[50vh] text-gray-500 dark:text-gray-400">
        <FaSpinner className="animate-spin text-3xl" />
    </div>
);

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router>
                    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-leet-bg text-gray-900 dark:text-leet-text transition-colors duration-300">
                        <Navbar />
                        <CommandPalette />
                        <OnboardingTour />
                        <FileImporter />

                        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                            <Breadcrumbs />
                            <Suspense fallback={<LoadingFallback />}>
                                <Routes>
                                    <Route path="/" element={<ProblemList />} />
                                    <Route path="/profile" element={
                                        <ProtectedRoute>
                                            <Profile />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/admin" element={
                                        <ProtectedRoute requireAdmin={true}>
                                            <AdminDashboard />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/supervisor" element={
                                        <ProtectedRoute>
                                            <SupervisorDashboard />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/assignments" element={
                                        <ProtectedRoute>
                                            <MyAssignments />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/assignments/manage" element={
                                        <ProtectedRoute>
                                            <AssignmentManager />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/assignments/:assignmentId" element={
                                        <ProtectedRoute>
                                            <AssignmentDetail />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/contests" element={
                                        <ProtectedRoute>
                                            <ContestLobby />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/contests/create" element={
                                        <ProtectedRoute requireAdmin={true}>
                                            <ContestManager />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/contests/:contestId" element={
                                        <ProtectedRoute>
                                            <ContestArena />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="*" element={<NotFound />} />
                                </Routes>
                            </Suspense>
                        </main>

                        <footer className="bg-white dark:bg-leet-card border-t dark:border-leet-border mt-auto">
                            <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
                                <p className="mt-8 text-center text-base text-gray-400">
                                    &copy; 2024 ITIGeeks. All rights reserved.
                                </p>
                            </div>
                        </footer>
                    </div>
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
