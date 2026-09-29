import type { AgentConversation } from '../../agent/types';
import { NEW_CHAT_TITLE } from '../../chat/chatState';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) {
    return 'just now';
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export interface ConversationListProps {
  conversations: AgentConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
  className?: string;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onClose,
  className = '',
}: ConversationListProps) {
  return (
    <nav aria-label="Chat history" className={`flex min-h-0 flex-col bg-background ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h3 className="font-heading text-sm font-semibold text-foreground">Conversations</h3>
        {onClose ? (
          <Button aria-label="Hide conversation history" icon="x" onClick={onClose} size="icon" variant="ghost" />
        ) : null}
      </div>

      {conversations.length === 0 ? (
        <p className="px-3 py-4 text-xs text-muted-foreground">
          Conversations you start in this session are listed here.
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
          {conversations.map((conversation) => {
            const selected = conversation.id === activeId;
            return (
              <li className="flex items-stretch gap-1" key={conversation.id}>
                <button
                  aria-current={selected ? 'true' : undefined}
                  className={`min-h-11 min-w-0 flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-left transition-colors duration-200 ${
                    selected
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                  }`}
                  onClick={() => onSelect(conversation.id)}
                  type="button"
                >
                  <span className="block truncate text-xs font-semibold">
                    {conversation.messages.length === 0 ? NEW_CHAT_TITLE : conversation.title}
                  </span>
                  <span className="block text-[0.7rem] text-muted-foreground">
                    {formatRelative(conversation.updatedAt)} · {conversation.messages.length} messages
                  </span>
                </button>
                <Button
                  aria-label={`Delete conversation: ${conversation.title}`}
                  className="self-center"
                  icon="trash"
                  onClick={() => onDelete(conversation.id)}
                  size="icon"
                  variant="ghost"
                />
              </li>
            );
          })}
        </ul>
      )}

      <p className="flex items-start gap-1.5 border-t border-border px-3 py-2 text-[0.7rem] text-muted-foreground">
        <Icon className="mt-0.5 h-3 w-3 shrink-0" name="clock" />
        History is kept in this browser tab only and never leaves your account.
      </p>
    </nav>
  );
}
