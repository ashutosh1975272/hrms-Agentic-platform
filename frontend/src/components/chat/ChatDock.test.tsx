import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { createMockAdapter } from '../../api/mockAdapter';
import { createMockAgentClient } from '../../agent/mockAgent';
import { AuthProvider, SESSION_STORAGE_KEY } from '../../auth/AuthContext';
import { ChatProvider } from '../../chat/ChatProvider';
import { ChatDockHost } from './ChatDockHost';

function signIn(role: 'emp' | 'hr') {
  const token = role === 'hr' ? 'mock-token-usr-hr-1' : 'mock-token-usr-emp-1';
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accessToken: token }));
}

/** jsdom has no layout engine, so the viewport is driven explicitly. */
function setDesktop(isDesktop: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: isDesktop && query.includes('min-width'),
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

function renderHost(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider client={createMockAdapter()}>
        <ChatProvider client={createMockAgentClient({ delayMs: 0 })}>
          <Routes>
            <Route path="*" element={<ChatDockHost />} />
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
  setDesktop(false);
});

describe('Chat dock', () => {
  it('opens as a modal drawer below 1024px and closes on Escape, returning focus', async () => {
    const user = userEvent.setup();
    signIn('emp');
    renderHost();

    const launcher = await screen.findByRole('button', { name: /open the ai assistant/i });
    await user.click(launcher);

    const dialog = await screen.findByRole('dialog', { name: /ai assistant/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('textbox', { name: /message the hr assistant/i })).toBeInTheDocument();
    expect(launcher).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(launcher).toHaveFocus();
  });

  it('renders as a docked sidebar complement from 1024px up', async () => {
    setDesktop(true);
    const user = userEvent.setup();
    signIn('emp');
    renderHost();

    await user.click(await screen.findByRole('button', { name: /open the ai assistant/i }));

    expect(await screen.findByRole('complementary', { name: /ai assistant/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('steps the launcher aside for the full page chat view', async () => {
    signIn('emp');
    renderHost('/chat');

    await waitFor(() => expect(screen.queryByRole('button', { name: /ai assistant/i })).toBeNull());
  });

  it('expands the dock into the full page route', async () => {
    const user = userEvent.setup();
    signIn('emp');
    renderHost('/dashboard');

    await user.click(await screen.findByRole('button', { name: /open the ai assistant/i }));
    await screen.findByRole('dialog', { name: /ai assistant/i });

    await user.click(screen.getByRole('button', { name: /open the assistant as a full page/i }));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /open the ai assistant/i })).toBeNull(),
    );
  });

  it('flags the launcher when a confirmation is waiting for a decision', async () => {
    const user = userEvent.setup();
    signIn('hr');
    renderHost();

    const launcher = await screen.findByRole('button', { name: /open the ai assistant/i });
    expect(screen.queryByLabelText(/needs your confirmation/i)).toBeNull();

    await user.click(launcher);
    const field = await screen.findByRole('textbox', { name: /message the hr assistant/i });
    await user.type(field, 'Delete employee Sana Rao');
    await user.keyboard('{Enter}');

    await screen.findByRole('region', { name: /confirmation required: delete employee record/i });
    expect(screen.getByLabelText(/needs your confirmation/i)).toBeInTheDocument();
  });
});
