import type {
  AgentConfirmation,
  AgentConversation,
  AgentEvent,
  AgentMessage,
  AgentToolCall,
} from '../agent/types';

export type ChatTurnStatus = 'idle' | 'busy';

export interface ChatState {
  conversations: AgentConversation[];
  activeId: string | null;
  turnStatus: ChatTurnStatus;
  /** Transient failure that broke a turn (the message itself keeps its own copy). */
  lastError: string | null;
}

export const NEW_CHAT_TITLE = 'New chat';

export const MAX_CONVERSATIONS = 12;
export const MAX_MESSAGES_PER_CONVERSATION = 60;

let idCounter = 0;

function nextId(prefix: string): string {
  idCounter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${idCounter}-${random}`;
}

export function createMessage(
  role: AgentMessage['role'],
  text: string,
  at: string,
  status: AgentMessage['status'] = 'complete',
): AgentMessage {
  return {
    id: nextId(role === 'user' ? 'msg-u' : 'msg-a'),
    role,
    text,
    createdAt: at,
    status,
    toolCalls: [],
    citations: [],
    confirmation: null,
    confirmationState: 'none',
    suggestions: [],
    error: null,
  };
}

export function createConversation(at: string): AgentConversation {
  return {
    id: nextId('conv'),
    title: NEW_CHAT_TITLE,
    createdAt: at,
    updatedAt: at,
    messages: [],
    pending: null,
  };
}

export function createInitialState(): ChatState {
  return { conversations: [], activeId: null, turnStatus: 'idle', lastError: null };
}

function replaceConversation(
  state: ChatState,
  conversation: AgentConversation,
): ChatState {
  return {
    ...state,
    conversations: state.conversations.map((entry) =>
      entry.id === conversation.id ? conversation : entry,
    ),
  };
}

function mapActive(
  state: ChatState,
  conversationId: string,
  update: (conversation: AgentConversation) => AgentConversation,
): ChatState {
  const target = state.conversations.find((entry) => entry.id === conversationId);
  if (!target) {
    return state;
  }
  return replaceConversation(state, update(target));
}

function upsertToolCall(calls: AgentToolCall[], incoming: AgentToolCall): AgentToolCall[] {
  const index = calls.findIndex((call) => call.id === incoming.id);
  if (index === -1) {
    return [...calls, incoming];
  }
  const next = [...calls];
  next[index] = incoming;
  return next;
}

function patchStreamingMessage(
  message: AgentMessage,
  event: AgentEvent,
  at: string,
): AgentMessage {
  const next: AgentMessage = { ...message };
  switch (event.type) {
    case 'turn_started':
      break;
    case 'tool':
      next.toolCalls = upsertToolCall(next.toolCalls, event.call);
      break;
    case 'tool_settled': {
      next.toolCalls = next.toolCalls.map((call) =>
        call.id === event.id
          ? { ...call, status: event.status, ...(event.detail ? { detail: event.detail } : {}) }
          : call,
      );
      break;
    }
    case 'delta':
      next.text = `${next.text}${event.text}`;
      break;
    case 'citations':
      next.citations = event.citations;
      break;
    case 'confirmation':
      next.confirmation = event.confirmation;
      next.confirmationState = 'awaiting';
      break;
    case 'suggestions':
      next.suggestions = event.suggestions;
      break;
    case 'error':
      next.status = 'failed';
      next.error = { message: event.message, retryable: event.retryable };
      break;
    case 'done':
      next.status = 'complete';
      break;
    default:
      break;
  }
  next.createdAt = next.createdAt || at;
  return next;
}

function applyEvent(
  conversation: AgentConversation,
  event: AgentEvent,
  at: string,
): AgentConversation {
  if (event.type === 'confirmation_settled') {
    return {
      ...conversation,
      updatedAt: at,
      messages: conversation.messages.map((message) =>
        message.confirmation?.id === event.id
          ? { ...message, confirmationState: event.decision }
          : message,
      ),
    };
  }

  if (event.type === 'turn_started') {
    return {
      ...conversation,
      updatedAt: at,
      messages: [
        ...conversation.messages,
        createMessage('assistant', '', at, 'streaming'),
      ],
    };
  }

  const lastIndex = findStreamingIndex(conversation);
  if (lastIndex === -1) {
    return conversation;
  }

  const messages = [...conversation.messages];
  messages[lastIndex] = patchStreamingMessage(messages[lastIndex], event, at);
  const patch: AgentConversation = { ...conversation, messages, updatedAt: at };
  if (event.type === 'done') {
    patch.pending = event.pending;
  }
  return patch;
}

function findStreamingIndex(conversation: AgentConversation): number {
  for (let index = conversation.messages.length - 1; index >= 0; index -= 1) {
    const message = conversation.messages[index];
    if (message.role === 'assistant' && message.status === 'streaming') {
      return index;
    }
  }
  return -1;
}

export type ChatAction =
  | { type: 'hydrate'; conversations: AgentConversation[]; activeId: string | null }
  | { type: 'reset' }
  | { type: 'conversation_created'; conversation: AgentConversation }
  | { type: 'select_conversation'; id: string }
  | { type: 'delete_conversation'; id: string }
  | { type: 'user_message'; conversationId: string; text: string; title: string; at: string }
  | { type: 'agent_event'; conversationId: string; event: AgentEvent; at: string }
  | { type: 'confirm_settled'; conversationId: string; confirmationId: string; decision: 'approved' | 'denied' }
  | { type: 'turn_failed'; conversationId: string; message: string; at: string }
  | { type: 'turn_finished' }
  | { type: 'dismiss_error' };

function trimConversation(conversation: AgentConversation): AgentConversation {
  if (conversation.messages.length <= MAX_MESSAGES_PER_CONVERSATION) {
    return conversation;
  }
  return {
    ...conversation,
    messages: conversation.messages.slice(-MAX_MESSAGES_PER_CONVERSATION),
  };
}

function orderConversations(conversations: AgentConversation[]): AgentConversation[] {
  return [...conversations]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, MAX_CONVERSATIONS);
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'hydrate': {
      const conversations = orderConversations(action.conversations);
      const activeId =
        action.activeId && conversations.some((entry) => entry.id === action.activeId)
          ? action.activeId
          : (conversations[0]?.id ?? null);
      return { ...state, conversations, activeId, turnStatus: 'idle', lastError: null };
    }

    case 'reset':
      return createInitialState();

    case 'conversation_created': {
      const conversations = orderConversations([
        action.conversation,
        ...state.conversations.filter((entry) => entry.id !== action.conversation.id),
      ]);
      return {
        ...state,
        conversations,
        activeId: action.conversation.id,
        turnStatus: 'idle',
        lastError: null,
      };
    }

    case 'select_conversation':
      return state.conversations.some((entry) => entry.id === action.id)
        ? { ...state, activeId: action.id, lastError: null }
        : state;

    case 'delete_conversation': {
      const conversations = state.conversations.filter((entry) => entry.id !== action.id);
      const activeId = state.activeId === action.id ? (conversations[0]?.id ?? null) : state.activeId;
      return { ...state, conversations, activeId };
    }

    case 'user_message': {
      const message = createMessage('user', action.text, action.at);
      const next = mapActive(state, action.conversationId, (conversation) => {
        const titled =
          conversation.messages.length === 0 ? { ...conversation, title: action.title } : conversation;
        return trimConversation({
          ...titled,
          updatedAt: action.at,
          messages: [...titled.messages, message],
        });
      });
      return { ...next, lastError: null };
    }

    case 'agent_event': {
      const next = mapActive(state, action.conversationId, (conversation) =>
        trimConversation(applyEvent(conversation, action.event, action.at)),
      );
      const settled =
        action.event.type === 'done' || action.event.type === 'error'
          ? { turnStatus: 'idle' as const, lastError: null }
          : { turnStatus: 'busy' as const };
      return { ...next, ...settled };
    }

    case 'confirm_settled': {
      const next = mapActive(state, action.conversationId, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
          message.confirmation?.id === action.confirmationId
            ? { ...message, confirmationState: action.decision }
            : message,
        ),
      }));
      return { ...next, turnStatus: 'busy' };
    }

    case 'turn_failed': {
      const next = mapActive(state, action.conversationId, (conversation) => {
        const index = findStreamingIndex(conversation);
        if (index === -1) {
          return conversation;
        }
        const messages = [...conversation.messages];
        messages[index] = {
          ...messages[index],
          status: 'failed',
          error: { message: action.message, retryable: true },
        };
        return { ...conversation, messages, updatedAt: action.at };
      });
      return { ...next, turnStatus: 'idle', lastError: action.message };
    }

    case 'turn_finished':
      return { ...state, turnStatus: 'idle' };

    case 'dismiss_error':
      return { ...state, lastError: null };

    default:
      return state;
  }
}

export function activeConversation(state: ChatState): AgentConversation | null {
  if (!state.activeId) {
    return null;
  }
  return state.conversations.find((entry) => entry.id === state.activeId) ?? null;
}

export function lastUserText(conversation: AgentConversation | null): string | null {
  if (!conversation) {
    return null;
  }
  for (let index = conversation.messages.length - 1; index >= 0; index -= 1) {
    const message = conversation.messages[index];
    if (message.role === 'user') {
      return message.text;
    }
  }
  return null;
}

export function pendingConfirmation(
  conversation: AgentConversation | null,
): AgentConfirmation | null {
  if (!conversation) {
    return null;
  }
  for (let index = conversation.messages.length - 1; index >= 0; index -= 1) {
    const message = conversation.messages[index];
    if (message.confirmation && message.confirmationState === 'awaiting') {
      return message.confirmation;
    }
  }
  return null;
}
