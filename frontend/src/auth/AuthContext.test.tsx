import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { createMockAdapter } from '../api/mockAdapter';
import { AuthProvider, SESSION_STORAGE_KEY, useAuth } from './AuthContext';
import { RequireRole } from './RequireRole';
import { homeRouteForRole } from './roles';

const EMPLOYEE = { email: 'employee@agentichrms.test', password: 'demo-pass-1' };
const ADMIN = { email: 'admin@agentichrms.test', password: 'demo-pass-1' };
const HR = { email: 'hr@agentichrms.test', password: 'demo-pass-1' };

function TestNav() {
  return (
    <nav aria-label="test nav">
      <Link to="/dashboard">Open employee dashboard</Link>
      <Link to="/hr">Open hr dashboard</Link>
      <Link to="/admin">Open admin dashboard</Link>
    </nav>
  );
}

function LoginHarness() {
  const { login } = useAuth();
  return (
    <div>
      <p>login screen</p>
      <button type="button" onClick={() => void login(EMPLOYEE)}>
        Sign in as employee
      </button>
      <button type="button" onClick={() => void login(HR)}>
        Sign in as hr
      </button>
      <button type="button" onClick={() => void login(ADMIN)}>
        Sign in as {ADMIN.email}
      </button>
    </div>
  );
}

function renderAuth(initialEntries: string[] = ['/dashboard']) {
  const client = createMockAdapter();
  const view = render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider client={client}>
        <TestNav />
        <Routes>
          <Route path="/login" element={<LoginHarness />} />
          <Route
            path="/dashboard"
            element={
              <RequireRole allowed={['employee']}>
                <p>employee dashboard</p>
              </RequireRole>
            }
          />
          <Route
            path="/hr"
            element={
              <RequireRole allowed={['hr', 'admin']}>
                <p>hr dashboard</p>
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole allowed={['admin']}>
                <p>admin dashboard</p>
              </RequireRole>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
  return { ...view, client };
}

function Probe() {
  const { status, user, login, logout } = useAuth();
  const [error, setError] = useState('');
  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="role">{user?.role ?? 'none'}</p>
      <p data-testid="error">{error}</p>
      <button type="button" onClick={() => void login(EMPLOYEE)}>
        login
      </button>
      <button
        type="button"
        onClick={() => {
          void login({ email: 'x@y.test', password: 'nope' }).catch((cause: unknown) => {
            setError(cause instanceof Error ? cause.message : 'unknown error');
          });
        }}
      >
        bad login
      </button>
      <button type="button" onClick={() => void logout()}>
        logout
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <MemoryRouter>
      <AuthProvider client={createMockAdapter()}>
        <Probe />
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe('role routing', () => {
  it('sends each role to its own home route', () => {
    expect(homeRouteForRole('employee')).toBe('/dashboard');
    expect(homeRouteForRole('hr')).toBe('/hr');
    expect(homeRouteForRole('admin')).toBe('/admin');
  });
});

describe('auth context', () => {
  it('starts as anonymous with no user', async () => {
    renderProbe();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
    expect(screen.getByTestId('role')).toHaveTextContent('none');
  });

  it('authenticates a valid user and exposes the role', async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('role')).toHaveTextContent('employee');
  });

  it('persists the access token in session storage after login', async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() =>
      expect(window.sessionStorage.getItem(SESSION_STORAGE_KEY)).toContain('mock-token-'),
    );
  });

  it('keeps the session anonymous and throws on invalid credentials', async () => {
    const user = userEvent.setup();
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));

    await user.click(screen.getByRole('button', { name: 'bad login' }));

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent(/invalid/i));
    expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
    expect(window.sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('clears the stored session on logout', async () => {
    const user = userEvent.setup();
    renderProbe();
    await user.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    await user.click(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
    expect(window.sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('restores a stored session on mount', async () => {
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ accessToken: 'mock-token-usr-emp-1' }),
    );
    renderProbe();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('role')).toHaveTextContent('employee');
  });

  it('discards a stored token the backend rejects', async () => {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accessToken: 'expired' }));
    renderProbe();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
    expect(window.sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});

describe('RequireRole', () => {
  it('redirects an anonymous visitor to the login screen', async () => {
    renderAuth();

    expect(await screen.findByText('login screen')).toBeInTheDocument();
  });

  it('renders the employee dashboard for an employee', async () => {
    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByRole('button', { name: 'Sign in as employee' }));
    await screen.findByText('login screen');
    await user.click(screen.getByRole('link', { name: 'Open employee dashboard' }));

    expect(await screen.findByText('employee dashboard')).toBeInTheDocument();
  });

  it('blocks an employee from the admin dashboard', async () => {
    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByRole('button', { name: 'Sign in as employee' }));
    await screen.findByText('login screen');
    await user.click(screen.getByRole('link', { name: 'Open admin dashboard' }));

    expect(await screen.findByText('employee dashboard')).toBeInTheDocument();
    expect(screen.queryByText('admin dashboard')).not.toBeInTheDocument();
  });

  it('lets hr open the hr dashboard but not the admin dashboard', async () => {
    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByRole('button', { name: 'Sign in as hr' }));
    await screen.findByText('login screen');
    await user.click(screen.getByRole('link', { name: 'Open hr dashboard' }));
    expect(await screen.findByText('hr dashboard')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Open admin dashboard' }));
    expect(await screen.findByText('hr dashboard')).toBeInTheDocument();
  });

  it('lets admin open the admin dashboard', async () => {
    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByRole('button', { name: `Sign in as ${ADMIN.email}` }));
    await screen.findByText('login screen');
    await user.click(screen.getByRole('link', { name: 'Open admin dashboard' }));

    expect(await screen.findByText('admin dashboard')).toBeInTheDocument();
  });
});
