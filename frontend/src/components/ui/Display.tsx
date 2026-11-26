import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  padding = 'md',
  className = '',
  children,
  ...props
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-surface text-text border border-border rounded-card ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'default' | 'sky' | 'danger';
  selected?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  tone = 'default',
  selected = false,
  className = '',
  children,
  ...props
}) => {
  const styles = selected
    ? 'bg-sky-700 text-white border-sky-700'
    : tone === 'danger'
      ? 'bg-danger text-white border-danger'
      : tone === 'sky'
        ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-ink-900 dark:text-sky-400 dark:border-ink-800'
        : 'bg-surface text-text border-border';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-chip border text-xs font-semibold ${styles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export interface StatProps {
  value: string | number;
  label: string;
  className?: string;
}

export const Stat: React.FC<StatProps> = ({ value, label, className = '' }) => (
  <div className={`p-4 bg-surface border border-border rounded-card ${className}`}>
    <div className="text-xl font-semibold text-text">{value}</div>
    <div className="text-xs text-muted mt-1">{label}</div>
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-6 w-full' }) => (
  <div
    aria-hidden="true"
    className={`animate-pulse rounded-card bg-sky-100 dark:bg-ink-800 ${className}`}
  />
);

export interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max = 100,
  size = 56,
  strokeWidth = 4,
  label,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const offset = circumference * (1 - pct);

  return (
    <div className="inline-flex items-center gap-2" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-sky-100 dark:text-ink-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-sky-500 transition-all duration-300"
        />
      </svg>
      {label && <span className="text-xs text-muted">{label}</span>}
    </div>
  );
};
