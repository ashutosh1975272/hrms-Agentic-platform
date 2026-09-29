import type { Role } from '../api/types';

/**
 * Permission matrix from PROJECT.md section 13, extended with the module-level
 * operations described in sections 4.1 - 4.3 and 5.1 - 5.5.
 */
export const PERMISSION_ROLES = {
  'employee.view_own': ['admin', 'hr', 'employee'],
  'employee.view_all': ['admin', 'hr'],
  'employee.create': ['admin', 'hr'],
  'employee.update': ['admin', 'hr'],
  'employee.delete': ['admin'],
  'organisation.read': ['admin', 'hr'],
  'organisation.manage': ['admin'],
  'attendance.mark': ['admin', 'hr', 'employee'],
  'attendance.correct': ['admin', 'hr'],
  'attendance.report': ['admin', 'hr'],
  'leave.apply': ['admin', 'hr', 'employee'],
  'leave.cancel': ['admin', 'hr', 'employee'],
  'leave.approve': ['admin', 'hr'],
  'leave.view_all': ['admin', 'hr'],
  'policy.view': ['admin', 'hr', 'employee'],
  'policy.manage': ['admin'],
  'holiday.view': ['admin', 'hr', 'employee'],
  'holiday.manage': ['admin'],
  'announcement.view': ['admin', 'hr', 'employee'],
  'announcement.manage': ['admin'],
  'user.manage': ['admin'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSION_ROLES;

export function isAllowed(role: Role, permission: Permission): boolean {
  const allowed: readonly Role[] = PERMISSION_ROLES[permission];
  return allowed.includes(role);
}

export function permissionsForRole(role: Role): Permission[] {
  return (Object.keys(PERMISSION_ROLES) as Permission[]).filter((permission) =>
    isAllowed(role, permission),
  );
}
