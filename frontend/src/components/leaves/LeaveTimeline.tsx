import { LEAVE_STATUS_LABEL, type LeaveRequest, type LeaveRequestStatus } from '../../api/types';
import { Badge, type BadgeTone } from '../ui/Badge';
import { Icon, type IconName } from '../ui/Icon';

const STATUS_TONE: Record<LeaveRequestStatus, BadgeTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

const STATUS_ICON: Record<LeaveRequestStatus, IconName> = {
  pending: 'clock',
  approved: 'check',
  rejected: 'close',
  cancelled: 'info',
};

export interface LeaveTimelineProps {
  requests: readonly LeaveRequest[];
}

/** Vertical history of leave requests, newest first, as an ordered list. */
export function LeaveTimeline({ requests }: LeaveTimelineProps) {
  return (
    <ol className="space-y-3">
      {requests.map((request) => (
        <li key={request.id} className="relative rounded-control border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
                <Icon name={STATUS_ICON[request.status]} size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{request.leaveType}</p>
                <p className="text-xs text-muted-foreground">
                  {request.from} → {request.to} · {request.days} day{request.days === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <Badge tone={STATUS_TONE[request.status]}>{LEAVE_STATUS_LABEL[request.status]}</Badge>
          </div>
          <p className="mt-2 text-sm text-foreground">{request.reason}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Applied {request.appliedOn}
            {request.decidedBy ? ` · decided by ${request.decidedBy} on ${request.decidedOn}` : ''}
          </p>
          {request.decisionNote ? (
            <p className="mt-2 rounded-control bg-muted/70 p-2 text-xs text-foreground">
              <span className="font-semibold">Note:</span> {request.decisionNote}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
