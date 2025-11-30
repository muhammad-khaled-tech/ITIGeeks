import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const LoadingButton = ({ loading, children, className, disabled, ...props }) => {
    return (
        <button
            disabled={loading || disabled}
            className={`flex items-center justify-center gap-2 transition-all ${loading ? 'opacity-75 cursor-not-allowed' : ''} ${className}`}
            {...props}
        >
            {loading && <FaSpinner className="animate-spin" />}
            {children}
        </button>
    );
};

export default LoadingButton;
