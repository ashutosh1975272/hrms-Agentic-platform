import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';

import { agentClient } from '../agent/client';
import type {
  AgentClient,
  AgentConfirmation,
  AgentConversation,
  AgentEvent,
  AgentTurnInput,
} from '../agent/types';
import { useAuth } from '../auth/AuthContext';
import { ChatContext, type ChatContextValue } from './chatContext';
import {
  activeConversation,
  chatReducer,
  createConversation,
  createInitialState,
  lastUserText,
  type ChatState,
} from './chatState';
import { loadConversations, saveConversations } from './chatStorage';

export interface ChatProviderProps {
  children: ReactNode;
  client?: AgentClient;
}

function nowIso(): string {
  return new Date().toISOString();
}

function isAbortError(cause: unknown): boolean {
  return cause instanceof Error && cause.message === 'Aborted';
}

export function ChatProvider({ children, client = agentClient }: ChatProviderProps) {
  const { user, accessToken } = useAuth();
  const [state, dispatch] = useReducer(chatReducer, undefined, createInitialState);
  const stateRef = useRef<ChatState>(state);
  const hydratedFor = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!userId) {
      hydratedFor.current = null;
      dispatch({ type: 'reset' });
      return;
    }
    if (hydratedFor.current === userId) {
      return;
    }
    hydratedFor.current = userId;
    const restored = loadConversations(userId);
    dispatch({ type: 'hydrate', conversations: restored.conversations, activeId: restored.activeId });
  }, [userId]);

  useEffect(() => {
    if (!userId || hydratedFor.current !== userId) {
      return;
    }
    saveConversations(userId, { conversations: state.conversations, activeId: state.activeId });
  }, [userId, state.conversations, state.activeId]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const runTurn = useCallback(
    async (conversation: AgentConversation, text: string, addUserMessage: boolean) => {
      if (!user || !accessToken) {
        return;
      }

      if (addUserMessage) {
        dispatch({
          type: 'user_message',
          conversationId: conversation.id,
          text,
          title: client.suggestTitle(text),
          at: nowIso(),
        });
      }

      const input: AgentTurnInput = {
        accessToken,
        conversationId: conversation.id,
        messageId: `${conversation.id}-${conversation.messages.length + 1}`,
        identity: { userId: user.id, fullName: user.fullName, role: user.role },
        text,
        pending: conversation.pending,
        history: conversation.messages
          .filter((message) => message.text.trim().length > 0)
          .slice(-10)
          .map((message) => ({ role: message.role, text: message.text })),
      };

      const controller = new AbortController();
      abortRef.current = controller;
      const emit = (event: AgentEvent) => {
        dispatch({ type: 'agent_event', conversationId: conversation.id, event, at: nowIso() });
      };

      try {
        await client.sendTurn(input, emit, controller.signal);
      } catch (cause) {
        if (!isAbortError(cause)) {
          dispatch({
            type: 'turn_failed',
            conversationId: conversation.id,
            message: cause instanceof Error ? cause.message : 'The agent request failed.',
            at: nowIso(),
          });
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        dispatch({ type: 'turn_finished' });
      }
    },
    [accessToken, client, user],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length === 0 || stateRef.current.turnStatus !== 'idle' || abortRef.current) {
        return;
      }
      const existing = activeConversation(stateRef.current);
      const conversation = existing ?? createConversation(nowIso());
      if (!existing) {
        dispatch({ type: 'conversation_created', conversation });
      }
      void runTurn(conversation, trimmed, true);
    },
    [runTurn],
  );

  const retry = useCallback(() => {
    if (stateRef.current.turnStatus !== 'idle' || abortRef.current) {
      return;
    }
    const conversation = activeConversation(stateRef.current);
    const text = lastUserText(conversation);
    if (!conversation || !text) {
      return;
    }
    void runTurn(conversation, text, false);
  }, [runTurn]);

  const resolveConfirmation = useCallback(
    (confirmation: AgentConfirmation, decision: 'approved' | 'denied') => {
      if (stateRef.current.turnStatus !== 'idle' || abortRef.current || !user || !accessToken) {
        return;
      }
      const conversation = activeConversation(stateRef.current);
      if (!conversation) {
        return;
      }
      dispatch({
        type: 'confirm_settled',
        conversationId: conversation.id,
        confirmationId: confirmation.id,
        decision,
      });

      const controller = new AbortController();
      abortRef.current = controller;
      const emit = (event: AgentEvent) => {
        dispatch({ type: 'agent_event', conversationId: conversation.id, event, at: nowIso() });
      };

      void client
        .resolveConfirmation(
          {
            accessToken,
            conversationId: conversation.id,
            identity: { userId: user.id, fullName: user.fullName, role: user.role },
            confirmation,
            decision,
          },
          emit,
          controller.signal,
        )
        .catch((cause: unknown) => {
          if (!isAbortError(cause)) {
            dispatch({
              type: 'turn_failed',
              conversationId: conversation.id,
              message: cause instanceof Error ? cause.message : 'The confirmation failed.',
              at: nowIso(),
            });
          }
        })
        .finally(() => {
          if (abortRef.current === controller) {
            abortRef.current = null;
          }
          dispatch({ type: 'turn_finished' });
        });
    },
    [accessToken, client, user],
  );

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: 'turn_finished' });
  }, []);

  const startNewConversation = useCallback(() => {
    if (stateRef.current.turnStatus === 'busy') {
      return;
    }
    const empty = stateRef.current.conversations.find((entry) => entry.messages.length === 0);
    if (empty) {
      dispatch({ type: 'select_conversation', id: empty.id });
      return;
    }
    dispatch({ type: 'conversation_created', conversation: createConversation(nowIso()) });
  }, []);

  const selectConversation = useCallback((id: string) => {
    dispatch({ type: 'select_conversation', id });
  }, []);

  const deleteConversation = useCallback((id: string) => {
    dispatch({ type: 'delete_conversation', id });
  }, []);

  const dismissError = useCallback(() => {
    dispatch({ type: 'dismiss_error' });
  }, []);

  const value = useMemo<ChatContextValue>(() => {
    const conversation = activeConversation(state);
    let lastFailedMessage = null;
    if (conversation) {
      for (let index = conversation.messages.length - 1; index >= 0; index -= 1) {
        const message = conversation.messages[index];
        if (message.role === 'assistant' && message.status === 'failed') {
          lastFailedMessage = message;
          break;
        }
      }
    }
    return {
      conversations: state.conversations,
      activeId: state.activeId,
      conversation,
      turnStatus: state.turnStatus,
      lastError: state.lastError,
      clientKind: client.kind,
      sendMessage,
      retry,
      resolveConfirmation,
      stopGenerating,
      startNewConversation,
      selectConversation,
      deleteConversation,
      dismissError,
      lastFailedMessage,
    };
  }, [
    client.kind,
    deleteConversation,
    dismissError,
    resolveConfirmation,
    retry,
    selectConversation,
    sendMessage,
    startNewConversation,
    state,
    stopGenerating,
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
