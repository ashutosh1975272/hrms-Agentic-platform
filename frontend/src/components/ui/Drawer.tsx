import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { IconButton } from './Button';
import { useDialogFocus } from './useDialogFocus';

export interface DrawerProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Right-hand detail drawer for read-heavy records. Same dialog contract as
 * Modal (aria-modal, focus in/trapped/restored, Escape to close) but anchored
 * to the side so a record can be reviewed without losing the list behind it.
 */
export function Drawer({ open, title, description, onClose, children, footer }: DrawerProps) {
  const reactId = useId();
  const titleId = `${reactId}-title`;
  const descriptionId = `${reactId}-description`;
  const panelRef = useRef<HTMLDivElement | null>(null);

  useDialogFocus(open, panelRef, onClose);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="animate-fade-in absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        aria-hidden="true"
        onMouseDown={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="animate-drawer-in relative z-10 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-xl"
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
          <IconButton icon="close" label={`Close ${title}`} variant="ghost" onClick={onClose} />
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
