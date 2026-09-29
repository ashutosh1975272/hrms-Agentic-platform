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

/* -------------------------------------------------------------------------- */
/* 5.1 Employee management                                                     */
/* -------------------------------------------------------------------------- */

export type EmployeeStatus = 'active' | 'on_leave' | 'inactive';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';

export const EMPLOYEE_STATUS_LABEL: Record<EmployeeStatus, string> = {
  active: 'Active',
  on_leave: 'On leave',
  inactive: 'Inactive',
};

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  full_time: 'Full time',
  part_time: 'Part time',
  contract: 'Contract',
  intern: 'Intern',
};

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfJoining: string;
  department: string;
  designation: string;
  reportingManager: string | null;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  workLocation: string;
  address: string;
  emergencyContact: EmergencyContact;
}

export interface EmployeeInput {
  fullName: string;
  email: string;
  phone: string;
  dateOfJoining: string;
  department: string;
  designation: string;
  reportingManager: string | null;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  workLocation: string;
  address: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: EmployeeStatus | 'all';
}

export interface Department {
  id: string;
  name: string;
  head: string | null;
  headcount: number;
}

export interface Designation {
  id: string;
  title: string;
  department: string;
}

/* -------------------------------------------------------------------------- */
/* 5.3 Attendance management                                                   */
/* -------------------------------------------------------------------------- */

export type AttendanceStatus = 'present' | 'absent' | 'on_leave' | 'holiday' | 'weekend' | 'not_marked';

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  on_leave: 'On leave',
  holiday: 'Holiday',
  weekend: 'Weekend',
  not_marked: 'Not marked',
};

export interface AttendanceDay {
  date: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number;
  note: string | null;
  corrected: boolean;
}

export interface AttendanceSummaryCounts {
  present: number;
  absent: number;
  onLeave: number;
  holiday: number;
  weekend: number;
  totalHours: number;
}

export interface MonthlyAttendance {
  month: string;
  employee: { id: string; employeeId: string; fullName: string; department: string };
  days: AttendanceDay[];
  summary: AttendanceSummaryCounts;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number;
  corrected: boolean;
}

export interface AttendanceFilters {
  employeeId?: string;
  month?: string;
}

export type CorrectionStatus = 'pending' | 'approved' | 'rejected';

export interface AttendanceCorrection {
  id: string;
  attendanceId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  reason: string;
  requestedStatus: AttendanceStatus;
  requestedCheckIn: string | null;
  requestedCheckOut: string | null;
  status: CorrectionStatus;
  decidedBy: string | null;
  decidedOn: string | null;
}

export interface AttendanceCorrectionInput {
  attendanceId: string;
  reason: string;
  requestedStatus: AttendanceStatus;
  requestedCheckIn: string | null;
  requestedCheckOut: string | null;
}

/* -------------------------------------------------------------------------- */
/* 5.4 Leave management                                                        */
/* -------------------------------------------------------------------------- */

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export const LEAVE_STATUS_LABEL: Record<LeaveRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const LEAVE_TYPES = [
  'Casual',
  'Sick',
  'Earned',
  'Work From Home',
  'Maternity',
  'Paternity',
  'Bereavement',
  'Child Care',
] as const;

export interface LeaveBalance {
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
  pending: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveRequestStatus;
  appliedOn: string;
  decidedBy: string | null;
  decidedOn: string | null;
  decisionNote: string | null;
}

export interface LeaveInput {
  leaveType: string;
  from: string;
  to: string;
  reason: string;
  halfDay: boolean;
}

/* -------------------------------------------------------------------------- */
/* 5.5 Policies and knowledge management                                       */
/* -------------------------------------------------------------------------- */

export interface PolicySummary {
  id: string;
  title: string;
  category: string;
  summary: string;
  version: string;
  updatedOn: string;
  audience: Role[];
}

export interface PolicySection {
  id: string;
  heading: string;
  body: string;
}

export interface PolicyDocument extends PolicySummary {
  sections: PolicySection[];
}

/* -------------------------------------------------------------------------- */
/* Holidays and announcements                                                  */
/* -------------------------------------------------------------------------- */

export type HolidayType = 'public' | 'restricted' | 'company';

export const HOLIDAY_TYPE_LABEL: Record<HolidayType, string> = {
  public: 'Public holiday',
  restricted: 'Restricted holiday',
  company: 'Company holiday',
};

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: HolidayType;
  regions: string[];
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  publishedOn: string;
  audience: Role[];
  pinned: boolean;
}

/* -------------------------------------------------------------------------- */
/* Dashboards (5.6) — kept from the TASK-09 shell                              */
/* -------------------------------------------------------------------------- */

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

export interface DashboardAnnouncement {
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
  announcements: DashboardAnnouncement[];
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

export interface LeaveDecision {
  decision: 'approved' | 'rejected';
  note: string;
}

/* -------------------------------------------------------------------------- */
/* Client contract                                                             */
/* -------------------------------------------------------------------------- */

export interface ApiClient {
  login(credentials: LoginCredentials): Promise<Session>;
  me(accessToken: string): Promise<User>;

  listEmployees(accessToken: string, filters?: EmployeeFilters): Promise<Employee[]>;
  getEmployee(accessToken: string, id: string): Promise<Employee>;
  createEmployee(accessToken: string, input: EmployeeInput): Promise<Employee>;
  updateEmployee(accessToken: string, id: string, input: EmployeeInput): Promise<Employee>;
  deleteEmployee(accessToken: string, id: string): Promise<void>;
  listDepartments(accessToken: string): Promise<Department[]>;
  listDesignations(accessToken: string): Promise<Designation[]>;

  getMyAttendance(accessToken: string, month: string): Promise<MonthlyAttendance>;
  checkIn(accessToken: string): Promise<AttendanceDay>;
  checkOut(accessToken: string): Promise<AttendanceDay>;
  listAttendance(accessToken: string, filters?: AttendanceFilters): Promise<AttendanceRecord[]>;
  listCorrections(accessToken: string): Promise<AttendanceCorrection[]>;
  applyAttendanceCorrection(
    accessToken: string,
    input: AttendanceCorrectionInput,
  ): Promise<AttendanceCorrection>;

  getLeaveBalance(accessToken: string): Promise<LeaveBalance[]>;
  listLeaveRequests(accessToken: string): Promise<LeaveRequest[]>;
  applyForLeave(accessToken: string, input: LeaveInput): Promise<LeaveRequest>;
  cancelLeave(accessToken: string, id: string): Promise<LeaveRequest>;
  reviewLeave(accessToken: string, id: string, decision: LeaveDecision): Promise<LeaveRequest>;

  listPolicies(accessToken: string): Promise<PolicySummary[]>;
  getPolicy(accessToken: string, id: string): Promise<PolicyDocument>;

  listHolidays(accessToken: string): Promise<Holiday[]>;
  listAnnouncements(accessToken: string): Promise<Announcement[]>;

  getEmployeeDashboard(accessToken: string): Promise<EmployeeDashboardData>;
  getHrDashboard(accessToken: string): Promise<HrDashboardData>;
  getAdminDashboard(accessToken: string): Promise<AdminDashboardData>;
}
