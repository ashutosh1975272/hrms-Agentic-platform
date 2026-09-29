import { useCallback, useMemo, useState } from 'react';

import {
  LEAVE_STATUS_LABEL,
  type LeaveBalance,
  type LeaveInput,
  type LeaveRequest,
  type LeaveRequestStatus,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useCan } from '../hooks/useCan';
import { useResource } from '../hooks/useResource';
import { LeaveApplyModal, LeaveReviewModal } from '../components/leaves/LeaveModals';
import { LeaveTimeline } from '../components/leaves/LeaveTimeline';
import { Avatar, Badge, type BadgeTone } from '../components/ui/Badge';
import { Button, IconButton } from '../components/ui/Button';
import { PageHeader, SectionCard } from '../components/ui/Card';
import { DataTable, type Column } from '../components/ui/DataTable';
import { ConfirmDialog } from '../components/ui/Modal';
import { StatCard } from '../components/ui/StatCard';
import { useToast } from '../components/ui/toastContext';

const STATUS_TONE: Record<LeaveRequestStatus, BadgeTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

const balanceColumns: Array<Column<LeaveBalance>> = [
  { key: 'leaveType', header: 'Leave type', render: (row) => row.leaveType },
  { key: 'total', header: 'Entitled', align: 'right', render: (row) => row.total },
  { key: 'used', header: 'Used', align: 'right', render: (row) => row.used },
  { key: 'pending', header: 'Pending', align: 'right', render: (row) => row.pending },
  { key: 'remaining', header: 'Remaining', align: 'right', render: (row) => row.remaining },
];

