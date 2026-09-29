import { useCallback } from 'react';

import { useAuth } from '../auth/AuthContext';
import { DataTable, type Column } from '../components/DataTable';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { useAsyncData } from '../hooks/useAsyncData';
import type { LeaveBalance } from '../api/types';

const ATTENDANCE_LABEL: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  on_leave: 'On leave',
  not_marked: 'Not marked',
};

export function EmployeeDashboard() {
  const { client, accessToken, user } = useAuth();
  const loader = useCallback((token: string) => client.getEmployeeDashboard(token), [client]);
  const { data, error, loading } = useAsyncData(loader, accessToken);

  if (loading) {
    return <p role="status">Loading your dashboard…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p role="status">Loading your dashboard…</p>;
  }

  const leaveColumns: Array<Column<LeaveBalance>> = [
    { key: 'leaveType', header: 'Leave type', render: (row) => row.leaveType },
    { key: 'total', header: 'Total', render: (row) => row.total },
    { key: 'used', header: 'Used', render: (row) => row.used },
    { key: 'remaining', header: 'Remaining', render: (row) => row.remaining },
    { key: 'pending', header: 'Pending', render: (row) => row.pending },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Employee dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Welcome back{user ? `, ${user.fullName}` : ''}. Here is your personal HR snapshot.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendance status" value={ATTENDANCE_LABEL[data.attendance.status] ?? 'Unknown'} />
        <StatCard label="Pending requests" value={data.pendingRequests} />
        <StatCard
          label="Onboarding"
          value={data.onboardingComplete ? 'Complete' : 'In progress'}
        />
        <StatCard
          label="Casual leave remaining"
          value={data.leaveBalance.find((entry) => entry.leaveType === 'Casual')?.remaining ?? 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Today's attendance">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-600">Status</dt>
              <dd className="font-medium text-slate-900">
                {ATTENDANCE_LABEL[data.attendance.status] ?? 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">Check in</dt>
              <dd className="font-medium text-slate-900">{data.attendance.checkIn ?? 'Not marked'}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Check out</dt>
              <dd className="font-medium text-slate-900">
                {data.attendance.checkOut ?? 'Not marked'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">Work hours</dt>
              <dd className="font-medium text-slate-900">{data.attendance.workHours} hrs</dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Upcoming holidays">
          <ul className="space-y-2 text-sm">
            {data.upcomingHolidays.map((holiday) => (
              <li key={holiday.name} className="flex justify-between gap-4 text-slate-800">
                <span>{holiday.name}</span>
                <span className="text-slate-600">{holiday.date}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Leave balance">
          <DataTable
            caption="Leave balance"
            columns={leaveColumns}
            rows={data.leaveBalance}
            emptyMessage="No leave types are configured for you yet."
          />
        </Panel>

        <Panel title="Announcements">
          <ul className="space-y-3 text-sm">
            {data.announcements.map((announcement) => (
              <li key={announcement.id} className="text-slate-800">
                <span className="font-medium">{announcement.title}</span>
                <span className="block text-xs text-slate-500">
                  Published {announcement.publishedOn}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
