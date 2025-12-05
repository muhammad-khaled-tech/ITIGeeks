import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FaCode, FaBars, FaTimes, FaSun, FaMoon, FaGoogle,
    FaHome, FaChartPie, FaTasks, FaTrophy, FaShieldAlt, FaUserCog,
    FaSyncAlt, FaTools, FaCaretDown, FaCog, FaPlus, FaLink, FaCloudUploadAlt, FaBolt, FaKey
} from 'react-icons/fa';
import { useProblemImport } from '../hooks/useProblemImport';
import clsx from 'clsx';

import ManualAddModal from './ManualAddModal';
import DataManagementModal from './DataManagementModal';
import LinkImportModal from './LinkImportModal';
import APIConfigModal from './APIConfigModal';

const Navbar = () => {
    const { currentUser, login, logout, userData, updateUserData, isAdmin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDataModal, setShowDataModal] = useState(false);
    const [showLinkImportModal, setShowLinkImportModal] = useState(false);
    const [showAPIConfigModal, setShowAPIConfigModal] = useState(false);
    const [toolsOpen, setToolsOpen] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { importProblems } = useProblemImport();
    const toolsRef = useRef(null);
    const fileInputRef = useRef(null);
    const mobileFileInputRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (toolsRef.current && !toolsRef.current.contains(event.target)) {
                setToolsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleTheme = () => {
        if (userData) {
            updateUserData({ ...userData, darkMode: !userData.darkMode });
        }
    };

    // Apply theme effect
    React.useEffect(() => {
        if (userData?.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [userData?.darkMode]);

    const handleSync = async () => {
        if (!userData?.leetcodeUsername) {
            alert("Please set your LeetCode username in Profile first.");
            navigate('/profile');
            return;
        }

        setSyncing(true);
        try {
            // Use local Vercel proxy
            const res = await fetch(`/api/stats?username=${userData.leetcodeUsername}`);
            if (!res.ok) throw new Error("Failed to fetch data");
            const responseData = await res.json();

            const stats = responseData?.data?.matchedUser?.submitStats?.acSubmissionNum;
            if (!stats) throw new Error("No stats found");

            const total = stats.find(s => s.difficulty === 'All')?.count || 0;
            const easy = stats.find(s => s.difficulty === 'Easy')?.count || 0;
            const medium = stats.find(s => s.difficulty === 'Medium')?.count || 0;
            const hard = stats.find(s => s.difficulty === 'Hard')?.count || 0;

            // Note: The current proxy only returns counts, not the list of solved problems.
            // So we cannot update individual problem statuses yet.
            // To restore full sync, we would need to update the proxy to fetch the submission list.

            alert(`Sync Successful!\n\nTotal Solved: ${total}\nEasy: ${easy}\nMedium: ${medium}\nHard: ${hard}`);

        } catch (e) {
            console.error("Sync Error:", e);
            alert("Could not sync with LeetCode. Please try again later.");
        } finally {
            setSyncing(false);
        }
    };

    const NavLink = ({ icon: Icon, label, to, onClick, className }) => {
        const isActive = to ? location.pathname === to : false;

        const content = (
            <>
                <Icon className={clsx("mr-2", { "animate-spin": label === '...' && syncing })} />
                <span>{label}</span>
            </>
        );

        const classes = clsx(
            "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isActive
                ? "bg-brand text-white shadow-sm"
                : "text-gray-600 dark:text-leet-sub hover:text-brand dark:hover:text-brand-dark hover:bg-gray-100 dark:hover:bg-leet-input",
            className
        );

        if (to) {
            return <Link to={to} className={classes} onClick={onClick}>{content}</Link>;
        }
        return <button onClick={onClick} className={classes}>{content}</button>;
    };

    return (
        <>
            <nav className="bg-white dark:bg-leet-card shadow-md sticky top-0 z-40 border-t-4 border-brand transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                            <FaCode className="text-brand dark:text-brand-dark text-2xl mr-3" />
                            <span className="font-bold text-xl tracking-tight dark:text-leet-text">ITIGeeks</span>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
                            {currentUser && (
                                <>
                                    <NavLink icon={FaHome} label="Home" to="/" />
                                    {currentUser?.email === 'phys.mkhaled@gmail.com' && (
                                        <NavLink icon={FaChartPie} label="Stats" to="/supervisor" />
                                    )}
                                    <NavLink icon={FaTasks} label="Assignments" to="/assignments" />
                                    <NavLink icon={FaTrophy} label="Contests" to="/contests" />

                                    {/* AI Quota Badge */}
                                    <div className={`flex items-center px-3 py-2 rounded-md text-sm font-bold border ${(userData?.aiUsage?.count || 0) >= 30
                                        ? 'text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20'
                                        : 'text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
                                        }`}>
                                        <FaBolt className="mr-1" />
                                        {userData?.aiUsage?.date === new Date().toDateString() ? userData.aiUsage.count : 0}/30
                                    </div>

                                    <NavLink icon={FaSyncAlt} label={syncing ? "..." : "Sync"} onClick={handleSync} />

                                    {/* Tools Dropdown */}
                                    <div className="relative" ref={toolsRef}>
                                        <button
                                            onClick={() => setToolsOpen(!toolsOpen)}
                                            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-leet-sub hover:text-brand dark:hover:text-brand-dark hover:bg-gray-100 dark:hover:bg-leet-input transition-colors"
                                        >
                                            <FaTools className="mr-2" />
                                            <span>Tools</span>
                                            <FaCaretDown className="ml-1" />
                                        </button>

                                        {toolsOpen && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-leet-card rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                                                <button onClick={() => { setShowAddModal(true); setToolsOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-leet-input">
                                                    <FaPlus className="mr-2" /> Add Problem
                                                </button>
                                                <button onClick={() => { setShowDataModal(true); setToolsOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-leet-input">
                                                    <FaCog className="mr-2" /> Data Mgmt
                                                </button>
                                                <button onClick={() => { setShowLinkImportModal(true); setToolsOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-leet-input">
                                                    <FaLink className="mr-2" /> Link Import
                                                </button>
                                                <button onClick={() => { setShowAPIConfigModal(true); setToolsOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-leet-input font-semibold">
                                                    <FaKey className="mr-2" /> AI Settings
                                                </button>
                                                <button
                                                    onClick={() => { fileInputRef.current?.click(); setToolsOpen(false); }}
                                                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-leet-input cursor-pointer"
                                                >
                                                    <FaCloudUploadAlt className="mr-2" /> Import File
                                                </button>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept=".xlsx, .xls, .csv"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            importProblems(e.target.files[0]);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {isAdmin && <NavLink icon={FaShieldAlt} label="Admin" to="/admin" />}
                                    <NavLink icon={FaUserCog} label="Profile" to="/profile" />
                                </>
                            )}

                            <button onClick={toggleTheme} aria-label="Toggle Dark Mode" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-leet-input transition text-gray-600 dark:text-gray-400">
                                {userData?.darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon />}
                            </button>

                            {currentUser ? (
                                <button onClick={logout} className="flex items-center gap-2 bg-gray-200 dark:bg-leet-input hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-leet-text px-3 py-2 rounded-md text-sm font-medium transition ml-2">
                                    <img src={currentUser.photoURL} alt="Profile" className="w-5 h-5 rounded-full" />
                                    <span className="hidden lg:inline">Logout</span>
                                </button>
                            ) : (
                                <button onClick={login} className="flex items-center gap-2 bg-gray-200 dark:bg-leet-input hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-leet-text px-3 py-2 rounded-md text-sm font-medium transition ml-2">
                                    <FaGoogle />
                                    <span>Login</span>
                                </button>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex items-center md:hidden">
                            <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle Menu" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none p-2">
                                {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isOpen && (
                    <div className="md:hidden bg-white dark:bg-leet-card border-t dark:border-leet-border px-2 pt-2 pb-3 space-y-1 shadow-lg">
                        {currentUser && (
                            <>
                                <NavLink icon={FaHome} label="Home" to="/" onClick={() => setIsOpen(false)} className="w-full" />
                                {currentUser?.email === 'phys.mkhaled@gmail.com' && (
                                    <NavLink icon={FaChartPie} label="Stats" to="/supervisor" onClick={() => setIsOpen(false)} className="w-full" />
                                )}
                                <NavLink icon={FaTasks} label="Assignments" to="/assignments" onClick={() => setIsOpen(false)} className="w-full" />
                                <NavLink icon={FaTrophy} label="Contests" to="/contests" onClick={() => setIsOpen(false)} className="w-full" />
                                <NavLink icon={FaSyncAlt} label="Sync" onClick={() => { handleSync(); setIsOpen(false); }} className="w-full" />

                                <div className="border-t dark:border-leet-border my-2 pt-2">
                                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase">Tools</p>
                                    <NavLink icon={FaPlus} label="Add Problem" onClick={() => { setShowAddModal(true); setIsOpen(false); }} className="w-full" />
                                    <NavLink icon={FaCog} label="Data Mgmt" onClick={() => { setShowDataModal(true); setIsOpen(false); }} className="w-full" />
                                    <NavLink icon={FaLink} label="Link Import" onClick={() => { setShowLinkImportModal(true); setIsOpen(false); }} className="w-full" />
                                    <button onClick={() => { setShowAPIConfigModal(true); setIsOpen(false); }} className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-leet-input cursor-pointer w-full">
                                        <FaKey className="mr-2" />
                                        <span>AI Settings</span>
                                    </button>
                                    <button
                                        onClick={() => { mobileFileInputRef.current?.click(); setIsOpen(false); }}
                                        className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-leet-sub hover:text-brand dark:hover:text-brand-dark hover:bg-gray-100 dark:hover:bg-leet-input cursor-pointer w-full"
                                    >
                                        <FaCloudUploadAlt className="mr-2" />
                                        <span>Import File</span>
                                    </button>
                                    <input
                                        ref={mobileFileInputRef}
                                        type="file"
                                        accept=".xlsx, .xls, .csv"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                importProblems(e.target.files[0]);
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                </div>

                                {isAdmin && <NavLink icon={FaShieldAlt} label="Admin" to="/admin" onClick={() => setIsOpen(false)} className="w-full" />}
                                <NavLink icon={FaUserCog} label="Profile" to="/profile" onClick={() => setIsOpen(false)} className="w-full" />
                            </>
                        )}
                        <div className="flex items-center justify-between px-3 py-2 border-t dark:border-leet-border mt-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-leet-sub">Theme</span>
                            <button onClick={toggleTheme} aria-label="Toggle Dark Mode" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-leet-input transition text-gray-600 dark:text-gray-400">
                                {userData?.darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon />}
                            </button>
                        </div>
                        <div className="pt-2 border-t dark:border-leet-border">
                            {currentUser ? (
                                <button onClick={() => { logout(); setIsOpen(false); }} className="flex w-full items-center gap-2 bg-gray-200 dark:bg-leet-input hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-leet-text px-3 py-2 rounded-md text-sm font-medium transition">
                                    <img src={currentUser.photoURL} alt="Profile" className="w-5 h-5 rounded-full" />
                                    <span>Logout</span>
                                </button>
                            ) : (
                                <button onClick={() => { login(); setIsOpen(false); }} className="flex w-full items-center gap-2 bg-gray-200 dark:bg-leet-input hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-leet-text px-3 py-2 rounded-md text-sm font-medium transition">
                                    <FaGoogle />
                                    <span>Login</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </nav>
            <ManualAddModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
            <DataManagementModal isOpen={showDataModal} onClose={() => setShowDataModal(false)} />
            <LinkImportModal isOpen={showLinkImportModal} onClose={() => setShowLinkImportModal(false)} />
            <APIConfigModal isOpen={showAPIConfigModal} onClose={() => setShowAPIConfigModal(false)} />
        </>
    );
};

export default Navbar;
