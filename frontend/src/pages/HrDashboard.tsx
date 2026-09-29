import { useCallback } from 'react';

import type { HrDashboardData } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { PageHeader, SectionCard } from '../components/ui/Card';
import { DataTable, type Column } from '../components/ui/DataTable';
import { StatCard } from '../components/ui/StatCard';
import { ErrorState } from '../components/ui/States';

type PendingApproval = HrDashboardData['pendingApprovals'][number];

const approvalColumns: Array<Column<PendingApproval>> = [
  { key: 'employeeName', header: 'Employee', render: (row) => row.employeeName },
  { key: 'leaveType', header: 'Leave type', render: (row) => row.leaveType },
  { key: 'from', header: 'From', render: (row) => row.from },
  { key: 'to', header: 'To', render: (row) => row.to },
];

export function HrDashboard() {
  const { client, accessToken } = useAuth();
  const loader = useCallback((token: string) => client.getHrDashboard(token), [client]);
  const { data, error, loading } = useAsyncData(loader, accessToken);

  if (loading) {
    return <p role="status">Loading HR metrics…</p>;
  }

  if (error) {
    return <ErrorState title="HR metrics unavailable" message={error} />;
  }

  if (!data) {
    return <p role="status">Loading HR metrics…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR dashboard"
        description="Workforce, attendance and leave approvals that need your attention."
      />

      <SectionCard title="Workforce metrics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total employees" value={data.metrics.totalEmployees} icon="users" staggerIndex={0} />
          <StatCard label="New joiners this month" value={data.metrics.newJoinersThisMonth} icon="user-plus" staggerIndex={1} />
          <StatCard label="Employees on leave" value={data.metrics.employeesOnLeave} icon="briefcase" staggerIndex={2} />
          <StatCard label="Pending leave requests" value={data.metrics.pendingLeaveRequests} icon="inbox" staggerIndex={3} />
          <StatCard label="Present today" value={data.metrics.presentToday} icon="check" staggerIndex={4} />
          <StatCard label="Departments" value={data.metrics.departments} icon="dashboard" staggerIndex={5} />
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

        <SectionCard title="Pending leave approvals">
          <DataTable
            caption="Pending leave approvals"
            columns={approvalColumns}
            rows={data.pendingApprovals}
            emptyTitle="No approvals waiting"
            emptyDescription="Every leave request has been reviewed."
          />
        </SectionCard>
      </div>
    </div>
  );
}
