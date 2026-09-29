import { ApiError } from './errors';
import type {
  AdminDashboardData,
  Announcement,
  ApiClient,
  AttendanceCorrection,
  AttendanceDay,
  AttendanceRecord,
  Designation,
  Department,
  Employee,
  EmployeeDashboardData,
  EmployeeInput,
  EmployeeStatus,
  EmploymentType,
  Holiday,
  HrisMetrics,
  HrDashboardData,
  LeaveBalance,
  LeaveRequest,
  MonthlyAttendance,
  PolicyDocument,
  PolicySummary,
  Session,
  User,
} from './types';

export const DEMO_PASSWORD = 'demo-pass-1';
export const MOCK_TOKEN_PREFIX = 'mock-token-';

interface SeedUser extends User {
  password: string;
}

interface MockStore {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  leaveBalances: Record<string, LeaveBalance[]>;
  attendanceOverrides: AttendanceOverrides;
  corrections: AttendanceCorrection[];
}

const SEED_USERS: SeedUser[] = [
  {
    id: 'usr-admin-1',
    email: 'admin@agentichrms.test',
    fullName: 'Aarav Menon',
    role: 'admin',
    department: 'Administration',
    designation: 'System Administrator',
    employeeId: 'EMP-1001',
    workLocation: 'Bengaluru HQ',
    dateOfJoining: '2019-04-01',
    password: DEMO_PASSWORD,
  },
  {
    id: 'usr-hr-1',
    email: 'hr@agentichrms.test',
    fullName: 'Meera Iyer',
    role: 'hr',
    department: 'Human Resources',
    designation: 'HR Business Partner',
    employeeId: 'EMP-1002',
    workLocation: 'Bengaluru HQ',
    dateOfJoining: '2020-07-15',
    password: DEMO_PASSWORD,
  },
  {
    id: 'usr-emp-1',
    email: 'employee@agentichrms.test',
    fullName: 'Rahul Kumar',
    role: 'employee',
    department: 'Engineering',
    designation: 'Software Engineer',
    employeeId: 'EMP-1003',
    workLocation: 'Bengaluru HQ',
    dateOfJoining: '2022-01-10',
    password: DEMO_PASSWORD,
  },
  {
    id: 'usr-emp-2',
    email: 'priya.singh@agentichrms.test',
    fullName: 'Priya Singh',
    role: 'employee',
    department: 'Engineering',
    designation: 'Senior Software Engineer',
    employeeId: 'EMP-1004',
    workLocation: 'Pune Campus',
    dateOfJoining: '2021-06-21',
    password: DEMO_PASSWORD,
  },
  {
    id: 'usr-emp-3',
    email: 'dev.kapoor@agentichrms.test',
    fullName: 'Dev Kapoor',
    role: 'employee',
    department: 'Finance',
    designation: 'Financial Analyst',
    employeeId: 'EMP-1005',
    workLocation: 'Bengaluru HQ',
    dateOfJoining: '2023-03-02',
    password: DEMO_PASSWORD,
  },
  {
    id: 'usr-emp-4',
    email: 'sana.rao@agentichrms.test',
    fullName: 'Sana Rao',
    role: 'employee',
    department: 'Sales',
    designation: 'Account Executive',
    employeeId: 'EMP-1006',
    workLocation: 'Mumbai Sales',
    dateOfJoining: '2022-11-07',
    password: DEMO_PASSWORD,
  },
];

const USER_ID_BY_EMPLOYEE_CODE: Record<string, string> = SEED_USERS.reduce(
  (map, user) => {
    if (user.employeeId) {
      map[user.employeeId] = user.id;
    }
    return map;
  },
  {} as Record<string, string>,
);

function buildSeedEmployees(): Employee[] {
  return SEED_USERS.map((user, index) => ({
    id: `emp-${user.employeeId?.toLowerCase()}`,
    employeeId: user.employeeId as string,
    fullName: user.fullName,
    email: user.email,
    phone: `+91 80 4000 ${1000 + index}`,
    dateOfJoining: user.dateOfJoining as string,
    department: user.department as string,
    designation: user.designation as string,
    reportingManager: index === 0 ? null : 'Aarav Menon',
    employmentType: (index === 3 ? 'contract' : index === 5 ? 'intern' : 'full_time') as EmploymentType,
    status: (index === 3 ? 'on_leave' : 'active') as EmployeeStatus,
    workLocation: user.workLocation as string,
    address: `${12 + index} Lake View Road, ${user.workLocation as string}`,
    emergencyContact: {
      name: index === 0 ? 'Anita Menon' : `Contact ${index + 1}`,
      relationship: index === 0 ? 'Spouse' : 'Parent',
      phone: `+91 80 5000 ${2000 + index}`,
    },
  }));
}

const SEED_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Engineering', head: 'Aarav Menon', headcount: 2 },
  { id: 'dept-2', name: 'Finance', head: 'Dev Kapoor', headcount: 1 },
  { id: 'dept-3', name: 'Sales', head: 'Sana Rao', headcount: 1 },
  { id: 'dept-4', name: 'Human Resources', head: 'Meera Iyer', headcount: 1 },
  { id: 'dept-5', name: 'Administration', head: 'Aarav Menon', headcount: 1 },
];

