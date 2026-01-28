import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FaChevronRight, FaBell, FaSearch, FaSun, FaMoon, FaTimes, FaCheck, FaExclamationTriangle, FaUserPlus } from 'react-icons/fa';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminHeader = ({ isDark = true }) => {
    const location = useLocation();
    const { adminUser } = useAdminAuth() || {};
    const [showNotifications, setShowNotifications] = useState(false);
    
    // Sample notifications (in real app, fetch from Firestore)
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'info', message: 'Welcome to admin panel!', time: '1m ago', read: false },
        { id: 2, type: 'warning', message: 'Contest "Week 1" has ended', time: '2h ago', read: false },
        { id: 3, type: 'success', message: '5 new students joined today', time: '5h ago', read: true },
    ]);
    
    // Generate breadcrumbs from path
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/');
        const label = segment.charAt(0).toUpperCase() + segment.slice(1);
        return { path, label };
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'warning': return <FaExclamationTriangle className="text-yellow-500" />;
            case 'success': return <FaCheck className="text-green-500" />;
            case 'user': return <FaUserPlus className="text-blue-500" />;
            default: return <FaBell className="text-brand" />;
        }
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

                    {/* Theme Toggle - disabled in admin since always dark */}
                    <button 
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-leet-input text-leet-sub' : 'hover:bg-gray-100 text-gray-500'}`}
                        title="Admin panel is always dark"
                    >
                        <FaSun className="text-yellow-400" />
                    </button>

                    {/* Notifications */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`relative p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-leet-input text-leet-sub' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <FaBell />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <>
                                {/* Backdrop */}
                                <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setShowNotifications(false)}
                                />
                                
                                <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-2xl z-50 border overflow-hidden ${
                                    isDark ? 'bg-leet-card border-leet-border' : 'bg-white border-gray-200'
                                }`}>
                                    {/* Header */}
                                    <div className={`flex items-center justify-between px-4 py-3 border-b ${
                                        isDark ? 'border-leet-border' : 'border-gray-200'
                                    }`}>
                                        <h3 className={`font-bold ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                            Notifications
                                        </h3>
                                        {unreadCount > 0 && (
                                            <button 
                                                onClick={markAllAsRead}
                                                className="text-xs text-brand hover:underline"
                                            >
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>

                                    {/* Notification List */}
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className={`px-4 py-8 text-center ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                                                No notifications
                                            </div>
                                        ) : (
                                            notifications.map(notification => (
                                                <div 
                                                    key={notification.id}
                                                    onClick={() => markAsRead(notification.id)}
                                                    className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors ${
                                                        !notification.read 
                                                            ? (isDark ? 'bg-brand/5' : 'bg-blue-50')
                                                            : ''
                                                    } ${isDark ? 'hover:bg-leet-input' : 'hover:bg-gray-50'}`}
                                                >
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm ${isDark ? 'text-leet-text' : 'text-gray-900'}`}>
                                                            {notification.message}
                                                        </p>
                                                        <p className={`text-xs mt-1 ${isDark ? 'text-leet-sub' : 'text-gray-500'}`}>
                                                            {notification.time}
                                                        </p>
                                                    </div>
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 bg-brand rounded-full flex-shrink-0 mt-1.5" />
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

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
