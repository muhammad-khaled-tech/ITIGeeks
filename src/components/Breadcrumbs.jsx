import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FaChevronRight, FaHome } from 'react-icons/fa';

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) return null;

    return (
        <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4 overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-brand dark:hover:text-brand-dark flex items-center gap-1">
                <FaHome /> Home
            </Link>
            {pathnames.map((value, index) => {
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                const label = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

                return (
                    <React.Fragment key={to}>
                        <FaChevronRight className="mx-2 text-xs" />
                        {isLast ? (
                            <span className="font-medium text-gray-900 dark:text-white">{label}</span>
                        ) : (
                            <Link to={to} className="hover:text-brand dark:hover:text-brand-dark">
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
