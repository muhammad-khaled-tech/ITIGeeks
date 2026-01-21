import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import { FaSpinner } from 'react-icons/fa';

/**
 * AdminLayout - Wrapper layout for all admin pages
 * Provides sidebar navigation and content area with dark mode support
 */
const AdminLayout = () => {
    const { currentUser, isAdmin, loading, userData } = useAuth();
    const isDark = userData?.darkMode ?? true;

    // Show loading while checking auth
    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-leet-bg' : 'bg-gray-100'}`}>
                <FaSpinner className="animate-spin text-4xl text-brand" />
            </div>
        );
    }

    // Redirect if not authenticated
    if (!currentUser) {
        return <Navigate to="/" replace />;
    }

    // Redirect if not admin/supervisor
    if (!isAdmin) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-leet-bg' : 'bg-gray-100'}`}>
                <div className={`p-8 rounded-lg shadow-lg text-center max-w-md ${isDark ? 'bg-leet-card text-leet-text' : 'bg-white'}`}>
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🚫</span>
                    </div>
                    <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>Access Denied</h1>
                    <p className={`mb-6 ${isDark ? 'text-leet-sub' : 'text-gray-600'}`}>
                        You don't have permission to access the admin portal.
                    </p>
                    <a 
                        href="/"
                        className="inline-block bg-brand hover:bg-brand-hover text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Go to Home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex min-h-screen ${isDark ? 'bg-leet-bg' : 'bg-gray-100'}`}>
            {/* Dark Sidebar */}
            <AdminSidebar />
            
            {/* Content Area - respects dark mode */}
            <div className="flex-1 flex flex-col">
                <AdminHeader isDark={isDark} />
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet context={{ isDark }} />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
