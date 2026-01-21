import React from 'react';
import clsx from 'clsx';

/**
 * Unified Card Component
 * Provides consistent styling for card containers across the app
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {'default' | 'elevated' | 'ghost'} props.variant - Visual style variant
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hover - Enable hover effects
 * @param {string} props.padding - Padding size ('none', 'sm', 'md', 'lg')
 */
const Card = ({ 
  children, 
  variant = 'default', 
  className = '',
  hover = false,
  padding = 'md',
  ...props 
}) => {
  const variants = {
    default: 'bg-white dark:bg-leet-card border border-gray-200 dark:border-leet-border',
    elevated: 'bg-white dark:bg-leet-card shadow-lg dark:shadow-none dark:border dark:border-leet-border',
    ghost: 'bg-transparent'
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const hoverStyles = hover 
    ? 'hover:shadow-xl hover:border-brand/30 dark:hover:border-brand-dark/30 transition-all duration-200 cursor-pointer' 
    : '';

  return (
    <div
      className={clsx(
        'rounded-lg',
        variants[variant],
        paddings[padding],
        hoverStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card Header subcomponent
 */
Card.Header = ({ children, className = '' }) => (
  <div className={clsx('border-b border-gray-100 dark:border-leet-border pb-4 mb-4', className)}>
    {children}
  </div>
);

/**
 * Card Title subcomponent
 */
Card.Title = ({ children, className = '' }) => (
  <h3 className={clsx('text-lg font-semibold text-gray-900 dark:text-leet-text', className)}>
    {children}
  </h3>
);

/**
 * Card Content subcomponent
 */
Card.Content = ({ children, className = '' }) => (
  <div className={clsx('text-gray-600 dark:text-leet-sub', className)}>
    {children}
  </div>
);

/**
 * Card Footer subcomponent
 */
Card.Footer = ({ children, className = '' }) => (
  <div className={clsx('border-t border-gray-100 dark:border-leet-border pt-4 mt-4', className)}>
    {children}
  </div>
);

export default Card;
