import { useEffect, useRef } from 'react';

import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { ChatPanel } from './ChatPanel';

export interface ChatDockProps {
  open: boolean;
  onClose: () => void;
  onExpand: () => void;
}

/**
 * Dockable chat panel: a right sidebar on desktop, a modal drawer on mobile
 * (backdrop, focus trap, Escape to close, focus returns to the launcher).
 */
export function ChatDock({ open, onClose, onExpand }: ChatDockProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const modal = open && !isDesktop;

  useFocusTrap(panelRef, { active: modal, onEscape: onClose });

  useEffect(() => {
    if (!open) {
      return;
    }
    panelRef.current?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" data-testid="chat-dock">
      {modal ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          onClick={onClose}
        />
      ) : null}

      <div
        aria-label="AI assistant"
        aria-modal={modal ? 'true' : undefined}
        className={`absolute right-0 top-0 flex h-full w-full flex-col border-l border-border bg-background shadow-xl sm:w-[26rem] lg:w-[24rem] ${
          modal ? '' : 'glass-panel'
        }`}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }
        }}
        ref={panelRef}
        role={modal ? 'dialog' : 'complementary'}
        tabIndex={-1}
      >
        <ChatPanel onClose={onClose} onExpand={onExpand} variant="dock" />
      </div>
    </div>
  );
}
