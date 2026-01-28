import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import { FaSpinner } from 'react-icons/fa';
import ErrorBoundary from './components/ErrorBoundary';
import CommandPalette from './components/CommandPalette';
import OnboardingTour from './components/OnboardingTour';
import OnboardingWizard from './components/OnboardingWizard';
import Breadcrumbs from './components/Breadcrumbs';
import GlobalFileImporter from './components/GlobalFileImporter';
import NotFound from './pages/NotFound';

// Lazy Load Student Pages
const ProblemList = lazy(() => import('./components/ProblemList'));
const Profile = lazy(() => import('./pages/Profile'));
const AssignmentManager = lazy(() => import('./pages/AssignmentManager'));
const MyAssignments = lazy(() => import('./pages/MyAssignments'));
const ContestLobby = lazy(() => import('./pages/ContestLobby'));
const ContestArena = lazy(() => import('./pages/ContestArena'));
const SupervisorDashboard = lazy(() => import('./pages/SupervisorDashboard'));
const ContestManager = lazy(() => import('./pages/ContestManager'));
const AssignmentDetail = lazy(() => import('./pages/AssignmentDetail'));
const GroupLeaderboard = lazy(() => import('./pages/GroupLeaderboard'));

// Lazy Load Admin Layout & Pages
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminLogin = lazy(() => import('./features/admin-future/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminStudents = lazy(() => import('./pages/admin/Students'));
const AdminTracks = lazy(() => import('./pages/admin/Tracks'));
const AdminGroups = lazy(() => import('./pages/admin/Groups'));
const AdminContests = lazy(() => import('./pages/admin/Contests'));
const AdminAssignments = lazy(() => import('./pages/admin/Assignments'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

// Admin Auth Provider
import { AdminAuthProvider } from './context/AdminAuthContext';

const ProtectedRoute = ({ children, requireAdmin }) => {
    const { currentUser, loading, isAdmin } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center dark:bg-leet-bg dark:text-white"><FaSpinner className="animate-spin text-4xl" /></div>;

    if (!currentUser) {
        return <Navigate to="/" />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" />;
    }

    return children;
};

const LoadingFallback = () => (
    <div className="h-full w-full flex items-center justify-center min-h-[50vh] text-gray-500 dark:text-gray-400">
        <FaSpinner className="animate-spin text-3xl" />
    </div>
);

// Student Portal Layout
const StudentLayout = ({ children }) => {
    const { userData, updateUserData, currentUser } = useAuth();
    
    // Show onboarding wizard for logged-in users without displayName
    const needsOnboarding = currentUser && userData && !userData.displayName;
    
    const handleOnboardingComplete = async (data) => {
        await updateUserData({
            ...userData,
            displayName: data.displayName,
            leetcodeUsername: data.leetcodeUsername
        });
    };
    
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-leet-bg text-gray-900 dark:text-leet-text transition-colors duration-300">
            <Navbar />
            <CommandPalette />
            <OnboardingTour />
            <GlobalFileImporter />
            <OnboardingWizard 
                isOpen={needsOnboarding} 
                onComplete={handleOnboardingComplete}
            />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Breadcrumbs />
                {children}
            </main>
            <footer className="bg-white dark:bg-leet-card border-t dark:border-leet-border mt-auto">
                <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
                    <p className="mt-8 text-center text-base text-gray-400">
                        Made with love to OSAD 46 by : Mohamed Khaled
                    </p>
                </div>
            </footer>
        </div>
    );
};

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router>
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            {/* Admin Login - Public */}
                            <Route path="/admin/login" element={
                                <AdminAuthProvider>
                                    <AdminLogin />
                                </AdminAuthProvider>
                            } />
                            
                            {/* Admin Portal - Protected by AdminAuthProvider */}
                            <Route path="/admin/*" element={
                                <AdminAuthProvider>
                                    <AdminLayout />
                                </AdminAuthProvider>
                            }>
                                <Route index element={<AdminDashboard />} />
                                <Route path="students" element={<AdminStudents />} />
                                <Route path="tracks" element={<AdminTracks />} />
                                <Route path="groups" element={<AdminGroups />} />
                                <Route path="contests" element={<AdminContests />} />
                                <Route path="assignments" element={<AdminAssignments />} />
                                <Route path="analytics" element={<AdminAnalytics />} />
                                <Route path="settings" element={<AdminSettings />} />
                            </Route>

                            {/* Student Portal - Original Layout */}
                            <Route path="/" element={
                                <StudentLayout>
                                    <ProblemList />
                                </StudentLayout>
                            } />
                            <Route path="/profile" element={
                                <StudentLayout>
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                </StudentLayout>
                            } />
                            <Route path="/supervisor" element={
                                <StudentLayout>
                                    <ProtectedRoute>
                                        <SupervisorDashboard />
                                    </ProtectedRoute>
                                </StudentLayout>
                            } />
                            <Route path="/assignments" element={
                                <StudentLayout>
                                    <ProtectedRoute>
                                        <MyAssignments />
                                    </ProtectedRoute>
                                </StudentLayout>
                            } />
                            <Route path="/assignments/manage" element={
                                <StudentLayout>
                                    <ProtectedRoute>
                                        <AssignmentManager />
                                    </ProtectedRoute>
                                </StudentLayout>
                            } />
                            <Route path="/assignments/:assignmentId" element={
                                <StudentLayout>
                                    <ProtectedRoute>
                                        <AssignmentDetail />
                                    </ProtectedRoute>
                                </StudentLayout>
                            } />
                            <Route path="/contests" element={
                                <StudentLayout>
                                    <ProtectedRoute>
                                        <ContestLobby />
                                    </ProtectedRoute>
                                </StudentLayout>
                            } />
                            <Route path="/contests/create" element={
                                <StudentLayout>
                                    <ProtectedRoute requireAdmin={true}>
                                        <ContestManager />
                                    </ProtectedRoute>
                                </StudentLayout>
                            } />
                            <Route path="/contests/:contestId" element={
                                <StudentLayout>
                                    <ProtectedRoute>
                                        <ContestArena />
                                    </ProtectedRoute>
                                </StudentLayout>
                            } />
                            <Route path="/leaderboard" element={
                                <StudentLayout>
                                    <ProtectedRoute>
                                        <GroupLeaderboard />
                                    </ProtectedRoute>
                                </StudentLayout>
                            } />
                            <Route path="*" element={
                                <StudentLayout>
                                    <NotFound />
                                </StudentLayout>
                            } />
                        </Routes>
                    </Suspense>
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
