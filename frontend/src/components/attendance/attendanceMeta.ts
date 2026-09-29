import type { AttendanceStatus, AttendanceCorrection } from '../../api/types';
import type { BadgeTone } from '../ui/Badge';

export const ATTENDANCE_TONE: Record<AttendanceStatus, BadgeTone> = {
  present: 'success',
  absent: 'danger',
  on_leave: 'info',
  holiday: 'warning',
  weekend: 'neutral',
  not_marked: 'neutral',
};

export const CORRECTION_TONE: Record<AttendanceCorrection['status'], BadgeTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};
