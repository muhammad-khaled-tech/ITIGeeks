import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaBars, FaTimes, FaCode, FaMoon, FaSun, FaGoogle, FaChartPie, FaCog, FaPlus, FaLink, FaSyncAlt, FaUserCog, FaShieldAlt, FaTrophy, FaTasks } from 'react-icons/fa';
import clsx from 'clsx';

const Navbar = () => {
    const { currentUser, login, logout, userData, updateUserData, isAdmin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const toggleTheme = () => {
        if (userData) {
            updateUserData({ ...userData, darkMode: !userData.darkMode });
        }
    };

    // Apply theme effect (moved from toggleTheme to ensure sync)
    React.useEffect(() => {
        if (userData?.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [userData?.darkMode]);


    const NavLink = ({ icon: Icon, label, to, onClick, className }) => {
        const content = (
            <>
                <Icon className="mr-2" />
                <span>{label}</span>
            </>
        );

        const classes = clsx(
            "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
            "text-gray-600 dark:text-leet-sub hover:text-brand dark:hover:text-brand-dark hover:bg-gray-100 dark:hover:bg-leet-input",
            className
        );

        if (to) {
            return <Link to={to} className={classes} onClick={onClick}>{content}</Link>;
        }
        return <button onClick={onClick} className={classes}>{content}</button>;
    };

    return (
        <nav className="bg-white dark:bg-leet-card shadow-md sticky top-0 z-40 border-t-4 border-brand transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                        <FaCode className="text-brand dark:text-brand-dark text-2xl mr-3" />
                        <span className="font-bold text-xl tracking-tight dark:text-leet-text">ITIGeeks</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-2">
                        {currentUser && (
                            <>
                                <NavLink icon={FaSyncAlt} label="Sync" onClick={() => { }} />
                                <NavLink icon={FaTasks} label="Assignments" to="/assignments" />
                                <NavLink icon={FaTrophy} label="Contests" to="/contests" />
                                <NavLink icon={FaChartPie} label="Dashboard" to="/supervisor" />
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
                                <span>Logout</span>
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
                            <NavLink icon={FaSyncAlt} label="Sync" onClick={() => setIsOpen(false)} className="w-full" />
                            <NavLink icon={FaChartPie} label="Stats" onClick={() => setIsOpen(false)} className="w-full" />
                            {isAdmin && <NavLink icon={FaShieldAlt} label="Admin" to="/admin" onClick={() => setIsOpen(false)} className="w-full" />}
                            <NavLink icon={FaUserCog} label="Profile" to="/profile" onClick={() => setIsOpen(false)} className="w-full" />
                        </>
                    )}
                    <div className="flex items-center justify-between px-3 py-2">
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
    );
};

export default Navbar;
