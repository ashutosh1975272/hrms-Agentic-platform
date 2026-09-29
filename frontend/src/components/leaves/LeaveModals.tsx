import { useState } from 'react';

import { LEAVE_STATUS_LABEL, LEAVE_TYPES, type LeaveInput, type LeaveRequest } from '../../api/types';
import { Button } from '../ui/Button';
import { CheckboxField, SelectField, TextField } from '../ui/Field';
import { Modal } from '../ui/Modal';

interface FormErrors {
  from?: string;
  to?: string;
  reason?: string;
}

export interface LeaveApplyModalProps {
  open: boolean;
  busy?: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (input: LeaveInput) => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function LeaveApplyModal(props: LeaveApplyModalProps) {
  return props.open ? <LeaveApplyDialog {...props} /> : null;
}

function LeaveApplyDialog({ busy = false, serverError = null, onClose, onSubmit }: LeaveApplyModalProps) {
  const [leaveType, setLeaveType] = useState<string>(LEAVE_TYPES[0]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');
  const [halfDay, setHalfDay] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = () => {
    const next: FormErrors = {};
    if (from.length === 0) {
      next.from = 'Choose the first day of leave.';
    } else if (from < todayIso()) {
      next.from = 'Leave cannot start in the past.';
    }
    if (to.length === 0) {
      next.to = 'Choose the last day of leave.';
    } else if (from.length > 0 && to < from) {
      next.to = 'The last day must be on or after the first day.';
    }
    if (reason.trim().length < 5) {
      next.reason = 'Add a short reason (at least five characters).';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }
    onSubmit({ leaveType, from, to, reason: reason.trim(), halfDay });
  };

  return (
    <Modal
      open
      title="Apply for leave"
      description="Requests of three days or more need HR approval. Shorter requests go to the reporting manager."
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={busy} icon={busy ? 'refresh' : 'send'}>
            {busy ? 'Submitting…' : 'Submit request'}
          </Button>
        </>
      }
    >
      {serverError ? (
        <p
          role="alert"
          className="mb-4 rounded-control border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive-strong"
        >
          {serverError}
        </p>
      ) : null}

      <div className="space-y-4">
        <SelectField
          label="Leave type"
          name="leaveType"
          required
          value={leaveType}
          onChange={setLeaveType}
          options={LEAVE_TYPES.map((value) => ({ value, label: value }))}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="From"
            name="from"
            type="date"
            required
            min={todayIso()}
            value={from}
            onChange={setFrom}
            error={errors.from ?? null}
          />
          <TextField
            label="To"
            name="to"
            type="date"
            required
            min={from.length > 0 ? from : todayIso()}
            value={to}
            onChange={setTo}
            error={errors.to ?? null}
          />
        </div>
        <TextField
          label="Reason"
          name="reason"
          required
          value={reason}
          onChange={setReason}
          error={errors.reason ?? null}
          placeholder="Family event, medical appointment…"
        />
        <CheckboxField
          label="This is a half-day request"
          name="halfDay"
          checked={halfDay}
          onChange={setHalfDay}
          hint="Half a day is deducted for a single-day request only."
        />
      </div>
    </Modal>
  );
}

export interface LeaveReviewModalProps {
  open: boolean;
  request: LeaveRequest | null;
  busy?: boolean;
  serverError?: string | null;
  onClose: () => void;
  onReview: (decision: 'approved' | 'rejected', note: string) => void;
}

export function LeaveReviewModal(props: LeaveReviewModalProps) {
  return props.open && props.request ? (
    <LeaveReviewDialog key={props.request.id} {...props} request={props.request} />
  ) : null;
}

function LeaveReviewDialog({
  request,
  busy = false,
  serverError = null,
  onClose,
  onReview,
}: LeaveReviewModalProps) {
  const [note, setNote] = useState('');

  return (
    <Modal
      open
      title="Review leave request"
      description={
        request
          ? `${request.employeeName} · ${request.leaveType} · ${request.from} to ${request.to} (${request.days} day${request.days === 1 ? '' : 's'})`
          : undefined
      }
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            icon="close"
            onClick={() => onReview('rejected', note)}
          >
            {busy ? 'Working…' : 'Reject'}
          </Button>
          <Button disabled={busy} icon="check" onClick={() => onReview('approved', note)}>
            {busy ? 'Working…' : 'Approve'}
          </Button>
        </>
      }
    >
      {serverError ? (
        <p
          role="alert"
          className="mb-4 rounded-control border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive-strong"
        >
          {serverError}
        </p>
      ) : null}

      <div className="space-y-4">
        {request ? (
          <dl className="grid gap-3 rounded-control bg-muted/60 p-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Status</dt>
              <dd className="mt-0.5 text-foreground">{LEAVE_STATUS_LABEL[request.status]}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Applied on</dt>
              <dd className="mt-0.5 text-foreground">{request.appliedOn}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Reason</dt>
              <dd className="mt-0.5 text-foreground">{request.reason}</dd>
            </div>
          </dl>
        ) : null}
        <TextField
          label="Decision note"
          name="decisionNote"
          value={note}
          onChange={setNote}
          placeholder="Shared with the employee and stored in the audit log"
        />
      </div>
    </Modal>
  );
}
