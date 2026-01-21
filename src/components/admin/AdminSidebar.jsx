import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FaChartPie,
    FaUsers,
    FaLayerGroup,
    FaUsersCog,
    FaTrophy,
    FaTasks,
    FaChartLine,
    FaCog,
    FaSignOutAlt,
    FaCode
} from 'react-icons/fa';

const navItems = [
    { path: '/admin', icon: FaChartPie, label: 'Dashboard', exact: true },
    { path: '/admin/students', icon: FaUsers, label: 'Students' },
    { path: '/admin/tracks', icon: FaLayerGroup, label: 'Tracks' },
    { path: '/admin/groups', icon: FaUsersCog, label: 'Groups' },
    { path: '/admin/contests', icon: FaTrophy, label: 'Contests' },
    { path: '/admin/assignments', icon: FaTasks, label: 'Assignments' },
    { path: '/admin/analytics', icon: FaChartLine, label: 'Analytics' },
    { path: '/admin/settings', icon: FaCog, label: 'Settings' },
];

const AdminSidebar = () => {
    const { logout, currentUser } = useAuth();
    const location = useLocation();

    const isActive = (path, exact = false) => {
        if (exact) {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <aside className="w-64 bg-gray-900 min-h-screen flex flex-col">
            {/* Logo / Brand */}
            <div className="p-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <FaCode className="text-brand text-2xl" />
                    <div>
                        <h1 className="text-white font-bold text-lg">ITIGeeks</h1>
                        <span className="text-xs text-gray-500">Admin Portal</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path, item.exact);
                    
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                                transition-all duration-200
                                ${active 
                                    ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }
                            `}
                        >
                            <Icon className={active ? 'text-white' : 'text-gray-500'} />
                            {item.label}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3 mb-4 px-2">
                    {currentUser?.photoURL && (
                        <img 
                            src={currentUser.photoURL} 
                            alt="Profile" 
                            className="w-10 h-10 rounded-full"
                        />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {currentUser?.displayName || 'Admin'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {currentUser?.email}
                        </p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <FaSignOutAlt />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
