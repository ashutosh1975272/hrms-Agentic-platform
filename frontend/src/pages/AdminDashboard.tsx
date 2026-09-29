import { useCallback } from 'react';

import type { AdminDashboardData } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABEL } from '../auth/roles';
import { DataTable, type Column } from '../components/DataTable';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { useAsyncData } from '../hooks/useAsyncData';

type AuditEvent = AdminDashboardData['recentAuditEvents'][number];

const auditColumns: Array<Column<AuditEvent>> = [
  {
    key: 'action',
    header: 'Action',
    render: (row) => <span className="font-mono text-xs">{row.action}</span>,
  },
  { key: 'actor', header: 'Actor', render: (row) => row.actor },
  { key: 'role', header: 'Role', render: (row) => ROLE_LABEL[row.role] },
  { key: 'occurredAt', header: 'Recorded at', render: (row) => row.occurredAt },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <span
        className={
          row.status === 'denied'
            ? 'rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800'
            : 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800'
        }
      >
        {row.status === 'denied' ? 'Denied' : 'Success'}
      </span>
    ),
  },
];

export function AdminDashboard() {
  const { client, accessToken } = useAuth();
  const loader = useCallback((token: string) => client.getAdminDashboard(token), [client]);
  const { data, error, loading } = useAsyncData(loader, accessToken);

  if (loading) {
    return <p role="status">Loading organisation metrics…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p role="status">Loading organisation metrics…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Organisation-wide metrics, access control and recent system activity.
        </p>
      </div>

      <Panel title="Organisation metrics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total employees" value={data.metrics.totalEmployees} />
          <StatCard label="Active users" value={data.metrics.activeUsers} />
          <StatCard label="Departments" value={data.metrics.departments} />
          <StatCard label="Employees on leave" value={data.metrics.employeesOnLeave} />
          <StatCard label="Pending leave requests" value={data.metrics.pendingLeaveRequests} />
          <StatCard label="Policies published" value={data.metrics.policiesPublished} />
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Department headcount">
          <ul className="space-y-2 text-sm">
            {data.departmentHeadcount.map((entry) => (
              <li key={entry.department} className="flex justify-between gap-4 text-slate-800">
                <span>{entry.department}</span>
                <span className="font-medium">{entry.headcount}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Role access summary">
          <ul className="space-y-2 text-sm">
            {data.accessSummary.map((entry) => (
              <li key={entry.role} className="flex justify-between gap-4 text-slate-800">
                <span>{ROLE_LABEL[entry.role]}</span>
                <span className="font-medium">{entry.userCount}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent audit events" className="lg:col-span-2">
          <DataTable
            caption="Recent audit events"
            columns={auditColumns}
            rows={data.recentAuditEvents}
            emptyMessage="No audited actions recorded yet."
          />
        </Panel>
      </div>
    </div>
  );
}