const SEED_DESIGNATIONS: Designation[] = [
  { id: 'desig-1', title: 'Software Engineer', department: 'Engineering' },
  { id: 'desig-2', title: 'Senior Software Engineer', department: 'Engineering' },
  { id: 'desig-3', title: 'Financial Analyst', department: 'Finance' },
  { id: 'desig-4', title: 'Account Executive', department: 'Sales' },
  { id: 'desig-5', title: 'HR Business Partner', department: 'Human Resources' },
  { id: 'desig-6', title: 'System Administrator', department: 'Administration' },
];

const SEED_LEAVE_BALANCE: Record<string, LeaveBalance[]> = {
  'usr-emp-1': [
    { leaveType: 'Casual', total: 12, used: 4, remaining: 8, pending: 0 },
    { leaveType: 'Sick', total: 10, used: 2, remaining: 8, pending: 0 },
    { leaveType: 'Earned', total: 18, used: 9, remaining: 9, pending: 2 },
    { leaveType: 'Work From Home', total: 24, used: 11, remaining: 13, pending: 0 },
  ],
  'usr-emp-2': [
    { leaveType: 'Casual', total: 12, used: 7, remaining: 5, pending: 0 },
    { leaveType: 'Earned', total: 18, used: 6, remaining: 12, pending: 0 },
  ],
  'usr-emp-3': [{ leaveType: 'Casual', total: 12, used: 1, remaining: 11, pending: 0 }],
};

const SEED_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'lv-1',
    employeeId: 'emp-emp-1004',
    employeeName: 'Priya Singh',
    department: 'Engineering',
    leaveType: 'Earned',
    from: '2026-08-03',
    to: '2026-08-07',
    days: 5,
    reason: 'Family holiday in Kochi.',
    status: 'pending',
    appliedOn: '2026-07-22',
    decidedBy: null,
    decidedOn: null,
    decisionNote: null,
  },
  {
    id: 'lv-2',
    employeeId: 'emp-emp-1005',
    employeeName: 'Dev Kapoor',
    department: 'Finance',
    leaveType: 'Sick',
    from: '2026-07-30',
    to: '2026-07-30',
    days: 1,
    reason: 'Medical appointment.',
    status: 'pending',
    appliedOn: '2026-07-29',
    decidedBy: null,
    decidedOn: null,
    decisionNote: null,
  },
  {
    id: 'lv-3',
    employeeId: 'emp-emp-1006',
    employeeName: 'Sana Rao',
    department: 'Sales',
    leaveType: 'Casual',
    from: '2026-08-11',
    to: '2026-08-12',
    days: 2,
    reason: 'Personal work.',
    status: 'pending',
    appliedOn: '2026-07-25',
    decidedBy: null,
    decidedOn: null,
    decisionNote: null,
  },
  {
    id: 'lv-4',
    employeeId: 'emp-emp-1003',
    employeeName: 'Rahul Kumar',
    department: 'Engineering',
    leaveType: 'Earned',
    from: '2026-08-19',
    to: '2026-08-20',
    days: 2,
    reason: 'Long weekend.',
    status: 'pending',
    appliedOn: '2026-07-26',
    decidedBy: null,
    decidedOn: null,
    decisionNote: null,
  },
  {
    id: 'lv-5',
    employeeId: 'emp-emp-1003',
    employeeName: 'Rahul Kumar',
    department: 'Engineering',
    leaveType: 'Casual',
    from: '2026-06-11',
    to: '2026-06-11',
    days: 1,
    reason: 'Bank appointment.',
    status: 'approved',
    appliedOn: '2026-06-08',
    decidedBy: 'Meera Iyer',
    decidedOn: '2026-06-09',
    decisionNote: 'Enjoy.',
  },
  {
    id: 'lv-6',
    employeeId: 'emp-emp-1003',
    employeeName: 'Rahul Kumar',
    department: 'Engineering',
    leaveType: 'Sick',
    from: '2026-05-04',
    to: '2026-05-05',
    days: 2,
    reason: 'Fever.',
    status: 'rejected',
    appliedOn: '2026-05-03',
    decidedBy: 'Meera Iyer',
    decidedOn: '2026-05-03',
    decisionNote: 'Medical certificate required.',
  },
];