export function LeavesPage() {
  const { client, accessToken, user } = useAuth();
  const { can } = useCan();
  const { notify } = useToast();

  const [applyOpen, setApplyOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<LeaveRequest | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<LeaveRequest | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);

  const canApprove = can('leave.approve');

  const balanceLoader = useCallback((token: string) => client.getLeaveBalance(token), [client]);
  const balance = useResource(balanceLoader, accessToken);

  const requestsLoader = useCallback((token: string) => client.listLeaveRequests(token), [client]);
  const requests = useResource(requestsLoader, accessToken);

  const all = useMemo(() => requests.data ?? [], [requests.data]);
  const myRequests = useMemo(
    () => (user ? all.filter((request) => request.employeeId.length > 0 && request.employeeName === user.fullName) : []),
    [all, user],
  );
  const pendingInbox = useMemo(
    () => all.filter((request) => request.status === 'pending'),
    [all],
  );

  const refresh = useCallback(() => {
    balance.reload();
    requests.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance.reload, requests.reload]);

  const handleApply = async (input: LeaveInput) => {
    if (!accessToken) {
      return;
    }
    setApplying(true);
    setApplyError(null);
    try {
      await client.applyForLeave(accessToken, input);
      notify({
        tone: 'success',
        title: 'Leave request submitted',
        description: `${input.leaveType} from ${input.from} to ${input.to} is now pending approval.`,
      });
      setApplyOpen(false);
      refresh();
    } catch (cause) {
      setApplyError(cause instanceof Error ? cause.message : 'The leave request could not be submitted.');
    } finally {
      setApplying(false);
    }
  };

  const handleReview = async (decision: 'approved' | 'rejected', note: string) => {
    if (!accessToken || !reviewing) {
      return;
    }
    setReviewBusy(true);
    setReviewError(null);
    try {
      await client.reviewLeave(accessToken, reviewing.id, { decision, note: note.trim() });
      notify({
        tone: decision === 'approved' ? 'success' : 'info',
        title: `Request ${decision}`,
        description: `${reviewing.employeeName} has been notified.`,
      });
      setReviewing(null);
      refresh();
    } catch (cause) {
      setReviewError(cause instanceof Error ? cause.message : 'The request could not be reviewed.');
    } finally {
      setReviewBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!accessToken || !cancelling) {
      return;
    }
    setCancelBusy(true);
    try {
      await client.cancelLeave(accessToken, cancelling.id);
      notify({
        tone: 'success',
        title: 'Leave cancelled',
        description: `${cancelling.leaveType} from ${cancelling.from} was cancelled.`,
      });
      setCancelling(null);
      refresh();
    } catch (cause) {
      notify({
        tone: 'danger',
        title: 'Cancel failed',
        description: cause instanceof Error ? cause.message : 'The request could not be cancelled.',
      });
    } finally {
      setCancelBusy(false);
    }
  };

  const inboxColumns: Array<Column<LeaveRequest>> = useMemo(
    () => [
      {
        key: 'employeeName',
        header: 'Employee',
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <Avatar name={row.employeeName} size="sm" />
            <div className="min-w-0">
              <span className="block font-medium break-words text-foreground">{row.employeeName}</span>
              <span className="block text-xs break-words text-muted-foreground">{row.department}</span>
            </div>
          </div>
        ),
      },
      { key: 'leaveType', header: 'Leave type', render: (row) => row.leaveType },
      { key: 'from', header: 'From', render: (row) => row.from },
      { key: 'to', header: 'To', render: (row) => row.to },
      { key: 'days', header: 'Days', align: 'right', render: (row) => row.days },
      { key: 'reason', header: 'Reason', render: (row) => row.reason },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <Badge tone={STATUS_TONE[row.status]}>{LEAVE_STATUS_LABEL[row.status]}</Badge>,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (row) => (
          <div className="flex justify-end gap-1">
            {row.status === 'pending' ? (
              <IconButton
                icon="check"
                label={`Review ${row.employeeName} leave request`}
                size="sm"
                onClick={() => {
                  setReviewError(null);
                  setReviewing(row);
                }}
              />
            ) : null}
            {row.status === 'pending' || row.status === 'approved' ? (
              <IconButton
                icon="close"
                label={`Cancel ${row.employeeName} leave request`}
                size="sm"
                onClick={() => setCancelling(row)}
              />
            ) : null}
          </div>
        ),
      },
    ],
    [],
  );

  const totalRemaining = balance.data?.reduce((total, entry) => total + entry.remaining, 0) ?? 0;
  const totalPending = balance.data?.reduce((total, entry) => total + entry.pending, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaves"
        description="Apply for leave, track your balance, and review requests waiting for a decision."
        actions={
          <Button icon="plus" onClick={() => setApplyOpen(true)}>
            Apply for leave
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Leave days remaining" value={totalRemaining} icon="calendar" staggerIndex={0} />
        <StatCard label="Days pending approval" value={totalPending} icon="clock" staggerIndex={1} />
        <StatCard label="My pending requests" value={myRequests.filter((item) => item.status === 'pending').length} icon="inbox" staggerIndex={2} />
        <StatCard label="Requests in inbox" value={canApprove ? pendingInbox.length : 0} icon="users" staggerIndex={3} />
      </div>

      <SectionCard title="My leave balance" description="Entitled, used, pending and remaining days per leave type.">
        <DataTable
          caption="My leave balance"
          columns={balanceColumns}
          rows={balance.data ?? []}
          rowKey={(row) => row.leaveType}
          loading={balance.loading}
          error={balance.error}
          {...(balance.error ? { onRetry: balance.reload } : {})}
          emptyTitle="No leave balance yet"
          emptyDescription="Your HR partner has not assigned a leave balance."
        />
      </SectionCard>

      <SectionCard title="My leave history" description="Newest request first.">
        {requests.loading ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading your leave history…
          </p>
        ) : requests.error ? (
          <DataTable
            caption="My leave requests"
            columns={inboxColumns}
            rows={[]}
            rowKey={(row) => row.id}
            error={requests.error}
            onRetry={requests.reload}
          />
        ) : myRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You have not applied for any leave yet. Use “Apply for leave” to raise your first request.
          </p>
        ) : (
          <LeaveTimeline requests={myRequests} />
        )}
      </SectionCard>

      {canApprove ? (
        <SectionCard
          title="Approval inbox"
          description="Every pending request across the organisation. Decisions are audited."
          actions={<Badge tone="warning">{pendingInbox.length} pending</Badge>}
        >
          <DataTable
            caption="Leave approval inbox"
            columns={inboxColumns}
            rows={pendingInbox}
            rowKey={(row) => row.id}
            loading={requests.loading}
            error={requests.error}
            {...(requests.error ? { onRetry: requests.reload } : {})}
            emptyTitle="Inbox is clear"
            emptyDescription="No leave request is waiting for a decision."
          />
        </SectionCard>
      ) : null}

      <LeaveApplyModal
        open={applyOpen}
        busy={applying}
        serverError={applyError}
        onClose={() => {
          if (!applying) {
            setApplyOpen(false);
          }
        }}
        onSubmit={handleApply}
      />

      <LeaveReviewModal
        open={reviewing !== null}
        request={reviewing}
        busy={reviewBusy}
        serverError={reviewError}
        onClose={() => {
          if (!reviewBusy) {
            setReviewing(null);
          }
        }}
        onReview={handleReview}
      />

      <ConfirmDialog
        open={cancelling !== null}
        title="Cancel leave request"
        confirmLabel="Cancel leave"
        message={
          cancelling ? (
            <p>
              Cancel the {cancelling.leaveType} request for {cancelling.from} → {cancelling.to}? The days return
              to your balance once the request is cancelled.
            </p>
          ) : null
        }
        busy={cancelBusy}
        onConfirm={handleCancel}
        onClose={() => {
          if (!cancelBusy) {
            setCancelling(null);
          }
        }}
      />
    </div>
  );
}
