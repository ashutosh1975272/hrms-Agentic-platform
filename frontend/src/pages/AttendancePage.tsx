import { useCallback, useMemo, useState } from 'react';

import {
  ATTENDANCE_STATUS_LABEL,
  type AttendanceCorrection,
  type AttendanceDay,
  type AttendanceRecord,
  type AttendanceStatus,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useCan } from '../hooks/useCan';
import { useResource } from '../hooks/useResource';
import { AttendanceCalendar } from '../components/attendance/AttendanceCalendar';
import { ATTENDANCE_TONE, CORRECTION_TONE } from '../components/attendance/attendanceMeta';
import { CorrectionModal } from '../components/attendance/CorrectionModal';
import { Badge } from '../components/ui/Badge';
import { Button, IconButton } from '../components/ui/Button';
import { PageHeader, SectionCard } from '../components/ui/Card';
import { DataTable, type Column } from '../components/ui/DataTable';
import { ErrorState, SkeletonCards } from '../components/ui/States';
import { useToast } from '../components/ui/toastContext';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthPart] = month.split('-').map((part) => Number.parseInt(part, 10));
  const date = new Date(year, monthPart - 1 + delta, 1);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`;
}

function monthLabel(month: string): string {
  const [year, monthPart] = month.split('-').map((part) => Number.parseInt(part, 10));
  return new Date(year, monthPart - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

export function AttendancePage() {
  const { client, accessToken } = useAuth();
  const { can } = useCan();
  const { notify } = useToast();

  const [month, setMonth] = useState(currentMonth);
  const [punching, setPunching] = useState(false);
  const [punchError, setPunchError] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState<AttendanceRecord | null>(null);
  const [correctionBusy, setCorrectionBusy] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  const canReport = can('attendance.report');
  const canCorrect = can('attendance.correct');

  const myLoader = useCallback(
    (token: string) => client.getMyAttendance(token, month),
    [client, month],
  );
  const mine = useResource(myLoader, accessToken);

  const teamLoader = useCallback(
    (token: string) => (canReport ? client.listAttendance(token, { month }) : Promise.resolve([] as AttendanceRecord[])),
    [client, month, canReport],
  );
  const team = useResource(teamLoader, accessToken);

  const correctionsLoader = useCallback(
    (token: string) => (canCorrect ? client.listCorrections(token) : Promise.resolve([] as AttendanceCorrection[])),
    [client, canCorrect],
  );
  const corrections = useResource(correctionsLoader, accessToken);

  const today: AttendanceDay | null = useMemo(() => {
    const iso = new Date().toISOString().slice(0, 10);
    return mine.data?.days.find((day) => day.date === iso) ?? null;
  }, [mine.data]);

  const refreshAll = useCallback(() => {
    mine.reload();
    team.reload();
    corrections.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine.reload, team.reload, corrections.reload]);

  const handlePunch = async (action: 'checkIn' | 'checkOut') => {
    if (!accessToken) {
      return;
    }
    setPunching(true);
    setPunchError(null);
    try {
      await client[action](accessToken);
      notify({
        tone: 'success',
        title: action === 'checkIn' ? 'Checked in' : 'Checked out',
        description: `Today’s attendance has been updated for ${monthLabel(month)}.`,
      });
      refreshAll();
    } catch (cause) {
      setPunchError(cause instanceof Error ? cause.message : 'The attendance action failed.');
    } finally {
      setPunching(false);
    }
  };

  const handleCorrection = async (input: {
    attendanceId: string;
    reason: string;
    requestedStatus: AttendanceStatus;
    requestedCheckIn: string | null;
    requestedCheckOut: string | null;
  }) => {
    if (!accessToken) {
      return;
    }
    setCorrectionBusy(true);
    setCorrectionError(null);
    try {
      await client.applyAttendanceCorrection(accessToken, input);
      notify({
        tone: 'success',
        title: 'Correction recorded',
        description: 'The change is stored in the audit log with the previous values.',
      });
      setCorrecting(null);
      refreshAll();
    } catch (cause) {
      setCorrectionError(cause instanceof Error ? cause.message : 'The correction could not be saved.');
    } finally {
      setCorrectionBusy(false);
    }
  };

  const teamColumns: Array<Column<AttendanceRecord>> = useMemo(
    () => [
      { key: 'employeeName', header: 'Employee', render: (row) => row.employeeName },
      { key: 'department', header: 'Department', render: (row) => row.department },
      { key: 'date', header: 'Date', render: (row) => row.date },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <Badge tone={ATTENDANCE_TONE[row.status]}>{ATTENDANCE_STATUS_LABEL[row.status]}</Badge>,
      },
      { key: 'checkIn', header: 'Check in', render: (row) => row.checkIn ?? '—' },
      { key: 'checkOut', header: 'Check out', render: (row) => row.checkOut ?? '—' },
      { key: 'workHours', header: 'Hours', align: 'right', render: (row) => row.workHours.toFixed(1) },
      {
        key: 'corrected',
        header: 'Corrected',
        render: (row) => (row.corrected ? <Badge tone="info">Corrected</Badge> : <span className="text-muted-foreground">—</span>),
      },
      ...(canCorrect
        ? [
            {
              key: 'actions',
              header: 'Actions',
              align: 'right' as const,
              render: (row: AttendanceRecord) => (
                <IconButton
                  icon="pencil"
                  label={`Correct attendance for ${row.employeeName} on ${row.date}`}
                  size="sm"
                  onClick={() => {
                    setCorrectionError(null);
                    setCorrecting(row);
                  }}
                />
              ),
            },
          ]
        : []),
    ],
    [canCorrect],
  );

  const personalColumns: Array<Column<AttendanceDay>> = useMemo(
    () => [
      { key: 'date', header: 'Date', render: (row) => row.date },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <Badge tone={ATTENDANCE_TONE[row.status]}>{ATTENDANCE_STATUS_LABEL[row.status]}</Badge>,
      },
      { key: 'checkIn', header: 'Check in', render: (row) => row.checkIn ?? '—' },
      { key: 'checkOut', header: 'Check out', render: (row) => row.checkOut ?? '—' },
      { key: 'workHours', header: 'Hours', align: 'right', render: (row) => row.workHours.toFixed(1) },
      { key: 'note', header: 'Note', render: (row) => row.note ?? '—' },
    ],
    [],
  );

  const correctionColumns: Array<Column<AttendanceCorrection>> = useMemo(
    () => [
      { key: 'employeeName', header: 'Employee', render: (row) => row.employeeName },
      { key: 'date', header: 'Date', render: (row) => row.date },
      {
        key: 'requestedStatus',
        header: 'Requested',
        render: (row) => ATTENDANCE_STATUS_LABEL[row.requestedStatus],
      },
      { key: 'reason', header: 'Reason', render: (row) => row.reason },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <Badge tone={CORRECTION_TONE[row.status]}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </Badge>
        ),
      },
      { key: 'decidedBy', header: 'Decided by', render: (row) => row.decidedBy ?? '—' },
    ],
    [],
  );

  const summary = mine.data?.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Mark your own attendance, review your month at a glance, and correct records where you are allowed to."
        actions={
          <div className="flex items-center gap-2">
            <IconButton
              icon="chevron-left"
              label="Previous month"
              variant="subtle"
              onClick={() => setMonth((current) => shiftMonth(current, -1))}
            />
            <span className="min-w-40 text-center text-sm font-semibold text-foreground" aria-live="polite">
              {monthLabel(month)}
            </span>
            <IconButton
              icon="chevron-right"
              label="Next month"
              variant="subtle"
              onClick={() => setMonth((current) => shiftMonth(current, 1))}
            />
          </div>
        }
      />

      <SectionCard title="Today" description="Check in when you start work and check out when you leave.">
        {mine.loading ? (
          <SkeletonCards count={1} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <dl className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Status</dt>
                <dd className="mt-1">
                  {today ? (
                    <Badge tone={ATTENDANCE_TONE[today.status]}>
                      {ATTENDANCE_STATUS_LABEL[today.status]}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not marked</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Check in</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{today?.checkIn ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Check out</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{today?.checkOut ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Work hours</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{(today?.workHours ?? 0).toFixed(1)}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button
                icon="check"
                disabled={punching || Boolean(today?.checkIn)}
                onClick={() => void handlePunch('checkIn')}
              >
                {today?.checkIn ? 'Checked in' : 'Check in'}
              </Button>
              <Button
                variant="secondary"
                icon="log-out"
                disabled={punching || !today?.checkIn || Boolean(today?.checkOut)}
                onClick={() => void handlePunch('checkOut')}
              >
                {today?.checkOut ? 'Checked out' : 'Check out'}
              </Button>
            </div>
          </div>
        )}
        {punchError ? (
          <p role="alert" className="mt-3 rounded-control border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive-strong">
            {punchError}
          </p>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Monthly calendar"
        description={summary ? `${summary.present} present · ${summary.absent} absent · ${summary.onLeave} on leave · ${summary.totalHours} hours` : undefined}
      >
        {mine.error ? (
          <ErrorState message={mine.error} onRetry={mine.reload} />
        ) : mine.loading ? (
          <SkeletonCards count={1} />
        ) : (
          <AttendanceCalendar month={month} days={mine.data?.days ?? []} />
        )}
      </SectionCard>

      {canReport ? (
        <SectionCard
          title="Organisation attendance"
          description="Every recorded punch for the selected month."
        >
          <DataTable
            caption="Organisation attendance history"
            columns={teamColumns}
            rows={team.data ?? []}
            rowKey={(row) => row.id}
            loading={team.loading}
            error={team.error}
            {...(team.error ? { onRetry: team.reload } : {})}
            emptyTitle="No attendance recorded"
            emptyDescription="No punch has been recorded in this month yet."
          />
        </SectionCard>
      ) : null}

      <SectionCard title="My attendance history">
        <DataTable
          caption="My attendance history"
          columns={personalColumns}
          rows={mine.data?.days ?? []}
          rowKey={(row) => row.date}
          loading={mine.loading}
          error={mine.error}
          {...(mine.error ? { onRetry: mine.reload } : {})}
          emptyTitle="No attendance yet"
          emptyDescription="Attendance days appear here once the month has started."
        />
      </SectionCard>

      {canCorrect ? (
        <SectionCard
          title="Correction log"
          description="Every correction is stored with the previous and updated values."
        >
          <DataTable
            caption="Attendance correction log"
            columns={correctionColumns}
            rows={corrections.data ?? []}
            rowKey={(row) => row.id}
            loading={corrections.loading}
            error={corrections.error}
            {...(corrections.error ? { onRetry: corrections.reload } : {})}
            emptyTitle="No corrections recorded"
            emptyDescription="Attendance corrections requested by HR appear here."
          />
        </SectionCard>
      ) : null}

      <CorrectionModal
        open={correcting !== null}
        record={correcting}
        busy={correctionBusy}
        serverError={correctionError}
        onClose={() => {
          if (!correctionBusy) {
            setCorrecting(null);
          }
        }}
        onSubmit={handleCorrection}
      />
    </div>
  );
}
