import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';

import { Icon, type IconName } from './Icon';
import { ToastContext, useToast, type ToastContextValue, type ToastMessage, type ToastTone } from './toastContext';

const AUTO_DISMISS_MS = 6000;

const TONE_ICON: Record<ToastTone, IconName> = {
  success: 'check',
  danger: 'alert',
  info: 'info',
};

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'border-success/40 bg-success-soft text-success',
  danger: 'border-destructive/40 bg-destructive/10 text-destructive-strong',
  info: 'border-info/40 bg-info-soft text-info',
};

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = nextId.current;
    nextId.current += 1;
    setToasts((current) => [...current.slice(-2), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, notify, dismiss }),
    [toasts, notify, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
      <div aria-live="polite" className="contents">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'danger' ? 'alert' : 'status'}
            className={`animate-scale-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border p-3 shadow-lg ${TONE_CLASS[toast.tone]}`}
          >
            <Icon name={TONE_ICON[toast.tone]} size={18} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-sm text-foreground/80">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control text-current transition-colors duration-200 hover:bg-foreground/10"
            >
              <Icon name="close" size={16} />
              <span className="sr-only">Dismiss notification</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
