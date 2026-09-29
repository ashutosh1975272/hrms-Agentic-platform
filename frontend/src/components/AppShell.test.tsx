import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { createMockAdapter } from '../api/mockAdapter';
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext';
import { AppShell } from './AppShell';

function signIn(token: string) {
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accessToken: token }));
}

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider client={createMockAdapter()}>
        <Routes>
          <Route path="/login" element={<p>login screen</p>} />
          <Route
            path="*"
            element={
              <AppShell>
                <p>page body</p>
              </AppShell>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe('AppShell', () => {
  it('shows the signed-in user name and role', async () => {
    signIn('mock-token-usr-emp-1');
    renderShell();

    expect(await screen.findByText('Rahul Kumar')).toBeInTheDocument();
    expect(screen.getByText('Employee')).toBeInTheDocument();
  });

  it('exposes a skip link and a main landmark', async () => {
    signIn('mock-token-usr-emp-1');
    renderShell();

    expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument();
    expect(await screen.findByRole('main')).toHaveTextContent('page body');
  });

  it('shows only the dashboards the role may open', async () => {
    signIn('mock-token-usr-emp-1');
    renderShell();
    await screen.findByText('Rahul Kumar');
    const nav = screen.getByRole('navigation', { name: /dashboards/i });

    expect(nav).toHaveTextContent('My dashboard');
    expect(nav).not.toHaveTextContent('HR workspace');
    expect(nav).not.toHaveTextContent('Admin console');
  });

  it('lets an admin reach every dashboard', async () => {
    signIn('mock-token-usr-admin-1');
    renderShell();
    await screen.findByText('Aarav Menon');
    const nav = screen.getByRole('navigation', { name: /dashboards/i });

    expect(nav).toHaveTextContent('My dashboard');
    expect(nav).toHaveTextContent('HR workspace');
    expect(nav).toHaveTextContent('Admin console');
  });

  it('signs the user out and returns to the login screen', async () => {
    const user = userEvent.setup();
    signIn('mock-token-usr-emp-1');
    renderShell();

    await user.click(await screen.findByRole('button', { name: /sign out/i }));

    expect(await screen.findByText('login screen')).toBeInTheDocument();
    expect(window.sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});