const SEED_POLICIES: PolicyDocument[] = [
  {
    id: 'pol-wfh',
    title: 'Work From Home Policy',
    category: 'Attendance',
    summary: 'Eligibility, request process and limits for hybrid work.',
    version: '3.1',
    updatedOn: '2026-07-01',
    audience: ['admin', 'hr', 'employee'],
    sections: [
      {
        id: 'wfh-1',
        heading: 'Scope',
        body: 'This policy applies to all full-time employees after their probation period. Contractors and interns follow the terms in their engagement letter instead.',
      },
      {
        id: 'wfh-2',
        heading: 'Eligibility',
        body: 'Employees may work from home up to two days per week, subject to team coverage. A maximum of eight work-from-home days may be carried over in a calendar quarter.',
      },
      {
        id: 'wfh-3',
        heading: 'Request process',
        body: 'Requests are made through the leave module by selecting the Work From Home leave type at least one working day in advance. Requests are auto-approved when the team coverage limit is not exceeded.',
      },
      {
        id: 'wfh-4',
        heading: 'Availability',
        body: 'Employees must keep their calendar current, join scheduled meetings, and remain reachable during the core hours of 10:00 to 16:00 local time.',
      },
    ],
  },
  {
    id: 'pol-leave',
    title: 'Leave Policy',
    category: 'Leave',
    summary: 'Leave entitlements, carry forward and approval rules.',
    version: '4.0',
    updatedOn: '2026-07-15',
    audience: ['admin', 'hr', 'employee'],
    sections: [
      {
        id: 'lv-p-1',
        heading: 'Entitlements',
        body: 'Casual leave of 12 days, sick leave of 10 days and earned leave of 18 days are granted per calendar year to every full-time employee.',
      },
      {
        id: 'lv-p-2',
        heading: 'Carry forward',
        body: 'Up to 15 days of unused earned leave may be carried into the next financial year. All other leave lapses on 31 March.',
      },
      {
        id: 'lv-p-3',
        heading: 'Approval',
        body: 'Requests of three days or more require HR approval. Requests below three days are approved by the reporting manager.',
      },
    ],
  },
  {
    id: 'pol-attendance',
    title: 'Attendance & Time Recording',
    category: 'Attendance',
    summary: 'Check-in windows, late marking and correction rules.',
    version: '2.6',
    updatedOn: '2026-06-20',
    audience: ['admin', 'hr', 'employee'],
    sections: [
      {
        id: 'at-1',
        heading: 'Working window',
        body: 'The standard working day is 09:30 to 18:30 with a one-hour break. Check-in is permitted between 08:30 and 11:00.',
      },
      {
        id: 'at-2',
        heading: 'Corrections',
        body: 'Missed punches may be corrected by HR through the attendance module. Every correction is recorded in the audit log with the previous and updated values.',
      },
    ],
  },
  {
    id: 'pol-conduct',
    title: 'Code of Conduct',
    category: 'Workplace',
    summary: 'Expected professional behaviour and escalation paths.',
    version: '5.2',
    updatedOn: '2026-05-30',
    audience: ['admin', 'hr', 'employee'],
    sections: [
      {
        id: 'cc-1',
        heading: 'Professional behaviour',
        body: 'Every employee is expected to treat colleagues, customers and partners with respect, and to avoid conduct that could reasonably be considered harassment or discrimination.',
      },
      {
        id: 'cc-2',
        heading: 'Escalation',
        body: 'Concerns may be raised with the reporting manager or directly with Human Resources. Retaliation against a reporter is itself a disciplinary matter.',
      },
    ],
  },
  {
    id: 'pol-security',
    title: 'Information Security',
    category: 'Security',
    summary: 'Device, credential and data handling requirements.',
    version: '1.8',
    updatedOn: '2026-04-18',
    audience: ['admin', 'hr', 'employee'],
    sections: [
      {
        id: 'sec-1',
        heading: 'Credentials',
        body: 'Passwords must be unique per system and stored in the approved password manager. Multi-factor authentication is mandatory for all administrative accounts.',
      },
      {
        id: 'sec-2',
        heading: 'Data handling',
        body: 'Employee personal data may only be accessed by roles that require it for their duties. Exports must be encrypted and removed once the purpose is complete.',
      },
    ],
  },
  {
    id: 'pol-admin',
    title: 'Role & Permission Administration',
    category: 'Security',
    summary: 'How roles, permissions and access reviews are managed.',
    version: '1.2',
    updatedOn: '2026-04-02',
    audience: ['admin', 'hr'],
    sections: [
      {
        id: 'ra-1',
        heading: 'Role definitions',
        body: 'Three roles exist: Admin, HR and Employee. Only Admins may change the role attached to a user, and every such change is audited.',
      },
      {
        id: 'ra-2',
        heading: 'Access reviews',
        body: 'Administrative access is reviewed every quarter. Accounts that have not been used for 60 days are disabled automatically.',
      },
    ],
  },
];

const SEED_HOLIDAYS: Holiday[] = [
  { id: 'hol-1', name: 'Independence Day', date: '2026-08-15', type: 'public', regions: ['All'] },
  { id: 'hol-2', name: 'Gandhi Jayanti', date: '2026-10-02', type: 'public', regions: ['All'] },
  { id: 'hol-3', name: 'Deepavali', date: '2026-11-08', type: 'restricted', regions: ['Karnataka'] },
  { id: 'hol-4', name: 'Company Rejuvenation Day', date: '2026-12-24', type: 'company', regions: ['All'] },
  { id: 'hol-5', name: 'Republic Day', date: '2027-01-26', type: 'public', regions: ['All'] },
];

const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'All-hands on Friday at 16:00',
    body: 'Join the leadership all-hands in the Bengaluru auditorium or over the video bridge. Agenda and joining details are on the intranet.',
    publishedOn: '2026-07-28',
    audience: ['admin', 'hr', 'employee'],
    pinned: true,
  },
  {
    id: 'ann-2',
    title: 'New leave policy effective next month',
    body: 'The revised leave policy raises casual leave from 10 to 12 days and tightens the carry-forward limit to 15 earned days.',
    publishedOn: '2026-07-20',
    audience: ['admin', 'hr', 'employee'],
    pinned: false,
  },
  {
    id: 'ann-3',
    title: 'Security awareness session',
    body: 'A mandatory 30-minute session on credential hygiene runs next Tuesday. Attendance is tracked by HR.',
    publishedOn: '2026-07-14',
    audience: ['admin', 'hr', 'employee'],
    pinned: false,
  },
  {
    id: 'ann-4',
    title: 'Admin: quarterly access review',
    body: 'Administrators must confirm privileged account usage before the end of the quarter. Unused accounts are disabled automatically.',
    publishedOn: '2026-07-10',
    audience: ['admin'],
    pinned: false,
  },
];

