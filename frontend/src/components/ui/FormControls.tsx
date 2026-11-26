import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, id, className = '', ...props }) => {
  const inputId = id || (label ? `ui-input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-text">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 rounded-card bg-surface text-text border border-border text-sm placeholder:text-muted ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
};

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, id, className = '', ...props }) => {
  const areaId = id || (label ? `ui-textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={areaId} className="block text-xs font-semibold text-text">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        className={`w-full px-3 py-2 rounded-card bg-surface text-text border border-border text-sm placeholder:text-muted ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
};

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`inline-flex items-center w-11 h-6 rounded-chip border transition-colors p-0.5 ${
      checked ? 'bg-sky-700 border-sky-700' : 'bg-surface border-border'
    } disabled:opacity-50`}
  >
    <span
      className={`w-4 h-4 rounded-chip transition-transform ${
        checked ? 'translate-x-5 bg-white' : 'translate-x-0 bg-ink dark:bg-white'
      }`}
    />
  </button>
);

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Slider: React.FC<SliderProps> = ({ label, id, className = '', ...props }) => {
  const sliderId = id || (label ? `ui-slider-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={sliderId} className="block text-xs font-semibold text-text">
          {label}
        </label>
      )}
      <input
        id={sliderId}
        type="range"
        className={`w-full accent-sky-500 cursor-pointer ${className}`}
        {...props}
      />
    </div>
  );
};
