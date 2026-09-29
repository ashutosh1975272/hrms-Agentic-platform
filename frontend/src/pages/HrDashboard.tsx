import { useCallback } from 'react';

import type { HrDashboardData } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { DataTable, type Column } from '../components/DataTable';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { useAsyncData } from '../hooks/useAsyncData';

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
    return (
      <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p role="status">Loading HR metrics…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">HR dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Workforce, attendance and leave approvals that need your attention.
        </p>
      </div>

      <Panel title="Workforce metrics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total employees" value={data.metrics.totalEmployees} />
          <StatCard label="New joiners this month" value={data.metrics.newJoinersThisMonth} />
          <StatCard label="Employees on leave" value={data.metrics.employeesOnLeave} />
          <StatCard label="Pending leave requests" value={data.metrics.pendingLeaveRequests} />
          <StatCard label="Present today" value={data.metrics.presentToday} />
          <StatCard label="Departments" value={data.metrics.departments} />
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

        <Panel title="Pending leave approvals" className="lg:col-span-1">
          <DataTable
            caption="Pending leave approvals"
            columns={approvalColumns}
            rows={data.pendingApprovals}
            emptyMessage="No leave requests are waiting for approval."
          />
        </Panel>
      </div>
    </div>
  );
}
