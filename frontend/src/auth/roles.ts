import type { Role } from '../api/types';

export const ROLE_HOME: Record<Role, string> = {
  employee: '/dashboard',
  hr: '/hr',
  admin: '/admin',
};

export function homeRouteForRole(role: Role): string {
  return ROLE_HOME[role];
}

export function isRoleAllowed(role: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(role);
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  hr: 'HR',
  employee: 'Employee',
};
