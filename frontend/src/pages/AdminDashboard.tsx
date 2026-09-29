import { useCallback } from 'react';

import type { AdminDashboardData } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABEL } from '../auth/roles';
import { useAsyncData } from '../hooks/useAsyncData';
import { Badge } from '../components/ui/Badge';
import { PageHeader, SectionCard } from '../components/ui/Card';
import { DataTable, type Column } from '../components/ui/DataTable';
import { StatCard } from '../components/ui/StatCard';
import { ErrorState } from '../components/ui/States';

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
      <Badge tone={row.status === 'denied' ? 'danger' : 'success'}>
        {row.status === 'denied' ? 'Denied' : 'Success'}
      </Badge>
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
    return <ErrorState title="Organisation metrics unavailable" message={error} />;
  }

  if (!data) {
    return <p role="status">Loading organisation metrics…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin dashboard"
        description="Organisation-wide metrics, access control and recent system activity."
      />

      <SectionCard title="Organisation metrics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total employees" value={data.metrics.totalEmployees} icon="users" staggerIndex={0} />
          <StatCard label="Active users" value={data.metrics.activeUsers} icon="shield" staggerIndex={1} />
          <StatCard label="Departments" value={data.metrics.departments} icon="dashboard" staggerIndex={2} />
          <StatCard label="Employees on leave" value={data.metrics.employeesOnLeave} icon="briefcase" staggerIndex={3} />
          <StatCard label="Pending leave requests" value={data.metrics.pendingLeaveRequests} icon="inbox" staggerIndex={4} />
          <StatCard label="Policies published" value={data.metrics.policiesPublished} icon="book" staggerIndex={5} />
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Department headcount">
          <ul className="space-y-2 text-sm">
            {data.departmentHeadcount.map((entry) => (
              <li
                key={entry.department}
                className="flex items-center justify-between gap-4 border-b border-border/70 pb-2 text-foreground last:border-0 last:pb-0"
              >
                <span>{entry.department}</span>
                <span className="font-heading text-base font-semibold">{entry.headcount}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Role access summary">
          <ul className="space-y-2 text-sm">
            {data.accessSummary.map((entry) => (
              <li
                key={entry.role}
                className="flex items-center justify-between gap-4 border-b border-border/70 pb-2 text-foreground last:border-0 last:pb-0"
              >
                <span>{ROLE_LABEL[entry.role]}</span>
                <span className="font-heading text-base font-semibold">{entry.userCount}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Recent audit events" className="lg:col-span-2">
          <DataTable
            caption="Recent audit events"
            columns={auditColumns}
            rows={data.recentAuditEvents}
            emptyTitle="No audited actions yet"
            emptyDescription="AI and system actions will appear here once they run."
          />
        </SectionCard>
      </div>
    </div>
  );
}
