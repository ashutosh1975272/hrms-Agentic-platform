import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { createMockAdapter } from '../api/mockAdapter';
import { ApiError } from '../api/errors';
import type { ApiClient } from '../api/types';
import { AuthProvider, SESSION_STORAGE_KEY } from '../auth/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';
import { HrDashboard } from './HrDashboard';

const EMPLOYEE_TOKEN = 'mock-token-usr-emp-1';
const HR_TOKEN = 'mock-token-usr-hr-1';
const ADMIN_TOKEN = 'mock-token-usr-admin-1';

function signIn(token: string) {
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accessToken: token }));
}

function renderDashboard(ui: React.ReactNode, client: ApiClient = createMockAdapter()) {
  return render(
    <MemoryRouter>
      <AuthProvider client={client}>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe('EmployeeDashboard', () => {
  it('shows the attendance summary for the signed-in employee', async () => {
    signIn(EMPLOYEE_TOKEN);
    renderDashboard(<EmployeeDashboard />);

    expect(
      await screen.findByRole('heading', { level: 1, name: /employee dashboard/i }),
    ).toBeInTheDocument();
    const attendance = await screen.findByRole('region', { name: /today's attendance/i });
    expect(within(attendance).getByText(/present/i)).toBeInTheDocument();
    expect(within(attendance).getByText('09:12')).toBeInTheDocument();
  });

  it('renders the leave balance as a table with column headers', async () => {
    signIn(EMPLOYEE_TOKEN);
    renderDashboard(<EmployeeDashboard />);

    const table = await screen.findByRole('table', { name: /leave balance/i });
    const headers = within(table).getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headers).toEqual(['Leave type', 'Total', 'Used', 'Remaining', 'Pending']);
    expect(within(table).getByRole('row', { name: /work from home/i })).toBeInTheDocument();
  });

  it('lists upcoming holidays and announcements', async () => {
    signIn(EMPLOYEE_TOKEN);
    renderDashboard(<EmployeeDashboard />);

    expect(await screen.findByText('Independence Day')).toBeInTheDocument();
    expect(await screen.findByText(/new leave policy effective next month/i)).toBeInTheDocument();
  });

  it('surfaces an api failure as an alert', async () => {
    signIn(EMPLOYEE_TOKEN);
    const failing: ApiClient = {
      ...createMockAdapter(),
      getEmployeeDashboard: () => Promise.reject(new ApiError(500, 'Dashboard unavailable')),
    };

    renderDashboard(<EmployeeDashboard />, failing);

    expect(await screen.findByRole('alert')).toHaveTextContent('Dashboard unavailable');
  });
});

describe('HrDashboard', () => {
  it('shows the organisation headcount metrics', async () => {
    signIn(HR_TOKEN);
    renderDashboard(<HrDashboard />);

    expect(await screen.findByRole('heading', { level: 1, name: /hr dashboard/i })).toBeInTheDocument();
    const region = await screen.findByRole('region', { name: /workforce metrics/i });
    expect(within(region).getByText('Total employees')).toBeInTheDocument();
    expect(within(region).getByText('Pending leave requests')).toBeInTheDocument();
  });

  it('lists pending leave approvals for review', async () => {
    signIn(HR_TOKEN);
    renderDashboard(<HrDashboard />);

    const table = await screen.findByRole('table', { name: /pending leave approvals/i });
    const headers = within(table).getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headers).toEqual(['Employee', 'Leave type', 'From', 'To']);
    expect(within(table).getByRole('row', { name: /priya singh/i })).toBeInTheDocument();
  });

  it('breaks headcount down by department', async () => {
    signIn(HR_TOKEN);
    renderDashboard(<HrDashboard />);

    const region = await screen.findByRole('region', { name: /department headcount/i });
    expect(within(region).getByText('Engineering')).toBeInTheDocument();
  });
});

describe('AdminDashboard', () => {
  it('shows organisation-wide system metrics', async () => {
    signIn(ADMIN_TOKEN);
    renderDashboard(<AdminDashboard />);

    expect(
      await screen.findByRole('heading', { level: 1, name: /admin dashboard/i }),
    ).toBeInTheDocument();
    const region = await screen.findByRole('region', { name: /organisation metrics/i });
    expect(within(region).getByText('Active users')).toBeInTheDocument();
    expect(within(region).getByText('Policies published')).toBeInTheDocument();
  });

  it('surfaces denied audit events as well as successful ones', async () => {
    signIn(ADMIN_TOKEN);
    renderDashboard(<AdminDashboard />);

    const table = await screen.findByRole('table', { name: /recent audit events/i });
    const denied = within(table).getByRole('row', { name: /employee_delete/i });
    expect(denied).toHaveTextContent('Denied');
    expect(within(table).getByRole('row', { name: /leave_approve/i })).toHaveTextContent('Success');
  });

  it('summarises users per role', async () => {
    signIn(ADMIN_TOKEN);
    renderDashboard(<AdminDashboard />);

    const region = await screen.findByRole('region', { name: /role access summary/i });
    expect(within(region).getByText('Admin')).toBeInTheDocument();
  });
});
