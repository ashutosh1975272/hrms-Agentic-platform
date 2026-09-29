import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { IconButton } from './Button';
import { Icon } from './Icon';
import { useDialogFocus } from './useDialogFocus';

export interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  dismissible?: boolean;
}

const SIZE_CLASS = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
} as const;

/**
 * Accessible modal dialog: aria-modal, labelled by its title, focus is moved in
 * on open, trapped while open, and returned to the trigger on close. Escape and
 * overlay clicks dismiss when `dismissible` is set.
 */
export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
  dismissible = true,
}: ModalProps) {
  const reactId = useId();
  const titleId = `${reactId}-title`;
  const descriptionId = `${reactId}-description`;
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useDialogFocus(open, dialogRef, onClose, dismissible);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="animate-fade-in fixed inset-0 bg-foreground/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`animate-scale-in relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-dialog border border-border bg-card shadow-xl sm:rounded-dialog ${SIZE_CLASS[size]}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold text-foreground" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          {dismissible ? (
            <IconButton icon="close" label={`Close ${title}`} variant="ghost" onClick={onClose} />
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/40 px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = true,
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      dismissible={!busy}
      footer={
        <>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-control border border-border px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control px-4 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
              destructive
                ? 'bg-destructive text-on-destructive hover:bg-destructive-strong'
                : 'bg-accent text-on-accent hover:bg-accent-strong'
            }`}
          >
            {busy ? <Icon name="refresh" size={16} className="animate-spin motion-reduce:animate-none" /> : null}
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm text-foreground">{message}</div>
    </Modal>
  );
}
