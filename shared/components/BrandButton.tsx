'use client';

import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand-primary text-white hover:bg-brand-primary/90 focus:ring-brand-primary/50',
  secondary:
    'bg-brand-accent text-brand-primary hover:bg-brand-accent/80 focus:ring-brand-accent/50',
  danger: 'bg-status-error text-white hover:bg-status-error/90 focus:ring-status-error/50',
  ghost:
    'bg-transparent text-brand-text-secondary hover:bg-brand-primary/5 focus:ring-brand-primary/30',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const BrandButton = forwardRef<HTMLButtonElement, BrandButtonProps>(
  (
    { variant = 'primary', size = 'md', loading = false, className, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={twMerge(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 focus:ring-2 focus:ring-offset-2 focus:outline-none',
          variantStyles[variant],
          sizeStyles[size],
          (disabled || loading) && 'cursor-not-allowed opacity-50',
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

BrandButton.displayName = 'BrandButton';
export default BrandButton;
