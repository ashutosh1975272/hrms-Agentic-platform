import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { createMockAdapter } from '../api/mockAdapter';
import type { ApiClient } from '../api/types';
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext';
import { ToastProvider } from '../components/ui/Toast';
import { AnnouncementsPage } from './AnnouncementsPage';
import { AttendancePage } from './AttendancePage';
import { EmployeesPage } from './EmployeesPage';
import { HolidaysPage } from './HolidaysPage';
import { LeavesPage } from './LeavesPage';
import { PoliciesPage } from './PoliciesPage';

const EMPLOYEE_TOKEN = 'mock-token-usr-emp-1';
const HR_TOKEN = 'mock-token-usr-hr-1';
const ADMIN_TOKEN = 'mock-token-usr-admin-1';

function signIn(token: string) {
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accessToken: token }));
}

function renderModule(ui: React.ReactNode, client: ApiClient = createMockAdapter()) {
  return render(
    <MemoryRouter>
      <AuthProvider client={client}>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe('EmployeesPage', () => {
  it('lists the whole directory for HR and offers create and edit actions', async () => {
    signIn(HR_TOKEN);
    renderModule(<EmployeesPage />);

    const table = await screen.findByRole('table', { name: /employee directory/i });
    expect(within(table).getByRole('row', { name: /priya singh/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add employee/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit priya singh/i })).toBeInTheDocument();
  });

  it('scopes an employee to their own record and hides privileged actions', async () => {
    signIn(EMPLOYEE_TOKEN);
    renderModule(<EmployeesPage />);

    const table = await screen.findByRole('table', { name: /employee directory/i });
    expect(within(table).getByRole('row', { name: /rahul kumar/i })).toBeInTheDocument();
    expect(within(table).queryByRole('row', { name: /priya singh/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /add employee/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /edit rahul kumar/i })).toBeNull();
  });

  it('only offers the destructive delete action to an admin', async () => {
    signIn(ADMIN_TOKEN);
    renderModule(<EmployeesPage />);

    expect(await screen.findByRole('button', { name: /delete priya singh/i })).toBeInTheDocument();
  });

  it('opens the profile drawer and the create form', async () => {
    const user = userEvent.setup();
    signIn(HR_TOKEN);
    renderModule(<EmployeesPage />);

    await user.click(await screen.findByRole('button', { name: /view profile of priya singh/i }));
    const drawer = await screen.findByRole('dialog', { name: /priya singh/i });
    expect(within(drawer).getByRole('region', { name: /employment/i })).toBeInTheDocument();
    expect(within(drawer).getByText('EMP-1004')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /edit record/i }));
    const form = await screen.findByRole('dialog', { name: /edit employee/i });
    expect(within(form).getByLabelText(/work email/i)).toHaveValue('priya.singh@agentichrms.test');
  });

  it('validates the create form inline before calling the api', async () => {
    const user = userEvent.setup();
    signIn(HR_TOKEN);
    renderModule(<EmployeesPage />);

    await user.click(await screen.findByRole('button', { name: /add employee/i }));
    const form = await screen.findByRole('dialog', { name: /add employee/i });
    await user.click(within(form).getByRole('button', { name: /create employee/i }));

    expect(await within(form).findByText(/enter the employee full name/i)).toBeInTheDocument();
    expect(within(form).getByLabelText(/full name/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('filters the directory by search term', async () => {
    const user = userEvent.setup();
    signIn(HR_TOKEN);
    renderModule(<EmployeesPage />);

    await screen.findByRole('table', { name: /employee directory/i });
    await user.type(screen.getByLabelText(/^search/i), 'priya');

    const table = screen.getByRole('table', { name: /employee directory/i });
    expect(within(table).getByRole('row', { name: /priya singh/i })).toBeInTheDocument();
    expect(within(table).queryByRole('row', { name: /dev kapoor/i })).toBeNull();
  });

  it('confirms before deleting an employee record', async () => {
    const user = userEvent.setup();
    signIn(ADMIN_TOKEN);
    renderModule(<EmployeesPage />);

    await user.click(await screen.findByRole('button', { name: /delete priya singh/i }));
    const confirm = await screen.findByRole('dialog', { name: /delete employee record/i });
    expect(within(confirm).getByText(/cannot be undone/i)).toBeInTheDocument();
  });
});

describe('AttendancePage', () => {
  it('shows the check-in widget, the calendar and the personal history', async () => {
    signIn(EMPLOYEE_TOKEN);
    renderModule(<AttendancePage />);

    const today = await screen.findByRole('region', { name: /^today$/i });
    expect(await within(today).findByRole('button', { name: /checked in/i })).toBeDisabled();
    expect(within(today).getByRole('button', { name: /check out/i })).toBeEnabled();
    expect(await screen.findByRole('table', { name: /daily attendance/i })).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: /my attendance history/i })).toBeInTheDocument();
  });

  it('hides the organisation view and the correction log from an employee', async () => {
    signIn(EMPLOYEE_TOKEN);
    renderModule(<AttendancePage />);

    await screen.findByRole('table', { name: /my attendance history/i });
    expect(screen.queryByRole('region', { name: /organisation attendance/i })).toBeNull();
    expect(screen.queryByRole('region', { name: /correction log/i })).toBeNull();
  });

  it('lets HR open the correction flow for a recorded day', async () => {
    const user = userEvent.setup();
    signIn(HR_TOKEN);
    renderModule(<AttendancePage />);

    const correct = await screen.findAllByRole('button', { name: /^correct attendance for/i });
    await user.click(correct[0]);
    const dialog = await screen.findByRole('dialog', { name: /attendance correction/i });
    expect(within(dialog).getByLabelText(/reason/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /submit correction/i })).toBeInTheDocument();
  });
});