/* -------------------------------------------------------------------------- */
/* Deterministic attendance generation                                         */
/* -------------------------------------------------------------------------- */

const HOLIDAY_DATES = new Set(SEED_HOLIDAYS.map((holiday) => holiday.date));

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) % 100_000;
  }
  return result;
}

function minutesOfDay(hour: number, minute: number): string {
  return `${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}`;
}

export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

export function currentMonth(): string {
  return todayIsoDate().slice(0, 7);
}

function baseDayFor(employeeId: string, isoDate: string): AttendanceDay {
  const weekday = new Date(`${isoDate}T00:00:00`).getDay();
  const noise = hash(`${employeeId}:${isoDate}`);

  // Today is seeded as "checked in, not checked out" for every employee so the
  // check-in/check-out widget always has a deterministic starting state.
  if (isoDate === todayIsoDate()) {
    return {
      date: isoDate,
      status: 'present',
      checkIn: '09:12',
      checkOut: null,
      workHours: 0,
      note: null,
      corrected: false,
    };
  }

  if (weekday === 0 || weekday === 6) {
    return {
      date: isoDate,
      status: 'weekend',
      checkIn: null,
      checkOut: null,
      workHours: 0,
      note: null,
      corrected: false,
    };
  }

  if (HOLIDAY_DATES.has(isoDate)) {
    return {
      date: isoDate,
      status: 'holiday',
      checkIn: null,
      checkOut: null,
      workHours: 0,
      note: 'Company holiday',
      corrected: false,
    };
  }

  if (noise % 23 === 0) {
    return {
      date: isoDate,
      status: 'absent',
      checkIn: null,
      checkOut: null,
      workHours: 0,
      note: 'No check-in recorded',
      corrected: false,
    };
  }

  if (noise % 19 === 0) {
    return {
      date: isoDate,
      status: 'on_leave',
      checkIn: null,
      checkOut: null,
      workHours: 0,
      note: 'Approved leave',
      corrected: false,
    };
  }

  const checkInHour = 9;
  const checkInMinute = 2 + (noise % 26);
  const late = noise % 31 === 0;
  const checkIn = minutesOfDay(checkInHour, late ? 42 : checkInMinute);
  const checkOut = minutesOfDay(18, 5 + (noise % 40));
  const start = checkInHour * 60 + checkInMinute;
  const end = 18 * 60 + (5 + (noise % 40));
  return {
    date: isoDate,
    status: 'present',
    checkIn,
    checkOut,
    workHours: Math.round(((end - start - 60) / 60) * 10) / 10,
    note: late ? 'Marked late' : null,
    corrected: false,
  };
}

function daysInMonth(month: string): string[] {
  const [year, monthPart] = month.split('-').map((part) => Number.parseInt(part, 10));
  const total = new Date(year, monthPart, 0).getDate();
  const today = todayIsoDate();
  const days: string[] = [];
  for (let day = 1; day <= total; day += 1) {
    const isoDate = `${`${year}`.padStart(4, '0')}-${`${monthPart}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
    if (isoDate <= today) {
      days.push(isoDate);
    }
  }
  return days;
}

type AttendanceOverrides = Record<string, Partial<AttendanceDay>>;

function overrideKey(employeeId: string, isoDate: string): string {
  return `${employeeId}|${isoDate}`;
}

function toPublicUser(user: SeedUser): User {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    department: user.department,
    designation: user.designation,
    employeeId: user.employeeId,
    workLocation: user.workLocation,
    dateOfJoining: user.dateOfJoining,
  };
}

function countLeaveDays(from: string, to: string, halfDay: boolean): number {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }
  let total = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) {
      total += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return Math.max(total, 1) - (halfDay && total > 1 ? 0.5 : 0);
}

function toPolicySummary(policy: PolicyDocument): PolicySummary {
  return {
    id: policy.id,
    title: policy.title,
    category: policy.category,
    summary: policy.summary,
    version: policy.version,
    updatedOn: policy.updatedOn,
    audience: policy.audience,
  };
}

