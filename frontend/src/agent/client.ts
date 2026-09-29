import { resolveUseMock } from '../api/client';
import { createAgentHttpClient } from './httpAgent';
import { createMockAgentClient } from './mockAgent';
import type { AgentClient } from './types';

export type * from './types';

export const DEFAULT_AGENT_BASE_URL = '/api';

export interface AgentClientOptions {
  useMock?: boolean;
  baseUrl?: string;
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>;
  /** Stream delay used by the mock adapter; tests pass 0. */
  mockDelayMs?: number;
}

export function createAgentClient(options: AgentClientOptions = {}): AgentClient {
  if (options.useMock ?? true) {
    return createMockAgentClient({ delayMs: options.mockDelayMs ?? 260 });
  }
  return createAgentHttpClient({
    baseUrl: options.baseUrl ?? DEFAULT_AGENT_BASE_URL,
    ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
  });
}

export const agentClient: AgentClient = createAgentClient({
  useMock: resolveUseMock(import.meta.env),
});
