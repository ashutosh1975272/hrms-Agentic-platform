import { ApiError } from './errors';
import type {
  AdminDashboardData,
  Announcement,
  ApiClient,
  AttendanceCorrection,
  AttendanceCorrectionInput,
  AttendanceDay,
  AttendanceRecord,
  Designation,
  Department,
  Employee,
  EmployeeDashboardData,
  EmployeeInput,
  Holiday,
  HrDashboardData,
  LeaveDecision,
  LeaveInput,
  LeaveRequest,
  MonthlyAttendance,
  PolicyDocument,
  PolicySummary,
  Session,
  User,
} from './types';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface HttpAdapterOptions {
  baseUrl: string;
  fetchImpl?: FetchLike;
}

interface AuthResponse {
  access_token?: string;
  token_type?: string;
  user?: User;
}

function readErrorDetail(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === 'string' && detail.length > 0) {
      return detail;
    }
  }
  return `Request failed with status ${status}`;
}

function encodeQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }
  const query = search.toString();
  return query.length > 0 ? `?${query}` : '';
}

export function createHttpAdapter(options: HttpAdapterOptions): ApiClient {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const doFetch: FetchLike = options.fetchImpl ?? ((input, init) => fetch(input, init));

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    };
    if (init.body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await doFetch(`${baseUrl}${path}`, { ...init, headers });
    const text = await response.text();
    let payload: unknown = null;
    if (text.length > 0) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      throw new ApiError(response.status, readErrorDetail(payload, response.status));
    }
    return payload as T;
  }

  const authorized = (accessToken: string): Record<string, string> => ({
    Authorization: `Bearer ${accessToken}`,
  });

  const withToken = (accessToken: string) => ({ headers: authorized(accessToken) });

  const post = <T>(path: string, accessToken: string, body?: unknown): Promise<T> =>
    request<T>(path, {
      method: 'POST',
      headers: authorized(accessToken),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  const patch = <T>(path: string, accessToken: string, body: unknown): Promise<T> =>
    request<T>(path, {
      method: 'PATCH',
      headers: authorized(accessToken),
      body: JSON.stringify(body),
    });

  const remove = (path: string, accessToken: string): Promise<void> =>
    request<void>(path, { method: 'DELETE', headers: authorized(accessToken) });

  return {
    async login(credentials) {
      const payload = await request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      const accessToken = payload.access_token;
      if (!accessToken) {
        throw new ApiError(500, 'Login response did not contain an access token');
      }
      const session: Session = {
        accessToken,
        tokenType: 'bearer',
        user: payload.user as User,
      };
      return session;
    },

    me(accessToken) {
      return request<User>('/auth/me', withToken(accessToken));
    },

    listEmployees(accessToken, filters) {
      return request<Employee[]>(
        `/employees${encodeQuery({
          search: filters?.search,
          department: filters?.department,
          status: filters?.status,
        })}`,
        withToken(accessToken),
      );
    },

    getEmployee(accessToken, id) {
      return request<Employee>(`/employees/${encodeURIComponent(id)}`, withToken(accessToken));
    },

    createEmployee(accessToken, input: EmployeeInput) {
      return post<Employee>('/employees', accessToken, input);
    },

    updateEmployee(accessToken, id, input: EmployeeInput) {
      return patch<Employee>(`/employees/${encodeURIComponent(id)}`, accessToken, input);
    },

    deleteEmployee(accessToken, id) {
      return remove(`/employees/${encodeURIComponent(id)}`, accessToken);
    },

    listDepartments(accessToken) {
      return request<Department[]>('/departments', withToken(accessToken));
    },

    listDesignations(accessToken) {
      return request<Designation[]>('/designations', withToken(accessToken));
    },

    getMyAttendance(accessToken, month) {
      return request<MonthlyAttendance>(
        `/attendance/me${encodeQuery({ month })}`,
        withToken(accessToken),
      );
    },

    checkIn(accessToken) {
      return post<AttendanceDay>('/attendance/check-in', accessToken);
    },

    checkOut(accessToken) {
      return post<AttendanceDay>('/attendance/check-out', accessToken);
    },

    listAttendance(accessToken, filters) {
      return request<AttendanceRecord[]>(
        `/attendance${encodeQuery({ employeeId: filters?.employeeId, month: filters?.month })}`,
        withToken(accessToken),
      );
    },

    listCorrections(accessToken) {
      return request<AttendanceCorrection[]>('/attendance/corrections', withToken(accessToken));
    },

    applyAttendanceCorrection(accessToken, input: AttendanceCorrectionInput) {
      return post<AttendanceCorrection>('/attendance/corrections', accessToken, input);
    },

    getLeaveBalance(accessToken) {
      return request('/leaves/balance', withToken(accessToken));
    },

    listLeaveRequests(accessToken) {
      return request<LeaveRequest[]>('/leaves/requests', withToken(accessToken));
    },

    applyForLeave(accessToken, input: LeaveInput) {
      return post<LeaveRequest>('/leaves/requests', accessToken, input);
    },

    cancelLeave(accessToken, id) {
      return post<LeaveRequest>(`/leaves/requests/${encodeURIComponent(id)}/cancel`, accessToken);
    },

    reviewLeave(accessToken, id, decision: LeaveDecision) {
      return post<LeaveRequest>(
        `/leaves/requests/${encodeURIComponent(id)}/review`,
        accessToken,
        decision,
      );
    },

    listPolicies(accessToken) {
      return request<PolicySummary[]>('/policies', withToken(accessToken));
    },

    getPolicy(accessToken, id) {
      return request<PolicyDocument>(`/policies/${encodeURIComponent(id)}`, withToken(accessToken));
    },

    listHolidays(accessToken) {
      return request<Holiday[]>('/holidays', withToken(accessToken));
    },

    listAnnouncements(accessToken) {
      return request<Announcement[]>('/announcements', withToken(accessToken));
    },

    getEmployeeDashboard(accessToken) {
      return request<EmployeeDashboardData>('/dashboard/employee', withToken(accessToken));
    },

    getHrDashboard(accessToken) {
      return request<HrDashboardData>('/dashboard/hr', withToken(accessToken));
    },

    getAdminDashboard(accessToken) {
      return request<AdminDashboardData>('/dashboard/admin', withToken(accessToken));
    },
  };
}
