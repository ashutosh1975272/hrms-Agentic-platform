import { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useChat } from '../../chat/useChat';
import { pendingConfirmation } from '../../chat/chatState';
import { ChatDock } from './ChatDock';
import { ChatLauncher } from './ChatLauncher';

/**
 * Mounts the dockable assistant on every authenticated page. The full page view
 * lives at /chat, so the launcher steps aside there.
 */
export function ChatDockHost() {
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { conversation } = useChat();

  const onChatPage = location.pathname === '/chat';
  const needsConfirmation = pendingConfirmation(conversation) !== null;

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  const expand = useCallback(() => {
    setOpen(false);
    navigate('/chat');
  }, [navigate]);

  if (onChatPage) {
    return null;
  }

  return (
    <>
      <ChatLauncher
        hasUnread={needsConfirmation}
        onToggle={() => setOpen((current) => !current)}
        open={open}
        ref={launcherRef}
      />
      <ChatDock onClose={close} onExpand={expand} open={open} />
    </>
  );
}