export function createMockAdapter(latencyMs = 0): ApiClient {
  const store: MockStore = {
    employees: buildSeedEmployees(),
    leaveRequests: SEED_LEAVE_REQUESTS.map((request) => ({ ...request })),
    leaveBalances: SEED_LEAVE_BALANCE,
    attendanceOverrides: {},
    corrections: [
      {
        id: 'corr-1',
        attendanceId: 'emp-emp-1003|2026-07-24',
        employeeId: 'emp-emp-1003',
        employeeName: 'Rahul Kumar',
        date: '2026-07-24',
        reason: 'Badge reader was down at the Bengaluru gate.',
        requestedStatus: 'present',
        requestedCheckIn: '09:15',
        requestedCheckOut: '18:20',
        status: 'pending',
        decidedBy: null,
        decidedOn: null,
      },
    ],
  };

  const authenticate = (accessToken: string): SeedUser => {
    const userId = accessToken.startsWith(MOCK_TOKEN_PREFIX)
      ? accessToken.slice(MOCK_TOKEN_PREFIX.length)
      : '';
    const user = SEED_USERS.find((candidate) => candidate.id === userId);
    if (!user) {
      throw new ApiError(401, 'Not authenticated');
    }
    return user;
  };

  const respond = <T>(payload: T): Promise<T> =>
    new Promise((resolve) => {
      setTimeout(() => resolve(payload), latencyMs);
    });

  const fail = (status: number, message: string): Promise<never> =>
    new Promise((_resolve, reject) => {
      setTimeout(() => reject(new ApiError(status, message)), latencyMs);
    });

  const requireRole = (user: SeedUser, allowed: User['role'][]): void => {
    if (!allowed.includes(user.role)) {
      throw new ApiError(403, 'Not enough permissions');
    }
  };

  const employeeForUser = (user: SeedUser): Employee => {
    const found = store.employees.find(
      (employee) => employee.employeeId === user.employeeId || employee.email === user.email,
    );
    if (!found) {
      throw new ApiError(404, 'Employee record not found');
    }
    return found;
  };

  const dayFor = (employeeId: string, isoDate: string): AttendanceDay => {
    const base = baseDayFor(employeeId, isoDate);
    const override = store.attendanceOverrides[overrideKey(employeeId, isoDate)];
    return override ? { ...base, ...override } : base;
  };

  const monthDays = (employeeId: string, month: string): AttendanceDay[] =>
    daysInMonth(month).map((isoDate) => dayFor(employeeId, isoDate));

  const summarise = (days: AttendanceDay[]) => ({
    present: days.filter((day) => day.status === 'present').length,
    absent: days.filter((day) => day.status === 'absent').length,
    onLeave: days.filter((day) => day.status === 'on_leave').length,
    holiday: days.filter((day) => day.status === 'holiday').length,
    weekend: days.filter((day) => day.status === 'weekend').length,
    totalHours:
      Math.round(days.reduce((total, day) => total + day.workHours, 0) * 10) / 10,
  });

  const buildMetrics = (): HrisMetrics => {
    const today = todayIsoDate();
    const joinersThisMonth = store.employees.filter(
      (employee) => employee.dateOfJoining.slice(0, 7) === today.slice(0, 7),
    ).length;
    const presentToday = store.employees.filter(
      (employee) => dayFor(employee.id, today).status === 'present',
    ).length;
    return {
      totalEmployees: store.employees.length,
      activeEmployees: store.employees.filter((employee) => employee.status === 'active').length,
      employeesOnLeave: store.employees.filter((employee) => employee.status === 'on_leave').length,
      newJoinersThisMonth: Math.max(joinersThisMonth, 2),
      pendingLeaveRequests: store.leaveRequests.filter((request) => request.status === 'pending')
        .length,
      presentToday,
      departments: SEED_DEPARTMENTS.length,
      openAuditEvents: store.corrections.filter((item) => item.status === 'pending').length,
      activeUsers: SEED_USERS.length,
      policiesPublished: SEED_POLICIES.length,
    };
  };

  const headcount = (): Array<{ department: string; headcount: number }> =>
    SEED_DEPARTMENTS.map((department) => ({
      department: department.name,
      headcount: store.employees.filter((employee) => employee.department === department.name)
        .length,
    }));

  const employeeDashboard = (user: SeedUser): EmployeeDashboardData => {
    const today = todayIsoDate();
    const day = dayFor(employeeForUser(user).id, today);
    return {
      attendance: {
        status: day.status === 'present' || day.status === 'absent' || day.status === 'on_leave'
          ? day.status
          : 'not_marked',
        checkIn: day.checkIn,
        checkOut: day.checkOut,
        workHours: day.workHours,
      },
      leaveBalance: store.leaveBalances[user.id] ?? [],
      upcomingHolidays: SEED_HOLIDAYS.slice(0, 3).map((holiday) => ({
        name: holiday.name,
        date: holiday.date,
      })),
      pendingRequests: store.leaveRequests.filter(
        (request) => request.employeeName === user.fullName && request.status === 'pending',
      ).length,
      onboardingComplete: true,
      announcements: SEED_ANNOUNCEMENTS.filter((item) => item.audience.includes(user.role))
        .slice(0, 2)
        .map((item) => ({
          id: item.id,
          title: item.title,
          publishedOn: item.publishedOn,
          audience: user.role,
        })),
    };
  };

  const hrDashboard = (): HrDashboardData => ({
    metrics: buildMetrics(),
    departmentHeadcount: headcount(),
    pendingApprovals: store.leaveRequests
      .filter((request) => request.status === 'pending')
      .slice(0, 3)
      .map((request) => ({
        id: request.id,
        employeeName: request.employeeName,
        leaveType: request.leaveType,
        from: request.from,
        to: request.to,
      })),
  });

  const adminDashboard = (): AdminDashboardData => ({
    metrics: buildMetrics(),
    departmentHeadcount: headcount(),
    recentAuditEvents: [
      {
        id: 'aud-1',
        action: 'LEAVE_APPROVE',
        actor: 'Meera Iyer',
        role: 'hr',
        occurredAt: '2026-07-29T09:41:00Z',
        status: 'success',
      },
      {
        id: 'aud-2',
        action: 'EMPLOYEE_DELETE',
        actor: 'Rahul Kumar',
        role: 'employee',
        occurredAt: '2026-07-29T09:12:00Z',
        status: 'denied',
      },
      {
        id: 'aud-3',
        action: 'POLICY_UPDATE',
        actor: 'Aarav Menon',
        role: 'admin',
        occurredAt: '2026-07-28T17:05:00Z',
        status: 'success',
      },
    ],
    accessSummary: [
      { role: 'admin', userCount: SEED_USERS.filter((item) => item.role === 'admin').length },
      { role: 'hr', userCount: SEED_USERS.filter((item) => item.role === 'hr').length },
      { role: 'employee', userCount: SEED_USERS.filter((item) => item.role === 'employee').length },
    ],
  });

  const toInput = (
    input: EmployeeInput,
  ): Omit<Employee, 'id' | 'employeeId'> => ({
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    dateOfJoining: input.dateOfJoining,
    department: input.department,
    designation: input.designation,
    reportingManager: input.reportingManager,
    employmentType: input.employmentType,
    status: input.status,
    workLocation: input.workLocation,
    address: input.address.trim(),
    emergencyContact: {
      name: input.emergencyContactName.trim(),
      relationship: input.emergencyContactRelationship.trim(),
      phone: input.emergencyContactPhone.trim(),
    },
  });

  return {
    async login(credentials) {
      const user = SEED_USERS.find(
        (candidate) => candidate.email === credentials.email.trim().toLowerCase(),
      );
      if (!user || user.password !== credentials.password) {
        return fail(401, 'Invalid email or password');
      }
      const accessToken = `${MOCK_TOKEN_PREFIX}${user.id}`;
      const session: Session = { accessToken, tokenType: 'bearer', user: toPublicUser(user) };
      return respond(session);
    },

    async me(accessToken) {
      return respond(toPublicUser(authenticate(accessToken)));
    },

    async listEmployees(accessToken, filters) {
      const user = authenticate(accessToken);
      const scoped =
        user.role === 'employee'
          ? store.employees.filter((employee) => employee.email === user.email)
          : store.employees;
      const search = filters?.search?.trim().toLowerCase() ?? '';
      const department = filters?.department ?? '';
      const status = filters?.status ?? 'all';
      return respond(
        scoped.filter((employee) => {
          const matchesSearch =
            search.length === 0 ||
            employee.fullName.toLowerCase().includes(search) ||
            employee.employeeId.toLowerCase().includes(search) ||
            employee.email.toLowerCase().includes(search) ||
            employee.designation.toLowerCase().includes(search);
          const matchesDepartment = department.length === 0 || employee.department === department;
          const matchesStatus = status === 'all' || employee.status === status;
          return matchesSearch && matchesDepartment && matchesStatus;
        }),
      );
    },

    async getEmployee(accessToken, id) {
      const user = authenticate(accessToken);
      const employee = store.employees.find((candidate) => candidate.id === id);
      if (!employee) {
        return fail(404, 'Employee record not found');
      }
      if (user.role === 'employee' && employee.email !== user.email) {
        return fail(403, 'Not enough permissions');
      }
      return respond(employee);
    },

    async createEmployee(accessToken, input) {
      const user = authenticate(accessToken);
      requireRole(user, ['admin', 'hr']);
      if (store.employees.some((employee) => employee.email === input.email.trim())) {
        return fail(409, 'An employee with that email already exists');
      }
      const nextNumber = 1000 + store.employees.length + 1;
      const created: Employee = {
        id: `emp-emp-${nextNumber}`,
        employeeId: `EMP-${nextNumber}`,
        ...toInput(input),
      };
      store.employees = [...store.employees, created];
      return respond(created);
    },

    async updateEmployee(accessToken, id, input) {
      const user = authenticate(accessToken);
      requireRole(user, ['admin', 'hr']);
      const index = store.employees.findIndex((employee) => employee.id === id);
      if (index === -1) {
        return fail(404, 'Employee record not found');
      }
      const existing = store.employees[index];
      if (
        store.employees.some(
          (employee) => employee.email === input.email.trim() && employee.id !== id,
        )
      ) {
        return fail(409, 'An employee with that email already exists');
      }
      const updated: Employee = { ...existing, ...toInput(input) };
      store.employees = store.employees.map((employee, position) =>
        position === index ? updated : employee,
      );
      return respond(updated);
    },

    async deleteEmployee(accessToken, id) {
      const user = authenticate(accessToken);
      requireRole(user, ['admin']);
      const next = store.employees.filter((employee) => employee.id !== id);
      if (next.length === store.employees.length) {
        return fail(404, 'Employee record not found');
      }
      store.employees = next;
      return respond(undefined);
    },

    async listDepartments(accessToken) {
      const user = authenticate(accessToken);
      requireRole(user, ['admin', 'hr']);
      return respond(
        SEED_DEPARTMENTS.map((department) => ({
          ...department,
          headcount: store.employees.filter(
            (employee) => employee.department === department.name,
          ).length,
        })),
      );
    },

    async listDesignations(accessToken) {
      const user = authenticate(accessToken);
      requireRole(user, ['admin', 'hr']);
      return respond(SEED_DESIGNATIONS);
    },

    async getMyAttendance(accessToken, month) {
      const user = authenticate(accessToken);
      const employee = employeeForUser(user);
      const days = monthDays(employee.id, month);
      return respond({
        month,
        employee: {
          id: employee.id,
          employeeId: employee.employeeId,
          fullName: employee.fullName,
          department: employee.department,
        },
        days,
        summary: summarise(days),
      } satisfies MonthlyAttendance);
    },

    async checkIn(accessToken) {
      const user = authenticate(accessToken);
      const employee = employeeForUser(user);
      const today = todayIsoDate();
      const existing = dayFor(employee.id, today);
      if (existing.checkIn) {
        return fail(409, 'You have already checked in today');
      }
      const now = new Date();
      const updated: AttendanceDay = {
        ...existing,
        status: 'present',
        checkIn: minutesOfDay(now.getHours(), now.getMinutes()),
        checkOut: null,
        workHours: 0,
        note: null,
        corrected: false,
      };
      store.attendanceOverrides[overrideKey(employee.id, today)] = updated;
      return respond(updated);
    },

    async checkOut(accessToken) {
      const user = authenticate(accessToken);
      const employee = employeeForUser(user);
      const today = todayIsoDate();
      const existing = dayFor(employee.id, today);
      if (!existing.checkIn) {
        return fail(409, 'Check in before checking out');
      }
      if (existing.checkOut) {
        return fail(409, 'You have already checked out today');
      }
      const now = new Date();
      const checkOut = minutesOfDay(now.getHours(), now.getMinutes());
      const [inHour, inMinute] = (existing.checkIn as string).split(':').map((part) =>
        Number.parseInt(part, 10),
      );
      const [outHour, outMinute] = checkOut.split(':').map((part) => Number.parseInt(part, 10));
      const minutes = Math.max(outHour * 60 + outMinute - (inHour * 60 + inMinute) - 60, 0);
      const updated: AttendanceDay = {
        ...existing,
        checkOut,
        workHours: Math.round((minutes / 60) * 10) / 10,
      };
      store.attendanceOverrides[overrideKey(employee.id, today)] = updated;
      return respond(updated);
    },

    async listAttendance(accessToken, filters) {
      const user = authenticate(accessToken);
      requireRole(user, ['admin', 'hr']);
      const month = filters?.month ?? currentMonth();
      const scoped = filters?.employeeId
        ? store.employees.filter((employee) => employee.id === filters.employeeId)
        : store.employees;
      const records: AttendanceRecord[] = [];
      for (const employee of scoped) {
        for (const day of monthDays(employee.id, month)) {
          if (day.status === 'weekend' || day.status === 'not_marked') {
            continue;
          }
          records.push({
            id: `${employee.id}|${day.date}`,
            employeeId: employee.id,
            employeeName: employee.fullName,
            department: employee.department,
            date: day.date,
            status: day.status,
            checkIn: day.checkIn,
            checkOut: day.checkOut,
            workHours: day.workHours,
            corrected: day.corrected,
          });
        }
      }
      return respond(
        records.sort((left, right) => (left.date < right.date ? 1 : left.date > right.date ? -1 : 0)),
      );
    },

    async listCorrections(accessToken) {
      const user = authenticate(accessToken);
      requireRole(user, ['admin', 'hr']);
      return respond(store.corrections.map((item) => ({ ...item })));
    },

    async applyAttendanceCorrection(accessToken, input) {
      const user = authenticate(accessToken);
      const [employeeId, date] = input.attendanceId.split('|');
      const employee = store.employees.find((candidate) => candidate.id === employeeId);
      if (!employee) {
        return fail(404, 'Attendance record not found');
      }
      if (user.role === 'employee' && employee.email !== user.email) {
        return fail(403, 'Not enough permissions');
      }
      const current = dayFor(employee.id, date);
      store.attendanceOverrides[overrideKey(employee.id, date)] = {
        status: input.requestedStatus,
        checkIn: input.requestedCheckIn,
        checkOut: input.requestedCheckOut,
        workHours:
          input.requestedCheckIn && input.requestedCheckOut
            ? Math.max(
                Math.round(
                  ((toMinutes(input.requestedCheckOut) - toMinutes(input.requestedCheckIn) - 60) /
                    60) *
                    10,
                ) / 10,
                0,
              )
            : current.workHours,
        note: 'Corrected',
        corrected: true,
      };
      const correction: AttendanceCorrection = {
        id: `corr-${store.corrections.length + 1}`,
        attendanceId: input.attendanceId,
        employeeId: employee.id,
        employeeName: employee.fullName,
        date,
        reason: input.reason,
        requestedStatus: input.requestedStatus,
        requestedCheckIn: input.requestedCheckIn,
        requestedCheckOut: input.requestedCheckOut,
        status: 'pending',
        decidedBy: null,
        decidedOn: null,
      };
      store.corrections = [correction, ...store.corrections];
      return respond(correction);
    },

    async getLeaveBalance(accessToken) {
      const user = authenticate(accessToken);
      return respond(store.leaveBalances[user.id] ?? []);
    },

    async listLeaveRequests(accessToken) {
      const user = authenticate(accessToken);
      const scoped =
        user.role === 'employee'
          ? store.leaveRequests.filter((request) => request.employeeName === user.fullName)
          : store.leaveRequests;
      return respond(
        scoped.map((request) => ({ ...request })).sort((left, right) =>
          left.appliedOn < right.appliedOn ? 1 : -1,
        ),
      );
    },

    async applyForLeave(accessToken, input) {
      const user = authenticate(accessToken);
      const employee = employeeForUser(user);
      const days = countLeaveDays(input.from, input.to, input.halfDay);
      if (days === 0) {
        return fail(400, 'The end date must be on or after the start date');
      }
      const request: LeaveRequest = {
        id: `lv-${store.leaveRequests.length + 1}`,
        employeeId: employee.id,
        employeeName: employee.fullName,
        department: employee.department,
        leaveType: input.leaveType,
        from: input.from,
        to: input.to,
        days,
        reason: input.reason,
        status: 'pending',
        appliedOn: todayIsoDate(),
        decidedBy: null,
        decidedOn: null,
        decisionNote: null,
      };
      store.leaveRequests = [request, ...store.leaveRequests];
      const balances = store.leaveBalances[user.id] ?? [];
      const balance = balances.find((item) => item.leaveType === input.leaveType);
      if (balance) {
        balance.pending += days;
      } else {
        store.leaveBalances = {
          ...store.leaveBalances,
          [user.id]: [...balances, { leaveType: input.leaveType, total: 0, used: 0, remaining: 0, pending: days }],
        };
      }
      return respond(request);
    },

    async cancelLeave(accessToken, id) {
      const user = authenticate(accessToken);
      const request = store.leaveRequests.find((item) => item.id === id);
      if (!request) {
        return fail(404, 'Leave request not found');
      }
      const owns = request.employeeName === user.fullName;
      if (!owns) {
        requireRole(user, ['admin', 'hr']);
      }
      if (request.status !== 'pending' && request.status !== 'approved') {
        return fail(409, 'Only pending or approved requests can be cancelled');
      }
      const updated: LeaveRequest = {
        ...request,
        status: 'cancelled',
        decidedBy: user.fullName,
        decidedOn: todayIsoDate(),
        decisionNote: 'Cancelled by the requester.',
      };
      store.leaveRequests = store.leaveRequests.map((item) => (item.id === id ? updated : item));
      return respond(updated);
    },

    async reviewLeave(accessToken, id, decision) {
      const user = authenticate(accessToken);
      requireRole(user, ['admin', 'hr']);
      const request = store.leaveRequests.find((item) => item.id === id);
      if (!request) {
        return fail(404, 'Leave request not found');
      }
      if (request.status !== 'pending') {
        return fail(409, 'Only pending requests can be reviewed');
      }
      const updated: LeaveRequest = {
        ...request,
        status: decision.decision,
        decidedBy: user.fullName,
        decidedOn: todayIsoDate(),
        decisionNote: decision.note,
      };
      store.leaveRequests = store.leaveRequests.map((item) => (item.id === id ? updated : item));
      const userId = USER_ID_BY_EMPLOYEE_CODE[
        store.employees.find((employee) => employee.id === request.employeeId)?.employeeId ?? ''
      ];
      const balance = (userId ? store.leaveBalances[userId] : undefined)?.find(
        (item) => item.leaveType === request.leaveType,
      );
      if (balance) {
        balance.pending = Math.max(balance.pending - request.days, 0);
        if (decision.decision === 'approved') {
          balance.used += request.days;
          balance.remaining = Math.max(balance.total - balance.used, 0);
        }
      }
      return respond(updated);
    },

    async listPolicies(accessToken) {
      const user = authenticate(accessToken);
      return respond(
        SEED_POLICIES.filter((policy) => policy.audience.includes(user.role)).map(toPolicySummary),
      );
    },

    async getPolicy(accessToken, id) {
      const user = authenticate(accessToken);
      const policy = SEED_POLICIES.find((candidate) => candidate.id === id);
      if (!policy) {
        return fail(404, 'Policy document not found');
      }
      if (!policy.audience.includes(user.role)) {
        return fail(403, 'Not enough permissions');
      }
      return respond(policy);
    },

    async listHolidays(accessToken) {
      authenticate(accessToken);
      return respond(SEED_HOLIDAYS.map((holiday) => ({ ...holiday })));
    },

    async listAnnouncements(accessToken) {
      const user = authenticate(accessToken);
      return respond(
        SEED_ANNOUNCEMENTS.filter((item) => item.audience.includes(user.role)).map((item) => ({
          ...item,
        })),
      );
    },

    async getEmployeeDashboard(accessToken) {
      return respond(employeeDashboard(authenticate(accessToken)));
    },

    async getHrDashboard(accessToken) {
      const user = authenticate(accessToken);
      requireRole(user, ['admin', 'hr']);
      return respond(hrDashboard());
    },

    async getAdminDashboard(accessToken) {
      const user = authenticate(accessToken);
      requireRole(user, ['admin']);
      return respond(adminDashboard());
    },
  };
}

function toMinutes(value: string): number {
  const [hour, minute] = value.split(':').map((part) => Number.parseInt(part, 10));
  return hour * 60 + minute;
}

export const mockSeedUsers = SEED_USERS.map(toPublicUser);
export const mockSeedEmployees = buildSeedEmployees();
export { SEED_POLICIES, SEED_HOLIDAYS, SEED_ANNOUNCEMENTS };
