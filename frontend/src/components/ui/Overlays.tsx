import React from 'react';
import { X } from 'lucide-react';
import { Button, IconButton } from './Button';

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ items, value, onChange }) => (
  <div role="tablist" className="flex border-b border-border gap-4">
    {items.map((item) => {
      const active = item.id === value;
      return (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(item.id)}
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            active
              ? 'border-sky-500 text-sky-700 dark:text-sky-400'
              : 'border-transparent text-muted hover:text-text'
          }`}
        >
          {item.label}
        </button>
      );
    })}
  </div>
);

export const SegmentedControl: React.FC<TabsProps> = ({ items, value, onChange }) => (
  <div role="radiogroup" className="inline-flex p-1 rounded-card bg-bg border border-border gap-1">
    {items.map((item) => {
      const active = item.id === value;
      return (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onChange(item.id)}
          className={`px-3 py-1 rounded-card text-xs font-semibold transition-colors ${
            active ? 'bg-sky-700 text-white' : 'text-text hover:bg-sky-50 dark:hover:bg-ink-800'
          }`}
        >
          {item.label}
        </button>
      );
    })}
  </div>
);

export interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<OverlayProps> = ({ open, onClose, title, closeLabel = 'Close', children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md bg-surface text-text border border-border rounded-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <IconButton label={closeLabel} onClick={onClose}>
            <X size={20} strokeWidth={1.75} />
          </IconButton>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export const BottomSheet: React.FC<OverlayProps> = ({ open, onClose, title, closeLabel = 'Close', children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full sm:max-w-md bg-surface text-text border border-border rounded-t-card sm:rounded-card p-6 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <IconButton label={closeLabel} onClick={onClose}>
            <X size={20} strokeWidth={1.75} />
          </IconButton>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  actionLabel: string;
  onAction: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, message, actionLabel, onAction }) => (
  <div className="p-8 text-center bg-surface border border-border rounded-card space-y-4">
    <div className="inline-flex items-center justify-center text-sky-500">{icon}</div>
    <p className="text-sm text-muted">{message}</p>
    <Button variant="primary" onClick={onAction}>
      {actionLabel}
    </Button>
  </div>
);

export interface ToastBannerProps {
  message: string;
  tone?: 'info' | 'danger';
  onDismiss?: () => void;
}

export const Toast: React.FC<ToastBannerProps> = ({ message, tone = 'info', onDismiss }) => (
  <div
    role="status"
    className={`inline-flex items-center gap-3 px-4 py-2 rounded-card border text-sm font-semibold ${
      tone === 'danger'
        ? 'bg-danger text-white border-danger'
        : 'bg-surface text-text border-border'
    }`}
  >
    <span>{message}</span>
    {onDismiss && (
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="opacity-80 hover:opacity-100">
        <X size={16} strokeWidth={1.75} />
      </button>
    )}
  </div>
);
