import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { SESSION_STORAGE_KEY } from './auth/AuthContext';
import { App } from './App';

function signIn(token: string) {
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accessToken: token }));
}

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe('App routing', () => {
  it('sends an anonymous visitor to the login page', async () => {
    renderApp();

    expect(await screen.findByRole('heading', { level: 1, name: /agentic hrms/i })).toBeInTheDocument();
  });

  it('lands an employee on the employee dashboard', async () => {
    signIn('mock-token-usr-emp-1');
    renderApp();

    expect(
      await screen.findByRole('heading', { level: 1, name: /employee dashboard/i }),
    ).toBeInTheDocument();
  });

  it('lands hr on the hr dashboard', async () => {
    signIn('mock-token-usr-hr-1');
    renderApp();

    expect(await screen.findByRole('heading', { level: 1, name: /hr dashboard/i })).toBeInTheDocument();
  });

  it('lands admin on the admin dashboard', async () => {
    signIn('mock-token-usr-admin-1');
    renderApp();

    expect(await screen.findByRole('heading', { level: 1, name: /admin dashboard/i })).toBeInTheDocument();
  });

  it('keeps an employee out of the admin console', async () => {
    signIn('mock-token-usr-emp-1');
    renderApp('/admin');

    expect(
      await screen.findByRole('heading', { level: 1, name: /employee dashboard/i }),
    ).toBeInTheDocument();
  });

  it('shows a not-found page with a way back for an unknown route', async () => {
    const user = userEvent.setup();
    signIn('mock-token-usr-emp-1');
    renderApp('/does-not-exist');

    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /go to my dashboard/i }));

    expect(
      await screen.findByRole('heading', { level: 1, name: /employee dashboard/i }),
    ).toBeInTheDocument();
  });
});
