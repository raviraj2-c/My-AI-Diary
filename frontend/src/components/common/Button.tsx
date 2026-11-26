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
    calm: 'bg-calm-600 hover:bg-calm-700 text-white shadow-soft-sm hover:shadow-soft-md',
    secondary: 'bg-calm-100 dark:bg-calm-800 text-calm-800 dark:text-calm-100 hover:bg-calm-200 dark:hover:bg-calm-700',
    danger: 'bg-danger-soft-500 hover:bg-danger-soft-600 text-white shadow-soft-sm',
    ghost: 'text-calm-600 dark:text-calm-300 hover:bg-calm-100 dark:hover:bg-calm-800',
    outline: 'border border-calm-300 dark:border-calm-700 text-calm-700 dark:text-calm-200 hover:bg-calm-50 dark:hover:bg-calm-800/60'
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
