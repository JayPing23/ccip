'use client';

import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface BrandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const BrandInput = forwardRef<HTMLInputElement, BrandInputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = error && inputId ? `${inputId}-error` : undefined;
    const hintId = hint && inputId ? `${inputId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-brand-text-primary text-sm font-medium">
            {label}
            {props.required && (
              <span className="text-status-error ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          {...{ 'aria-invalid': !!error }}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className={twMerge(
            'border-brand-secondary/30 bg-brand-surface text-brand-text-primary placeholder:text-brand-text-muted rounded-lg border px-3 py-2 transition-colors duration-150',
            'focus:border-brand-primary focus:ring-brand-primary/30 focus:ring-2 focus:outline-none',
            error && 'border-status-error focus:border-status-error focus:ring-status-error/30',
            props.disabled && 'cursor-not-allowed opacity-50',
            className
          )}
          {...props}
        />
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

BrandInput.displayName = 'BrandInput';
export default BrandInput;
