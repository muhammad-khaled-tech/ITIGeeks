import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import { FaSpinner } from 'react-icons/fa';

/**
 * AdminLayout - Wrapper layout for all admin pages
 * Uses AdminAuthContext for authentication (separate from student auth)
 */
const AdminLayout = () => {
    const { adminUser, loading } = useAdminAuth();

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-leet-bg">
                <FaSpinner className="animate-spin text-4xl text-brand" />
            </div>
        );
    }

    // Redirect to admin login if not authenticated
    if (!adminUser) {
        return <Navigate to="/admin/login" replace />;
    }

    return (
        <div className="flex min-h-screen bg-leet-bg">
            {/* Dark Sidebar */}
            <AdminSidebar />
            
            {/* Content Area */}
            <div className="flex-1 flex flex-col">
                <AdminHeader isDark={true} />
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet context={{ isDark: true, adminUser }} />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;

