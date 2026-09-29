import { ApiError, isApiError } from '../api/errors';
import type {
  AgentClient,
  AgentConfirmationInput,
  AgentEmit,
  AgentEvent,
  AgentTurnInput,
} from './types';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface AgentHttpOptions {
  baseUrl: string;
  fetchImpl?: FetchLike;
}

/**
 * HTTP adapter for the TASK-07 agent API.
 *
 * Contract (mock-first build, swap `VITE_USE_MOCK=false` once TASK-07 merges):
 *   POST {baseUrl}/agent/conversations            -> { id }
 *   POST {baseUrl}/agent/conversations/{id}/messages
 *        body: { message }  -> newline delimited JSON stream of AgentEvent
 *   POST {baseUrl}/agent/conversations/{id}/confirmations/{confirmationId}
 *        body: { decision } -> newline delimited JSON stream of AgentEvent
 */
export function createAgentHttpClient(options: AgentHttpOptions): AgentClient {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const doFetch: FetchLike = options.fetchImpl ?? ((input, init) => fetch(input, init));

  async function stream(
    path: string,
    body: unknown,
    accessToken: string,
    emit: AgentEmit,
    signal?: AbortSignal,
  ): Promise<void> {
    let response: Response;
    try {
      response = await doFetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/x-ndjson',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
        ...(signal ? { signal } : {}),
      });
    } catch (cause) {
      if (isApiError(cause)) {
        throw cause;
      }
      throw new ApiError(0, cause instanceof Error ? cause.message : 'The agent service is unreachable.');
    }

    if (!response.ok) {
      const text = await response.text();
      throw new ApiError(response.status, text.length > 0 ? text : `Agent request failed (${response.status})`);
    }

    if (!response.body) {
      throw new ApiError(500, 'The agent returned an empty stream.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length === 0) {
          continue;
        }
        try {
          emit(JSON.parse(trimmed) as AgentEvent);
        } catch {
          throw new ApiError(502, 'The agent returned an unreadable event.');
        }
      }
    }
  }

  return {
    kind: 'http',

    suggestTitle(text: string): string {
      const cleaned = text.trim().replace(/\s+/g, ' ');
      return cleaned.length <= 44 ? cleaned : `${cleaned.slice(0, 43).trimEnd()}…`;
    },

    async sendTurn(input: AgentTurnInput, emit: AgentEmit, signal?: AbortSignal) {
      emit({ type: 'turn_started' });
      await stream(
        `/agent/conversations/${encodeURIComponent(input.conversationId)}/messages`,
        { message: input.text, message_id: input.messageId },
        input.accessToken,
        emit,
        signal,
      );
    },

    async resolveConfirmation(input: AgentConfirmationInput, emit: AgentEmit, signal?: AbortSignal) {
      emit({ type: 'turn_started' });
      emit({ type: 'confirmation_settled', id: input.confirmation.id, decision: input.decision });
      await stream(
        `/agent/conversations/${encodeURIComponent(input.conversationId)}/confirmations/${encodeURIComponent(
          input.confirmation.id,
        )}`,
        { decision: input.decision },
        input.accessToken,
        emit,
        signal,
      );
    },
  };
}
