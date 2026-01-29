import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FaChevronRight, FaHome } from 'react-icons/fa';

const Breadcrumbs = ({ customLastLabel }) => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) return null;

    return (
        <nav className="flex items-center text-sm text-gray-400 dark:text-gray-500 mb-6 overflow-x-auto whitespace-nowrap font-medium px-1">
            <Link to="/" className="hover:text-brand dark:hover:text-brand-dark transition-colors flex items-center gap-1.5 drop-shadow-sm">
                <FaHome className="text-xs" /> Home
            </Link>
            {pathnames.map((value, index) => {
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                
                // Use custom label if provided for the last segment
                const label = (isLast && customLastLabel) 
                    ? customLastLabel 
                    : value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

                return (
                    <React.Fragment key={to}>
                        <FaChevronRight className="mx-2.5 text-[10px] opacity-40" />
                        {isLast ? (
                            <span className="text-gray-900 dark:text-leet-text truncate max-w-[200px] md:max-w-none">
                                {label}
                            </span>
                        ) : (
                            <Link to={to} className="hover:text-brand dark:hover:text-brand-dark transition-colors truncate">
                                {label}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;

