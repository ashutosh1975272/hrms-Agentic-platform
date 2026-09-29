import { createContext } from 'react';

import type {
  AgentClient,
  AgentConfirmation,
  AgentConversation,
  AgentMessage,
} from '../agent/types';
import type { ChatTurnStatus } from './chatState';

export interface ChatContextValue {
  conversations: AgentConversation[];
  activeId: string | null;
  conversation: AgentConversation | null;
  turnStatus: ChatTurnStatus;
  lastError: string | null;
  clientKind: AgentClient['kind'];
  sendMessage: (text: string) => void;
  retry: () => void;
  resolveConfirmation: (confirmation: AgentConfirmation, decision: 'approved' | 'denied') => void;
  stopGenerating: () => void;
  startNewConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  dismissError: () => void;
  lastFailedMessage: AgentMessage | null;
}

export const ChatContext = createContext<ChatContextValue | null>(null);
