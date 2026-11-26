import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-sky-700 text-white border border-sky-700 hover:bg-sky-700/90 dark:bg-sky-700 dark:text-white',
    secondary: 'bg-white text-ink border border-ink hover:bg-sky-50 dark:bg-ink-900 dark:text-white dark:border-ink-800 dark:hover:bg-ink-800',
    ghost: 'bg-transparent text-text border border-transparent hover:bg-sky-50 dark:hover:bg-ink-800',
    danger: 'bg-danger text-white border border-danger hover:bg-danger/90',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'min-h-[44px] px-3 py-1.5 text-xs',
    md: 'min-h-[44px] px-4 py-2 text-sm',
    lg: 'min-h-[44px] px-5 py-2.5 text-base',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-card font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'ghost' | 'secondary' | 'danger';
}

export const IconButton: React.FC<IconButtonProps> = ({
  label,
  variant = 'ghost',
  className = '',
  children,
  ...props
}) => {
  const variants: Record<NonNullable<IconButtonProps['variant']>, string> = {
    ghost: 'bg-transparent text-text hover:bg-sky-50 dark:hover:bg-ink-800 border border-transparent',
    secondary: 'bg-surface text-text border border-border hover:bg-sky-50 dark:hover:bg-ink-800',
    danger: 'bg-danger text-white border border-danger hover:bg-danger/90',
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-card transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
