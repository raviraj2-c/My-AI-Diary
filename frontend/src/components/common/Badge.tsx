import React, { HTMLAttributes, ReactNode } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'calm' | 'warm' | 'danger';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const variantStyles = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    primary: 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800/50',
    calm: 'bg-sky-50 text-text dark:bg-ink-950 dark:text-sky-200 border border-border dark:border-ink-800',
    warm: 'bg-sky-50 text-sky-700 dark:bg-ink-900 dark:text-sky-200 border border-sky-200 dark:border-sky-700',
    danger: 'bg-sky-50 text-danger dark:bg-danger dark:text-danger border border-danger dark:border-danger',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
