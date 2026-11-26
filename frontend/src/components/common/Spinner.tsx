import React from 'react';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  label = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div role="status" className="inline-flex items-center justify-center gap-2">
      <Loader2 className={`animate-spin text-calm-600 dark:text-calm-400 ${sizeClasses[size]} ${className}`} />
      <span className="sr-only">{label}</span>
    </div>
  );
};
