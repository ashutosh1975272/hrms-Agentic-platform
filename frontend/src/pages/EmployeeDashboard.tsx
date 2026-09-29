import { useCallback } from 'react';

import { useAuth } from '../auth/AuthContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { PageHeader, SectionCard } from '../components/ui/Card';
import { DataTable, type Column } from '../components/ui/DataTable';
import { StatCard } from '../components/ui/StatCard';
import { ErrorState } from '../components/ui/States';
import type { LeaveBalance } from '../api/types';

const ATTENDANCE_LABEL: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  on_leave: 'On leave',
  not_marked: 'Not marked',
};

const leaveColumns: Array<Column<LeaveBalance>> = [
  { key: 'leaveType', header: 'Leave type', render: (row) => row.leaveType },
  { key: 'total', header: 'Total', align: 'right', render: (row) => row.total },
  { key: 'used', header: 'Used', align: 'right', render: (row) => row.used },
  { key: 'remaining', header: 'Remaining', align: 'right', render: (row) => row.remaining },
  { key: 'pending', header: 'Pending', align: 'right', render: (row) => row.pending },
];

export function EmployeeDashboard() {
  const { client, accessToken, user } = useAuth();
  const loader = useCallback((token: string) => client.getEmployeeDashboard(token), [client]);
  const { data, error, loading } = useAsyncData(loader, accessToken);

  if (loading) {
    return <p role="status">Loading your dashboard…</p>;
  }

  if (error) {
    return <ErrorState title="Dashboard unavailable" message={error} />;
  }

  if (!data) {
    return <p role="status">Loading your dashboard…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee dashboard"
        description={`Welcome back${user ? `, ${user.fullName}` : ''}. Here is your personal HR snapshot.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Attendance status"
          value={ATTENDANCE_LABEL[data.attendance.status] ?? 'Unknown'}
          icon="check"
          staggerIndex={0}
        />
        <StatCard label="Pending requests" value={data.pendingRequests} icon="inbox" staggerIndex={1} />
        <StatCard
          label="Onboarding"
          value={data.onboardingComplete ? 'Complete' : 'In progress'}
          icon="user-plus"
          staggerIndex={2}
        />
        <StatCard
          label="Casual leave remaining"
          value={data.leaveBalance.find((entry) => entry.leaveType === 'Casual')?.remaining ?? 0}
          icon="calendar"
          staggerIndex={3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Today's attendance">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {ATTENDANCE_LABEL[data.attendance.status] ?? 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Check in</dt>
              <dd className="mt-0.5 font-medium text-foreground">{data.attendance.checkIn ?? 'Not marked'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Check out</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {data.attendance.checkOut ?? 'Not marked'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Work hours</dt>
              <dd className="mt-0.5 font-medium text-foreground">{data.attendance.workHours} hrs</dd>
            </div>
          </dl>
        </SectionCard>

        <SectionCard title="Upcoming holidays">
          <ul className="space-y-2 text-sm">
            {data.upcomingHolidays.map((holiday) => (
              <li
                key={holiday.name}
                className="flex flex-wrap justify-between gap-2 border-b border-border/70 pb-2 text-foreground last:border-0 last:pb-0"
              >
                <span>{holiday.name}</span>
                <span className="text-muted-foreground">{holiday.date}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Leave balance">
          <DataTable
            caption="Leave balance"
            columns={leaveColumns}
            rows={data.leaveBalance}
            emptyTitle="No leave types configured"
            emptyDescription="Your HR partner has not assigned a leave balance yet."
          />
        </SectionCard>

        <SectionCard title="Announcements">
          <ul className="space-y-3 text-sm">
            {data.announcements.map((announcement) => (
              <li key={announcement.id} className="text-foreground">
                <span className="font-medium">{announcement.title}</span>
                <span className="block text-xs text-muted-foreground">
                  Published {announcement.publishedOn}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
