import type { AgentConversation, AgentMessage } from '../agent/types';
import { MAX_CONVERSATIONS, MAX_MESSAGES_PER_CONVERSATION } from './chatState';

/**
 * Conversation memory is scoped to the signed-in user and to the browser tab
 * (PROJECT.md §15: short-term context, never leaks across sessions).
 */
export const CHAT_STORAGE_PREFIX = 'agentic-hrms.chat.';

export function storageKeyFor(userId: string): string {
  return `${CHAT_STORAGE_PREFIX}${userId}`;
}

interface PersistedChat {
  conversations: AgentConversation[];
  activeId: string | null;
}

function isConversation(value: unknown): value is AgentConversation {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<AgentConversation>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    Array.isArray(candidate.messages)
  );
}

/** A stream interrupted by a reload must not stay "streaming" forever. */
function settleMessages(conversation: AgentConversation): AgentConversation {
  return {
    ...conversation,
    messages: conversation.messages.slice(-MAX_MESSAGES_PER_CONVERSATION).map((message) => {
      if (message.role !== 'assistant' || message.status !== 'streaming') {
        return message;
      }
      return {
        ...message,
        status: 'failed',
        error: {
          message: 'The response was interrupted. Retry to run the request again.',
          retryable: true,
        },
      } satisfies AgentMessage;
    }),
  };
}

export function loadConversations(userId: string): PersistedChat {
  const empty: PersistedChat = { conversations: [], activeId: null };
  try {
    const raw = window.sessionStorage.getItem(storageKeyFor(userId));
    if (!raw) {
      return empty;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return empty;
    }
    const payload = parsed as Partial<PersistedChat>;
    const conversations = Array.isArray(payload.conversations)
      ? payload.conversations.filter(isConversation).slice(0, MAX_CONVERSATIONS).map(settleMessages)
      : [];
    const activeId =
      typeof payload.activeId === 'string' &&
      conversations.some((entry) => entry.id === payload.activeId)
        ? payload.activeId
        : (conversations[0]?.id ?? null);
    return { conversations, activeId };
  } catch {
    return empty;
  }
}

export function saveConversations(userId: string, payload: PersistedChat): void {
  try {
    window.sessionStorage.setItem(storageKeyFor(userId), JSON.stringify(payload));
  } catch {
    return;
  }
}

export function clearConversations(userId: string): void {
  try {
    window.sessionStorage.removeItem(storageKeyFor(userId));
  } catch {
    return;
  }
}
