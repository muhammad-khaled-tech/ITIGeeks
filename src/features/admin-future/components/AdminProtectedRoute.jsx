import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { FaSpinner } from 'react-icons/fa';

/**
 * Protected route wrapper for admin pages
 * Checks if user is authenticated and has required role
 */
const AdminProtectedRoute = ({ requiredRole = null, children }) => {
  const { adminUser, loading, isSuperAdmin, isTrackLeader, isSupervisor, isInstructor } = useAdminAuth();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!adminUser) {
    return <Navigate to="/admin-login" replace />;
  }

  // Check role-based access if required
  if (requiredRole) {
    let hasAccess = false;
    
    switch (requiredRole) {
      case 'super_admin':
        hasAccess = isSuperAdmin();
        break;
      case 'track_leader':
        hasAccess = isTrackLeader();
        break;
      case 'supervisor':
        hasAccess = isSupervisor();
        break;
      case 'instructor':
        hasAccess = isInstructor();
        break;
      default:
        hasAccess = true;
    }

    if (!hasAccess) {
      // Redirect to appropriate dashboard based on user's actual role
      return <Navigate to={`/admin/${adminUser.role.replace('_', '-')}`} replace />;
    }
  }

  // Render children or outlet
  return children ? children : <Outlet />;
};

/**
 * HOC to create role-specific protected routes
 */
export const withAdminAuth = (Component, requiredRole = null) => {
  return function ProtectedComponent(props) {
    return (
      <AdminProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </AdminProtectedRoute>
    );
  };
};

export default AdminProtectedRoute;
