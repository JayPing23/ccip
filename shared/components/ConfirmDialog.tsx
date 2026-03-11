'use client';

import { useCallback, useEffect, useRef } from 'react';
import BrandButton from './BrandButton';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      cancelBtnRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [onCancel]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onCancel();
      }
    },
    [onCancel]
  );

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      className="bg-brand-surface fixed inset-0 z-50 m-auto max-w-md rounded-xl p-0 shadow-xl backdrop:bg-black/50"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div className="p-6">
        <h2
          id="confirm-dialog-title"
          className="text-brand-text-primary mb-2 text-lg font-semibold"
        >
          {title}
        </h2>
        <p id="confirm-dialog-desc" className="text-brand-text-secondary mb-6 text-sm">
          {description}
        </p>
        <div className="flex justify-end gap-3">
          <BrandButton ref={cancelBtnRef} variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </BrandButton>
          <BrandButton variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </BrandButton>
        </div>
      </div>
    </dialog>
  );
}
