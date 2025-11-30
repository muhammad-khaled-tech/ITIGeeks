import React from 'react';

const Skeleton = ({ variant = 'text', className = '', count = 1 }) => {
    const baseClass = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";

    const getVariantClass = () => {
        switch (variant) {
            case 'circle': return "rounded-full";
            case 'rect': return "rounded-lg";
            default: return "rounded";
        }
    };

    const skeletons = Array(count).fill(0).map((_, i) => (
        <div
            key={i}
            className={`${baseClass} ${getVariantClass()} ${className}`}
        ></div>
    ));

    return <>{skeletons}</>;
};

export default Skeleton;
