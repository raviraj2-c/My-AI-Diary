import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'calm' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-soft-sm hover:shadow-soft-md',
    calm: 'bg-muted hover:bg-text text-white shadow-soft-sm hover:shadow-soft-md',
    secondary: 'bg-sky-100 dark:bg-ink-800 text-ink-800 dark:text-sky-100 hover:bg-border dark:hover:bg-text',
    danger: 'bg-danger-soft-500 hover:bg-danger-soft-600 text-white shadow-soft-sm',
    ghost: 'text-muted dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-ink-800',
    outline: 'border border-sky-200 dark:border-text text-text dark:text-border hover:bg-sky-50 dark:hover:bg-ink-800'
  };

  const renderIcon = () => {
    if (loading) {
      return <Loader2 className="h-4 w-4 animate-spin shrink-0" />;
    }
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComp = icon as React.ComponentType<{ className?: string }>;
    return <IconComp className="h-4 w-4 shrink-0" />;
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {renderIcon()}
      {children ? <span>{children}</span> : null}
    </button>
  );
};
