import { ApiError } from './errors';
import type {
  ApiClient,
  Employee,
  EmployeeDashboardData,
  HrisMetrics,
  LeaveBalance,
  Session,
  User,
} from './types';

export const DEMO_PASSWORD = 'demo-pass-1';

interface SeedUser extends User {
  password: string;
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

const SEED_EMPLOYEES: Employee[] = SEED_USERS.filter((user) => user.employeeId).map((user, index) => ({
  id: `emp-${user.employeeId?.toLowerCase()}`,
  employeeId: user.employeeId as string,
  fullName: user.fullName,
  email: user.email,
  department: user.department as string,
  designation: user.designation as string,
  status: index === 3 ? 'on_leave' : 'active',
  workLocation: user.workLocation as string,
  dateOfJoining: user.dateOfJoining as string,
  reportingManager: index === 0 ? null : 'Aarav Menon',
}));

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

const SEED_METRICS: HrisMetrics = {
  totalEmployees: SEED_EMPLOYEES.length,
  activeEmployees: SEED_EMPLOYEES.filter((employee) => employee.status === 'active').length,
  employeesOnLeave: SEED_EMPLOYEES.filter((employee) => employee.status === 'on_leave').length,
  newJoinersThisMonth: 2,
  pendingLeaveRequests: 7,
  presentToday: 5,
  departments: 4,
  openAuditEvents: 3,
  activeUsers: 6,
  policiesPublished: 4,
};

const EMPLOYEE_DASHBOARD: EmployeeDashboardData = {
  attendance: {
    status: 'present',
    checkIn: '09:12',
    checkOut: null,
    workHours: 0,
  },
  leaveBalance: SEED_LEAVE_BALANCE['usr-emp-1'],
  upcomingHolidays: [
    { name: 'Independence Day', date: '2026-08-15' },
    { name: 'Gandhi Jayanti', date: '2026-10-02' },
    { name: 'Deepavali', date: '2026-11-08' },
  ],
  pendingRequests: 1,
  onboardingComplete: true,
  announcements: [
    {
      id: 'ann-1',
      title: 'All-hands on Friday at 16:00',
      publishedOn: '2026-07-28',
      audience: 'employee',
    },
    {
      id: 'ann-2',
      title: 'New leave policy effective next month',
      publishedOn: '2026-07-20',
      audience: 'employee',
    },
  ],
};

const HR_DASHBOARD = {
  metrics: SEED_METRICS,
  departmentHeadcount: [
    { department: 'Engineering', headcount: 2 },
    { department: 'Finance', headcount: 1 },
    { department: 'Sales', headcount: 1 },
    { department: 'Human Resources', headcount: 1 },
  ],
  pendingApprovals: [
    { id: 'lv-1', employeeName: 'Priya Singh', leaveType: 'Earned', from: '2026-08-03', to: '2026-08-07' },
    { id: 'lv-2', employeeName: 'Dev Kapoor', leaveType: 'Sick', from: '2026-07-30', to: '2026-07-30' },
    { id: 'lv-3', employeeName: 'Sana Rao', leaveType: 'Casual', from: '2026-08-11', to: '2026-08-12' },
  ],
};

const ADMIN_DASHBOARD = {
  metrics: SEED_METRICS,
  departmentHeadcount: HR_DASHBOARD.departmentHeadcount,
  recentAuditEvents: [
    {
      id: 'aud-1',
      action: 'LEAVE_APPROVE',
      actor: 'Meera Iyer',
      role: 'hr' as const,
      occurredAt: '2026-07-29T09:41:00Z',
      status: 'success' as const,
    },
    {
      id: 'aud-2',
      action: 'EMPLOYEE_DELETE',
      actor: 'Rahul Kumar',
      role: 'employee' as const,
      occurredAt: '2026-07-29T09:12:00Z',
      status: 'denied' as const,
    },
    {
      id: 'aud-3',
      action: 'POLICY_UPDATE',
      actor: 'Aarav Menon',
      role: 'admin' as const,
      occurredAt: '2026-07-28T17:05:00Z',
      status: 'success' as const,
    },
  ],
  accessSummary: [
    { role: 'admin' as const, userCount: 1 },
    { role: 'hr' as const, userCount: 1 },
    { role: 'employee' as const, userCount: 4 },
  ],
};

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

export const MOCK_TOKEN_PREFIX = 'mock-token-';

export function createMockAdapter(latencyMs = 0): ApiClient {
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

    async listEmployees(accessToken) {
      const user = authenticate(accessToken);
      if (user.role === 'employee') {
        return respond(SEED_EMPLOYEES.filter((employee) => employee.email === user.email));
      }
      requireRole(user, ['admin', 'hr']);
      return respond(SEED_EMPLOYEES);
    },

    async getLeaveBalance(accessToken) {
      const user = authenticate(accessToken);
      return respond(SEED_LEAVE_BALANCE[user.id] ?? []);
    },

    async getEmployeeDashboard(accessToken) {
      const user = authenticate(accessToken);
      return respond({
        ...EMPLOYEE_DASHBOARD,
        leaveBalance: SEED_LEAVE_BALANCE[user.id] ?? [],
      });
    },

    async getHrDashboard(accessToken) {
      const user = authenticate(accessToken);
      requireRole(user, ['admin', 'hr']);
      return respond(HR_DASHBOARD);
    },

    async getAdminDashboard(accessToken) {
      const user = authenticate(accessToken);
      requireRole(user, ['admin']);
      return respond(ADMIN_DASHBOARD);
    },
  };
}

export const mockSeedUsers = SEED_USERS.map(toPublicUser);
export const mockSeedEmployees = SEED_EMPLOYEES;
