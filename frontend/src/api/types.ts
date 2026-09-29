export type Role = 'admin' | 'hr' | 'employee';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  department?: string;
  designation?: string;
  employeeId?: string;
  workLocation?: string;
  dateOfJoining?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Session {
  accessToken: string;
  tokenType: 'bearer';
  user: User;
}

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  status: 'active' | 'on_leave' | 'inactive';
  workLocation: string;
  dateOfJoining: string;
  reportingManager: string | null;
}

export interface LeaveBalance {
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
  pending: number;
}

export interface HrisMetrics {
  totalEmployees: number;
  activeEmployees: number;
  employeesOnLeave: number;
  newJoinersThisMonth: number;
  pendingLeaveRequests: number;
  presentToday: number;
  departments: number;
  openAuditEvents: number;
  activeUsers: number;
  policiesPublished: number;
}

export interface UpcomingHoliday {
  name: string;
  date: string;
}

export interface AttendanceSummary {
  status: 'present' | 'absent' | 'on_leave' | 'not_marked';
  checkIn: string | null;
  checkOut: string | null;
  workHours: number;
}

export interface Announcement {
  id: string;
  title: string;
  publishedOn: string;
  audience: Role;
}

export interface EmployeeDashboardData {
  attendance: AttendanceSummary;
  leaveBalance: LeaveBalance[];
  upcomingHolidays: UpcomingHoliday[];
  pendingRequests: number;
  onboardingComplete: boolean;
  announcements: Announcement[];
}

export interface HrDashboardData {
  metrics: HrisMetrics;
  departmentHeadcount: Array<{ department: string; headcount: number }>;
  pendingApprovals: Array<{
    id: string;
    employeeName: string;
    leaveType: string;
    from: string;
    to: string;
  }>;
}

export interface AdminDashboardData {
  metrics: HrisMetrics;
  departmentHeadcount: Array<{ department: string; headcount: number }>;
  recentAuditEvents: Array<{
    id: string;
    action: string;
    actor: string;
    role: Role;
    occurredAt: string;
    status: 'success' | 'denied';
  }>;
  accessSummary: Array<{ role: Role; userCount: number }>;
}

export interface ApiClient {
  login(credentials: LoginCredentials): Promise<Session>;
  me(accessToken: string): Promise<User>;
  listEmployees(accessToken: string): Promise<Employee[]>;
  getLeaveBalance(accessToken: string): Promise<LeaveBalance[]>;
  getEmployeeDashboard(accessToken: string): Promise<EmployeeDashboardData>;
  getHrDashboard(accessToken: string): Promise<HrDashboardData>;
  getAdminDashboard(accessToken: string): Promise<AdminDashboardData>;
}
