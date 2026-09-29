import { useCallback, useMemo, useState } from 'react';

import type { AgentConfirmation } from '../../agent/types';
import { useAuth } from '../../auth/AuthContext';
import { useChat } from '../../chat/useChat';
import { pendingConfirmation } from '../../chat/chatState';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ChatComposer } from './ChatComposer';
import { ChatEmptyState } from './ChatEmptyState';
import { ConversationList } from './ConversationList';
import { MessageList } from './MessageList';

export interface ChatPanelProps {
  variant: 'dock' | 'page';
  onClose?: () => void;
  onExpand?: () => void;
}

export function ChatPanel({ variant, onClose, onExpand }: ChatPanelProps) {
  const { user } = useAuth();
  const {
    conversation,
    conversations,
    activeId,
    turnStatus,
    clientKind,
    sendMessage,
    retry,
    resolveConfirmation,
    stopGenerating,
    startNewConversation,
    selectConversation,
    deleteConversation,
  } = useChat();

  const [historyOpen, setHistoryOpen] = useState(variant === 'page');
  const busy = turnStatus === 'busy';
  const messages = useMemo(() => conversation?.messages ?? [], [conversation]);
  const assistantName = 'HR assistant';
  const awaiting = pendingConfirmation(conversation);

  const handleNewChat = useCallback(() => {
    startNewConversation();
    setHistoryOpen(variant === 'page');
  }, [startNewConversation, variant]);

  const handleDecide = useCallback(
    (confirmationId: string, decision: 'approved' | 'denied') => {
      const target =
        messages
          .map((message) => message.confirmation)
          .find((entry): entry is AgentConfirmation => entry?.id === confirmationId) ?? null;
      if (target) {
        resolveConfirmation(target, decision);
      }
    },
    [messages, resolveConfirmation],
  );

  const historyClasses =
    variant === 'page'
      ? 'absolute inset-y-0 left-0 z-20 w-full max-w-[17rem] border-r border-border shadow-lg md:relative md:z-auto md:w-60 md:max-w-none md:shadow-none'
      : 'absolute inset-y-0 left-0 z-20 w-full max-w-[17rem] border-r border-border shadow-lg';

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="glass-panel flex items-center gap-2 border-b border-border px-3 py-2">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <Icon className="h-4 w-4" name="sparkles" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-heading text-sm font-semibold text-foreground">{assistantName}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {user ? `Signed in as ${user.fullName}` : 'Not signed in'}
          </p>
        </div>

        {clientKind === 'mock' ? (
          <Badge className="hidden sm:inline-flex" tone="info">
            Demo agent
          </Badge>
        ) : null}

        <Button
          aria-expanded={historyOpen}
          aria-label={historyOpen ? 'Hide conversation history' : 'Show conversation history'}
          icon="history"
          onClick={() => setHistoryOpen((open) => !open)}
          size="icon"
          variant="ghost"
        />
        <Button aria-label="Start a new chat" icon="plus" onClick={handleNewChat} size="icon" variant="ghost" />
        {onExpand ? (
          <Button
            aria-label="Open the assistant as a full page"
            icon="expand"
            onClick={onExpand}
            size="icon"
            variant="ghost"
          />
        ) : null}
        {onClose ? (
          <Button aria-label="Close the assistant" icon="x" onClick={onClose} size="icon" variant="ghost" />
        ) : null}
      </header>

      <div className="relative flex min-h-0 flex-1">
        {historyOpen ? (
          <ConversationList
            activeId={activeId}
            className={historyClasses}
            conversations={conversations}
            onClose={() => setHistoryOpen(false)}
            onDelete={deleteConversation}
            onSelect={selectConversation}
          />
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {messages.length === 0 && !busy ? (
            <ChatEmptyState onUsePrompt={sendMessage} role={user?.role ?? 'employee'} />
          ) : (
            <MessageList
              assistantName={assistantName}
              busy={busy}
              messages={messages}
              onDecide={handleDecide}
              onRetry={retry}
              onUseSuggestion={sendMessage}
            />
          )}

          {awaiting ? (
            <p className="border-t border-border bg-accent/10 px-3 py-2 text-xs font-medium text-foreground">
              This action needs your confirmation before it runs.
            </p>
          ) : null}

          <ChatComposer
            busy={busy}
            disabled={user === null}
            onSend={sendMessage}
            onStop={stopGenerating}
          />
        </div>
      </div>
    </div>
  );
}
