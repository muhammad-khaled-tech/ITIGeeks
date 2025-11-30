import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaRobot } from 'react-icons/fa';

const NotFound = () => {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
            <div className="bg-gray-100 dark:bg-leet-card p-8 rounded-full mb-6 animate-bounce">
                <FaRobot className="text-6xl text-brand dark:text-brand-dark" />
            </div>
            <h1 className="text-6xl font-bold text-gray-800 dark:text-white mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-300 mb-6">Page Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link
                to="/"
                className="bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-transform hover:scale-105"
            >
                <FaHome /> Go Home
            </Link>
        </div>
    );
};

export default NotFound;
