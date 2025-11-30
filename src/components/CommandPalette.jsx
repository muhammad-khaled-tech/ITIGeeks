import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSearch, FaHome, FaUser, FaTrophy, FaSignOutAlt, FaMoon, FaSun, FaTasks, FaChartPie } from 'react-icons/fa';

const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { logout, userData } = useAuth();
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        setOpen(false);
    };

    const runCommand = (command) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm">
            <Command className="w-full max-w-lg bg-white dark:bg-leet-card rounded-xl shadow-2xl border dark:border-leet-border overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center border-b dark:border-leet-border px-4" cmdk-input-wrapper="">
                    <FaSearch className="mr-2 h-4 w-4 shrink-0 opacity-50 dark:text-gray-400" />
                    <Command.Input
                        placeholder="Type a command or search..."
                        className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
                    />
                </div>
                <Command.List className="max-h-[300px] overflow-y-auto p-2">
                    <Command.Empty className="py-6 text-center text-sm dark:text-gray-400">No results found.</Command.Empty>

                    <Command.Group heading="Navigation" className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1.5">
                        <Command.Item onSelect={() => runCommand(() => navigate('/'))} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-leet-input cursor-pointer dark:text-gray-200 aria-selected:bg-gray-100 dark:aria-selected:bg-leet-input">
                            <FaHome /> Home
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/profile'))} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-leet-input cursor-pointer dark:text-gray-200 aria-selected:bg-gray-100 dark:aria-selected:bg-leet-input">
                            <FaUser /> Profile
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/contests'))} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-leet-input cursor-pointer dark:text-gray-200 aria-selected:bg-gray-100 dark:aria-selected:bg-leet-input">
                            <FaTrophy /> Contests
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/assignments'))} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-leet-input cursor-pointer dark:text-gray-200 aria-selected:bg-gray-100 dark:aria-selected:bg-leet-input">
                            <FaTasks /> Assignments
                        </Command.Item>
                        {(userData?.role === 'admin' || userData?.role === 'supervisor') && (
                            <Command.Item onSelect={() => runCommand(() => navigate('/supervisor'))} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-leet-input cursor-pointer dark:text-gray-200 aria-selected:bg-gray-100 dark:aria-selected:bg-leet-input">
                                <FaChartPie /> Supervisor Dashboard
                            </Command.Item>
                        )}
                    </Command.Group>

                    <Command.Group heading="Settings" className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1.5 mt-2">
                        <Command.Item onSelect={toggleTheme} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-leet-input cursor-pointer dark:text-gray-200 aria-selected:bg-gray-100 dark:aria-selected:bg-leet-input">
                            {darkMode ? <FaSun /> : <FaMoon />} Toggle Theme
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(logout)} className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-leet-input cursor-pointer text-red-500 aria-selected:bg-gray-100 dark:aria-selected:bg-leet-input">
                            <FaSignOutAlt /> Log Out
                        </Command.Item>
                    </Command.Group>
                </Command.List>
            </Command>
        </div>
    );
};

export default CommandPalette;
