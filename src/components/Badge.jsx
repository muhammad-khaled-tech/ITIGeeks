import React from 'react';
import { FaTrophy, FaFire, FaBrain, FaCode, FaMedal, FaStar } from 'react-icons/fa';

const BADGE_ICONS = {
    'Bronze Coder': <FaCode className="text-yellow-700" />,
    'Silver Coder': <FaCode className="text-gray-400" />,
    'Gold Coder': <FaCode className="text-yellow-400" />,
    'On Fire': <FaFire className="text-orange-500" />,
    'Graph Master': <FaBrain className="text-pink-500" />,
    'Contest Winner': <FaTrophy className="text-yellow-500" />,
    'Top 10': <FaMedal className="text-blue-500" />,
    'Consistent': <FaStar className="text-purple-500" />
};

const Badge = ({ name, size = 'md' }) => {
    const icon = BADGE_ICONS[name] || <FaMedal className="text-gray-500" />;

    const sizeClasses = size === 'sm' ? 'text-xs p-1' : size === 'lg' ? 'text-2xl p-3' : 'text-lg p-2';

    return (
        <div className={`inline-flex items-center justify-center bg-gray-100 dark:bg-leet-input rounded-full ${sizeClasses} shadow-sm`} title={name}>
            {icon}
        </div>
    );
};

export default Badge;
