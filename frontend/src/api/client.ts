import { createHttpAdapter } from './httpAdapter';
import { createMockAdapter } from './mockAdapter';
import type { ApiClient } from './types';

export { ApiError, isApiError } from './errors';
export type * from './types';

type EnvLike = Record<string, string | boolean | undefined>;

const TRUTHY = new Set(['true', '1', 'on', 'yes']);
const FALSY = new Set(['false', '0', 'off', 'no']);

export function resolveUseMock(env: EnvLike): boolean {
  const raw = env.VITE_USE_MOCK ?? env.USE_MOCK;
  if (raw === undefined || raw === null) {
    return true;
  }
  const value = String(raw).trim().toLowerCase();
  if (TRUTHY.has(value)) {
    return true;
  }
  if (FALSY.has(value)) {
    return false;
  }
  return true;
}

export interface ApiClientOptions {
  useMock?: boolean;
  baseUrl?: string;
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>;
  mockLatencyMs?: number;
}

export const DEFAULT_BASE_URL = '/api';

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  if (options.useMock ?? true) {
    return createMockAdapter(options.mockLatencyMs ?? 0);
  }
  return createHttpAdapter({
    baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
    ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
  });
}

export const api: ApiClient = createApiClient({ useMock: resolveUseMock(import.meta.env) });
