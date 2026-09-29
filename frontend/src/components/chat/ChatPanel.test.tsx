import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { createMockAdapter } from '../../api/mockAdapter';
import { createMockAgentClient } from '../../agent/mockAgent';
import { AuthProvider, SESSION_STORAGE_KEY } from '../../auth/AuthContext';
import { ChatProvider } from '../../chat/ChatProvider';
import { ChatPanel } from './ChatPanel';

const TOKENS = {
  employee: 'mock-token-usr-emp-1',
  hr: 'mock-token-usr-hr-1',
  admin: 'mock-token-usr-admin-1',
};

type Role = keyof typeof TOKENS;

// React 19 requires this flag before `act` can drive the streamed agent updates.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function signIn(role: Role) {
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accessToken: TOKENS[role] }));
}

function renderChat() {
  return render(
    <MemoryRouter>
      <AuthProvider client={createMockAdapter()}>
        <ChatProvider client={createMockAgentClient({ delayMs: 0 })}>
          <ChatPanel variant="page" />
        </ChatProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function send(text: string) {
  const user = userEvent.setup();
  const field = screen.getByRole('textbox', { name: /message the hr assistant/i });
  await user.clear(field);
  await user.type(field, text);
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /send message/i }));
  });
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe('AI chat panel — PROJECT.md §17 scenarios', () => {
  it('§17.1 answers a policy question with retrieval steps and sources', async () => {
    await signIn('employee');
    renderChat();
    await screen.findByText(/signed in as rahul kumar/i);

    await send('What is the work-from-home policy?');

    expect(
      await screen.findByRole('heading', { name: /work-from-home policy/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/searching policies/i)).toBeInTheDocument();
    expect(screen.getByText(/checking permissions/i)).toBeInTheDocument();
    const sources = screen.getByRole('region', { name: /sources/i });
    expect(within(sources).getByText(/work from home policy 2026/i)).toBeInTheDocument();
  });

  it('§17.2 answers a leave balance question with a live table', async () => {
    await signIn('employee');
    renderChat();
    await screen.findByText(/signed in as rahul kumar/i);

    await send('How many leaves do I have left?');

    expect(await screen.findByText(/current leave balance/i)).toBeInTheDocument();
    const table = await screen.findByRole('table');
    const headers = within(table).getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headers).toEqual(['Leave type', 'Total', 'Used', 'Remaining', 'Pending']);
    expect(within(table).getByRole('row', { name: /casual/i })).toHaveTextContent('8');
  });

  it('§17.3 collects missing fields, then asks HR to confirm before creating', async () => {
    await signIn('hr');
    renderChat();
    await screen.findByText(/signed in as meera iyer/i);

    await send('Add a new employee named Rahul Kumar to the Engineering department');
    expect(await screen.findByText(/two required fields are still missing/i)).toBeInTheDocument();

    await send('rahul.kumar@agentichrms.test, designation Software Engineer');
    const card = await screen.findByRole('region', { name: /confirmation required: create employee record/i });
    expect(within(card).getByText(/rahul.kumar@agentichrms.test/i)).toBeInTheDocument();
    expect(within(card).getByText(/designation: software engineer/i)).toBeInTheDocument();

    await act(async () => {
      await userEvent.setup().click(within(card).getByRole('button', { name: /^approve$/i }));
    });

    expect(await screen.findByText(/employee created/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/approved and executed/i)).toBeInTheDocument(),
    );
  });

  it('§17.4 blocks an unauthorized delete and never offers a confirm action', async () => {
    await signIn('employee');
    renderChat();
    await screen.findByText(/signed in as rahul kumar/i);

    await send('Delete employee Rahul');

    expect(await screen.findByText(/permission denied/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^approve$/i })).not.toBeInTheDocument();
    expect(screen.getByText(/request blocked by the permission layer/i)).toBeInTheDocument();
  });

  it('lets HR deny a sensitive action without running the tool', async () => {
    await signIn('hr');
    renderChat();
    await screen.findByText(/signed in as meera iyer/i);

    await send('Delete employee Sana Rao');
    const card = await screen.findByRole('region', { name: /confirmation required: delete employee record/i });

    await act(async () => {
      await userEvent.setup().click(within(card).getByRole('button', { name: /^deny$/i }));
    });

    expect(await screen.findByText(/denied — no changes were made/i)).toBeInTheDocument();
    expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
  });
});

describe('AI chat panel — states and navigation', () => {
  it('surfaces a failure with a retry that re-runs the request', async () => {
    await signIn('employee');
    renderChat();
    await screen.findByText(/signed in as rahul kumar/i);

    await send('simulate an error');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/agent service did not respond/i);

    await act(async () => {
      await userEvent.setup().click(within(alert).getByRole('button', { name: /retry/i }));
    });

    expect(await screen.findByText(/i answer hr questions with the tools your role is allowed to use/i)).toBeInTheDocument();
  });

  it('starts a new conversation and keeps the previous one in history', async () => {
    await signIn('employee');
    renderChat();
    await screen.findByText(/signed in as rahul kumar/i);

    await send('How many leaves do I have left?');
    await screen.findByText(/current leave balance/i);

    await act(async () => {
      await userEvent.setup().click(screen.getByRole('button', { name: /start a new chat/i }));
    });

    expect(await screen.findByRole('heading', { name: /ask the hr assistant/i })).toBeInTheDocument();
    const history = screen.getByRole('navigation', { name: /chat history/i });
    expect(within(history).getAllByRole('listitem')).toHaveLength(2);

    const restore = within(history)
      .getAllByRole('button')
      .find((button) => /how many leaves do i have left/i.test(button.textContent ?? ''));
    expect(restore).toBeDefined();
    await act(async () => {
      await userEvent.setup().click(restore as HTMLButtonElement);
    });
    expect(await screen.findByText(/current leave balance/i)).toBeInTheDocument();
  });

  it('sends a suggestion chip and blocks over-long messages', async () => {
    await signIn('employee');
    renderChat();
    await screen.findByText(/signed in as rahul kumar/i);

    await act(async () => {
      await userEvent
        .setup()
        .click(screen.getByRole('button', { name: /what is the work-from-home policy\?/i }));
    });
    expect(
      await screen.findByRole('heading', { name: /work-from-home policy/i }),
    ).toBeInTheDocument();

    const field = screen.getByRole('textbox', { name: /message the hr assistant/i });
    await userEvent.setup().type(field, 'x'.repeat(1001));
    expect(await screen.findByText(/your message is too long/i)).toBeInTheDocument();
    expect(field).toHaveAttribute('aria-invalid', 'true');
  });
});
