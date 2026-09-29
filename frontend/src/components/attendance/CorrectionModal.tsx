import { useState } from 'react';

import {
  ATTENDANCE_STATUS_LABEL,
  type AttendanceCorrectionInput,
  type AttendanceRecord,
  type AttendanceStatus,
} from '../../api/types';
import { Button } from '../ui/Button';
import { SelectField, TextField } from '../ui/Field';
import { Modal } from '../ui/Modal';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const STATUS_OPTIONS = (Object.keys(ATTENDANCE_STATUS_LABEL) as AttendanceStatus[]).map((value) => ({
  value,
  label: ATTENDANCE_STATUS_LABEL[value],
}));

const NEEDS_TIME: AttendanceStatus[] = ['present', 'absent', 'on_leave'];

export interface CorrectionModalProps {
  open: boolean;
  record: AttendanceRecord | null;
  busy?: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (input: AttendanceCorrectionInput) => void;
}

export function CorrectionModal(props: CorrectionModalProps) {
  return props.open && props.record ? (
    <CorrectionDialog key={props.record.id} {...props} record={props.record} />
  ) : null;
}

function CorrectionDialog({
  record,
  busy = false,
  serverError = null,
  onClose,
  onSubmit,
}: CorrectionModalProps) {
  const [status, setStatus] = useState<AttendanceStatus>(record ? record.status : 'present');
  const [checkIn, setCheckIn] = useState(record?.checkIn ?? '');
  const [checkOut, setCheckOut] = useState(record?.checkOut ?? '');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ checkIn?: string; checkOut?: string; reason?: string }>({});

  const handleSubmit = () => {
    const next: { checkIn?: string; checkOut?: string; reason?: string } = {};
    if (reason.trim().length < 5) {
      next.reason = 'Explain the correction in at least five characters.';
    }
    if (NEEDS_TIME.includes(status)) {
      if (!TIME_PATTERN.test(checkIn.trim())) {
        next.checkIn = 'Use a 24-hour time such as 09:30.';
      }
      if (!TIME_PATTERN.test(checkOut.trim())) {
        next.checkOut = 'Use a 24-hour time such as 18:30.';
      }
      if (
        TIME_PATTERN.test(checkIn.trim()) &&
        TIME_PATTERN.test(checkOut.trim()) &&
        checkOut.trim() <= checkIn.trim()
      ) {
        next.checkOut = 'Check out must be after check in.';
      }
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }
    onSubmit({
      attendanceId: record ? record.id : '',
      reason: reason.trim(),
      requestedStatus: status,
      requestedCheckIn: NEEDS_TIME.includes(status) ? checkIn.trim() : null,
      requestedCheckOut: NEEDS_TIME.includes(status) ? checkOut.trim() : null,
    });
  };

  return (
    <Modal
      open
      title="Attendance correction"
      description={
        record
          ? `${record.employeeName} · ${record.date} · currently ${ATTENDANCE_STATUS_LABEL[record.status]}`
          : undefined
      }
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={busy} icon={busy ? 'refresh' : 'check'}>
            {busy ? 'Saving…' : 'Submit correction'}
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
          label="Corrected status"
          name="requestedStatus"
          value={status}
          onChange={(value) => setStatus(value as AttendanceStatus)}
          options={STATUS_OPTIONS}
          required
        />
        {NEEDS_TIME.includes(status) ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Check in"
              name="checkIn"
              type="time"
              required
              value={checkIn}
              onChange={setCheckIn}
              error={errors.checkIn ?? null}
            />
            <TextField
              label="Check out"
              name="checkOut"
              type="time"
              required
              value={checkOut}
              onChange={setCheckOut}
              error={errors.checkOut ?? null}
            />
          </div>
        ) : null}
        <TextField
          label="Reason"
          name="reason"
          required
          value={reason}
          onChange={setReason}
          error={errors.reason ?? null}
          placeholder="Badge reader failure, approved late entry…"
          hint="The reason is stored in the audit log next to the previous and updated values."
        />
      </div>
    </Modal>
  );
}
