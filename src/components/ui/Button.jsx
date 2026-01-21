import React from 'react';
import clsx from 'clsx';
import { FaSpinner } from 'react-icons/fa';

/**
 * Unified Button Component
 * Provides consistent styling for buttons across the app
 * Replaces and extends LoadingButton.jsx
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {'primary' | 'secondary' | 'danger' | 'ghost' | 'success'} props.variant - Visual style
 * @param {'sm' | 'md' | 'lg'} props.size - Button size
 * @param {boolean} props.isLoading - Show loading spinner
 * @param {boolean} props.fullWidth - Take full width of container
 * @param {React.ReactNode} props.leftIcon - Icon to show before text
 * @param {React.ReactNode} props.rightIcon - Icon to show after text
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props 
}) => {
  const variants = {
    primary: 'bg-brand hover:bg-brand-hover text-white shadow-sm',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-leet-input dark:hover:bg-leet-border dark:text-leet-text',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 dark:hover:bg-leet-input dark:text-leet-sub',
    success: 'bg-green-500 hover:bg-green-600 text-white shadow-sm'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2'
  };

  const isDisabled = isLoading || disabled;

  return (
    <button
      disabled={isDisabled}
      className={clsx(
        // Base styles
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 dark:focus:ring-offset-leet-bg',
        
        // Disabled styles
        isDisabled && 'opacity-50 cursor-not-allowed',
        
        // Full width
        fullWidth && 'w-full',
        
        // Variant and size
        variants[variant],
        sizes[size],
        
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <FaSpinner className="animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

/**
 * Icon-only Button variant
 */
Button.Icon = ({ 
  children, 
  variant = 'ghost', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const sizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const variants = {
    primary: 'bg-brand hover:bg-brand-hover text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-leet-input dark:hover:bg-leet-border dark:text-leet-sub',
    danger: 'bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 dark:hover:bg-leet-input dark:text-leet-sub'
  };

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-lg',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-brand/50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
