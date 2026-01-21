import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FaChevronRight, FaBell, FaSearch, FaSun, FaMoon } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const AdminHeader = ({ isDark }) => {
    const location = useLocation();
    const { userData, updateUserData } = useAuth();
    
    // Generate breadcrumbs from path
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/');
        const label = segment.charAt(0).toUpperCase() + segment.slice(1);
        return { path, label };
    });

    const toggleTheme = () => {
        updateUserData({ ...userData, darkMode: !userData?.darkMode });
    };

    return (
        <header className={`border-b px-6 py-4 ${isDark ? 'bg-leet-card border-leet-border' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
                {/* Breadcrumbs */}
                <nav className="flex items-center space-x-2 text-sm">
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={crumb.path}>
                            {index > 0 && (
                                <FaChevronRight className={`text-xs ${isDark ? 'text-leet-sub' : 'text-gray-400'}`} />
                            )}
                            {index === breadcrumbs.length - 1 ? (
                                <span className={`font-medium ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                    {crumb.label}
                                </span>
                            ) : (
                                <Link 
                                    to={crumb.path}
                                    className={`hover:text-brand transition-colors ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}
                                >
                                    {crumb.label}
                                </Link>
                            )}
                        </React.Fragment>
                    ))}
                </nav>

                {/* Right side actions */}
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative">
                        <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-leet-sub' : 'text-gray-400'}`} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className={`pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all w-64 ${
                                isDark 
                                    ? 'bg-leet-input text-leet-text placeholder-leet-sub border border-leet-border' 
                                    : 'bg-gray-100 focus:bg-white'
                            }`}
                        />
                    </div>

                    {/* Theme Toggle */}
                    <button 
                        onClick={toggleTheme}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-leet-input text-leet-sub' : 'hover:bg-gray-100 text-gray-500'}`}
                    >
                        {isDark ? <FaSun className="text-yellow-400" /> : <FaMoon />}
                    </button>

                    {/* Notifications */}
                    <button className={`relative p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-leet-input text-leet-sub' : 'hover:bg-gray-100 text-gray-500'}`}>
                        <FaBell />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* Back to Student Portal */}
                    <Link
                        to="/"
                        className={`text-sm hover:text-brand transition-colors ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}
                    >
                        ← Student Portal
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;

