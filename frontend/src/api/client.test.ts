import { describe, expect, it } from 'vitest';

import { ApiError, createApiClient, resolveUseMock } from './client';
import { createMockAdapter } from './mockAdapter';
import { createHttpAdapter } from './httpAdapter';

const MOCK_CREDENTIALS = {
  email: 'employee@agentichrms.test',
  password: 'demo-pass-1',
};

describe('mock adapter', () => {
  it('authenticates seeded demo users and returns a bearer token', async () => {
    const api = createMockAdapter();

    const session = await api.login(MOCK_CREDENTIALS);

    expect(session.user.email).toBe(MOCK_CREDENTIALS.email);
    expect(session.user.role).toBe('employee');
    expect(session.accessToken).toEqual(expect.any(String));
  });

  it('rejects a wrong password with a 401 ApiError', async () => {
    const api = createMockAdapter();

    await expect(
      api.login({ email: MOCK_CREDENTIALS.email, password: 'not-the-password' }),
    ).rejects.toMatchObject({ status: 401, message: 'Invalid email or password' });
  });

  it('rejects an unknown email with the same 401 error', async () => {
    const api = createMockAdapter();

    await expect(
      api.login({ email: 'nobody@agentichrms.test', password: 'demo-pass-1' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('resolves the signed-in user from the access token', async () => {
    const api = createMockAdapter();
    const session = await api.login(MOCK_CREDENTIALS);

    const user = await api.me(session.accessToken);

    expect(user.email).toBe(MOCK_CREDENTIALS.email);
  });

  it('rejects an unknown access token', async () => {
    const api = createMockAdapter();

    await expect(api.me('tampered-token')).rejects.toMatchObject({ status: 401 });
  });

  it('lets admins and HR list all employees', async () => {
    const api = createMockAdapter();
    const hr = await api.login({ email: 'hr@agentichrms.test', password: 'demo-pass-1' });

    const employees = await api.listEmployees(hr.accessToken);

    expect(employees.length).toBeGreaterThan(1);
    expect(employees[0]).toEqual(
      expect.objectContaining({ id: expect.any(String), department: expect.any(String) }),
    );
  });

  it('limits an employee to their own record when listing employees', async () => {
    const api = createMockAdapter();
    const employee = await api.login(MOCK_CREDENTIALS);

    const employees = await api.listEmployees(employee.accessToken);

    expect(employees).toHaveLength(1);
    expect(employees[0].email).toBe(MOCK_CREDENTIALS.email);
  });

  it('returns the leave balance of the signed-in employee', async () => {
    const api = createMockAdapter();
    const employee = await api.login(MOCK_CREDENTIALS);

    const balance = await api.getLeaveBalance(employee.accessToken);

    expect(balance.length).toBeGreaterThan(0);
    expect(balance[0]).toEqual(
      expect.objectContaining({ leaveType: expect.any(String), remaining: expect.any(Number) }),
    );
  });
});

describe('use mock flag', () => {
  it('defaults to mock mode when the flag is absent', () => {
    expect(resolveUseMock({})).toBe(true);
  });

  it('reads true, 1, on and yes as enabled', () => {
    expect(resolveUseMock({ USE_MOCK: 'true' })).toBe(true);
    expect(resolveUseMock({ VITE_USE_MOCK: '1' })).toBe(true);
    expect(resolveUseMock({ VITE_USE_MOCK: 'on' })).toBe(true);
    expect(resolveUseMock({ VITE_USE_MOCK: 'yes' })).toBe(true);
  });

  it('reads false, 0, off and no as disabled', () => {
    expect(resolveUseMock({ VITE_USE_MOCK: 'false' })).toBe(false);
    expect(resolveUseMock({ USE_MOCK: '0' })).toBe(false);
    expect(resolveUseMock({ VITE_USE_MOCK: 'off' })).toBe(false);
    expect(resolveUseMock({ VITE_USE_MOCK: 'no' })).toBe(false);
  });
});

describe('createApiClient', () => {
  it('builds a mock client when mock mode is enabled', async () => {
    const api = createApiClient({ useMock: true });

    const session = await api.login(MOCK_CREDENTIALS);

    expect(session.user.role).toBe('employee');
  });

  it('builds an http client when mock mode is disabled', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const api = createApiClient({
      useMock: false,
      baseUrl: 'http://api.test/api',
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return new Response(JSON.stringify({ access_token: 'jwt', user: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    });

    await api.login(MOCK_CREDENTIALS);

    expect(calls[0].url).toBe('http://api.test/api/auth/login');
    expect(calls[0].init?.method).toBe('POST');
  });
});

describe('http adapter', () => {
  it('sends the access token as a bearer authorization header', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const api = createHttpAdapter({
      baseUrl: 'http://api.test/api',
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return new Response(JSON.stringify({ id: 'emp-1', email: 'a@b.test' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    });

    await api.listEmployees('jwt-token');

    const headers = calls[0].init?.headers as Record<string, string>;
    expect(calls[0].url).toBe('http://api.test/api/employees');
    expect(headers.Authorization).toBe('Bearer jwt-token');
  });

  it('maps a backend error payload into an ApiError', async () => {
    const api = createHttpAdapter({
      baseUrl: 'http://api.test/api',
      fetchImpl: async () =>
        new Response(JSON.stringify({ detail: 'Not enough permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }),
    });

    await expect(api.me('jwt-token')).rejects.toMatchObject({
      status: 403,
      message: 'Not enough permissions',
    });
  });

  it('surfaces a fallback message when the error body is not json', async () => {
    const api = createHttpAdapter({
      baseUrl: 'http://api.test/api',
      fetchImpl: async () => new Response('gateway down', { status: 502 }),
    });

    await expect(api.me('jwt-token')).rejects.toMatchObject({ status: 502 });
  });
});