describe('LeavesPage', () => {
  it('shows the balance, the personal timeline and hides the inbox from an employee', async () => {
    signIn(EMPLOYEE_TOKEN);
    renderModule(<LeavesPage />);

    const balance = await screen.findByRole('table', { name: /my leave balance/i });
    expect(await within(balance).findByRole('row', { name: /work from home/i })).toBeInTheDocument();
    expect(await screen.findByText('Long weekend.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /approval inbox/i })).toBeNull();
  });

  it('validates the apply form inline and then raises a request', async () => {
    const user = userEvent.setup();
    signIn(EMPLOYEE_TOKEN);
    renderModule(<LeavesPage />);

    await user.click(await screen.findByRole('button', { name: /apply for leave/i }));
    const dialog = await screen.findByRole('dialog', { name: /apply for leave/i });
    await user.click(within(dialog).getByRole('button', { name: /submit request/i }));
    expect(await within(dialog).findByText(/choose the first day of leave/i)).toBeInTheDocument();

    const from = within(dialog).getByLabelText(/^from/i);
    await user.type(from, '2027-01-11');
    const to = within(dialog).getByLabelText(/^to/i);
    await user.type(to, '2027-01-12');
    await user.type(within(dialog).getByLabelText(/reason/i), 'Family function out of town');
    await user.click(within(dialog).getByRole('button', { name: /submit request/i }));

    expect(await screen.findByText(/leave request submitted/i)).toBeInTheDocument();
  });

  it('shows the approval inbox with review actions for HR', async () => {
    signIn(HR_TOKEN);
    renderModule(<LeavesPage />);

    const inbox = await screen.findByRole('region', { name: /approval inbox/i });
    expect(await within(inbox).findByRole('row', { name: /priya singh/i })).toBeInTheDocument();
    expect(within(inbox).getByRole('button', { name: /review priya singh leave request/i })).toBeInTheDocument();
  });
});

describe('PoliciesPage', () => {
  it('lists the documents and renders the first one in the reader', async () => {
    signIn(EMPLOYEE_TOKEN);
    renderModule(<PoliciesPage />);

    const library = await screen.findByRole('region', { name: /policy library/i });
    expect(
      await within(library).findByRole('button', { name: /work from home policy/i }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Work From Home Policy' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 3, name: 'Eligibility' })).toBeInTheDocument();
  });

  it('hides admin-only documents from an employee', async () => {
    signIn(EMPLOYEE_TOKEN);
    renderModule(<PoliciesPage />);

    const library = await screen.findByRole('region', { name: /policy library/i });
    await within(library).findByRole('button', { name: /work from home policy/i });
    expect(within(library).queryByRole('button', { name: /role & permission administration/i })).toBeNull();
  });

  it('shows admin-only documents to an admin', async () => {
    signIn(ADMIN_TOKEN);
    renderModule(<PoliciesPage />);

    const library = await screen.findByRole('region', { name: /policy library/i });
    expect(
      await within(library).findByRole('button', { name: /role & permission administration/i }),
    ).toBeInTheDocument();
  });
});

describe('HolidaysPage and AnnouncementsPage', () => {
  it('lists holidays with their type and countdown', async () => {
    signIn(EMPLOYEE_TOKEN);
    renderModule(<HolidaysPage />);

    const table = await screen.findByRole('table', { name: /holiday calendar/i });
    expect(within(table).getByRole('row', { name: /independence day/i })).toHaveTextContent('Public holiday');
  });

  it('lists only the announcements addressed to the signed-in role', async () => {
    signIn(EMPLOYEE_TOKEN);
    renderModule(<AnnouncementsPage />);

    const board = await screen.findByRole('region', { name: /notice board/i });
    expect(await within(board).findByText('All-hands on Friday at 16:00')).toBeInTheDocument();
    expect(within(board).queryByText(/quarterly access review/i)).toBeNull();
  });
});
