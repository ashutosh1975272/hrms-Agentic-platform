import { ApiError } from './errors';
import type {
  AdminDashboardData,
  ApiClient,
  Employee,
  EmployeeDashboardData,
  HrDashboardData,
  LoginCredentials,
  Session,
  User,
} from './types';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface HttpAdapterOptions {
  baseUrl: string;
  fetchImpl?: FetchLike;
}

interface AuthResponse {
  access_token?: string;
  token_type?: string;
  user?: User;
}

function readErrorDetail(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === 'string' && detail.length > 0) {
      return detail;
    }
  }
  return `Request failed with status ${status}`;
}

export function createHttpAdapter(options: HttpAdapterOptions): ApiClient {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const doFetch: FetchLike = options.fetchImpl ?? ((input, init) => fetch(input, init));

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    };
    if (init.body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await doFetch(`${baseUrl}${path}`, { ...init, headers });
    const text = await response.text();
    let payload: unknown = null;
    if (text.length > 0) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      throw new ApiError(response.status, readErrorDetail(payload, response.status));
    }
    return payload as T;
  }

  const authorized = (accessToken: string): Record<string, string> => ({
    Authorization: `Bearer ${accessToken}`,
  });

  return {
    async login(credentials: LoginCredentials) {
      const payload = await request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      const accessToken = payload.access_token;
      if (!accessToken) {
        throw new ApiError(500, 'Login response did not contain an access token');
      }
      const session: Session = {
        accessToken,
        tokenType: 'bearer',
        user: payload.user as User,
      };
      return session;
    },

    me(accessToken) {
      return request<User>('/auth/me', { headers: authorized(accessToken) });
    },

    listEmployees(accessToken) {
      return request<Employee[]>('/employees', { headers: authorized(accessToken) });
    },

    getLeaveBalance(accessToken) {
      return request('/leaves/balance', { headers: authorized(accessToken) });
    },

    getEmployeeDashboard(accessToken) {
      return request<EmployeeDashboardData>('/dashboard/employee', {
        headers: authorized(accessToken),
      });
    },

    getHrDashboard(accessToken) {
      return request<HrDashboardData>('/dashboard/hr', { headers: authorized(accessToken) });
    },

    getAdminDashboard(accessToken) {
      return request<AdminDashboardData>('/dashboard/admin', { headers: authorized(accessToken) });
    },
  };
}
