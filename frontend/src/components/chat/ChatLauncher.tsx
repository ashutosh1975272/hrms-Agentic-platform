import { forwardRef } from 'react';

import { Icon } from '../ui/Icon';

export interface ChatLauncherProps {
  open: boolean;
  onToggle: () => void;
  hasUnread: boolean;
}

/** Floating launcher for the dockable assistant; the trigger owns focus. */
export const ChatLauncher = forwardRef<HTMLButtonElement, ChatLauncherProps>(
  function ChatLauncher({ open, onToggle, hasUnread }, ref) {
    return (
      <button
        aria-expanded={open}
        aria-label={open ? 'Close the AI assistant' : 'Open the AI assistant'}
        className="fixed bottom-4 right-4 z-40 inline-flex h-12 min-h-11 w-12 cursor-pointer items-center justify-center rounded-full bg-accent text-on-accent shadow-lg transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-95"
        onClick={onToggle}
        ref={ref}
        type="button"
      >
        <Icon className="h-5 w-5" name={open ? 'x' : 'message'} />
        {hasUnread ? (
          <span
            aria-label="The assistant needs your confirmation"
            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-primary"
            role="status"
          />
        ) : null}
      </button>
    );
  },
);
