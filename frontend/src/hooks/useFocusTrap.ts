import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface FocusTrapOptions {
  active: boolean;
  onEscape?: () => void;
}

/**
 * Keyboard support for modal surfaces: Escape closes, Tab and Shift+Tab cycle
 * inside the container. Also locks body scroll while the modal is open.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  { active, onEscape }: FocusTrapOptions,
): void {
  useEffect(() => {
    if (!active) {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape?.();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [active, containerRef, onEscape]);
}
