'use client';

import { useId } from 'react';
import { twMerge } from 'tailwind-merge';

interface BrandToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
  className?: string;
}

export default function BrandToggle({
  label,
  checked,
  onChange,
  disabled = false,
  description,
  className,
}: BrandToggleProps) {
  const id = useId();

  return (
    <div className={twMerge('flex items-center justify-between gap-3', className)}>
      <div className="flex flex-col">
        <label htmlFor={id} className="text-brand-text-primary text-sm font-medium">
          {label}
        </label>
        {description && <p className="text-brand-text-muted text-xs">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        {...{ role: 'switch', 'aria-checked': checked }}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={twMerge(
          'focus:ring-brand-primary/30 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none',
          checked ? 'bg-brand-primary' : 'bg-brand-text-muted/40',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          aria-hidden="true"
          className={twMerge(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
