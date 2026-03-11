'use client';

import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface BrandSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const BrandSelect = forwardRef<HTMLSelectElement, BrandSelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = error && selectId ? `${selectId}-error` : undefined;
    const hintId = hint && selectId ? `${selectId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-brand-text-primary text-sm font-medium">
            {label}
            {props.required && (
              <span className="text-status-error ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          {...{ 'aria-invalid': !!error }}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className={twMerge(
            'border-brand-secondary/30 bg-brand-surface text-brand-text-primary rounded-lg border px-3 py-2 transition-colors duration-150',
            'focus:border-brand-primary focus:ring-brand-primary/30 focus:ring-2 focus:outline-none',
            error && 'border-status-error focus:border-status-error focus:ring-status-error/30',
            props.disabled && 'cursor-not-allowed opacity-50',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} className="text-status-error text-sm" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-brand-text-muted text-sm">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

BrandSelect.displayName = 'BrandSelect';
export default BrandSelect;
