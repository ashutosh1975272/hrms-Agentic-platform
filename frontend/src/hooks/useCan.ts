import { useCallback } from 'react';

import { useAuth } from '../auth/AuthContext';
import { isAllowed, type Permission } from '../auth/permissions';

export interface UseCanResult {
  can: (permission: Permission) => boolean;
  canAny: (permissions: readonly Permission[]) => boolean;
  canAll: (permissions: readonly Permission[]) => boolean;
}

/**
 * Role guard hook. Returns false for every permission while the session is
 * still resolving so privileged controls are never rendered for an unknown user.
 */
export function useCan(): UseCanResult {
  const { user } = useAuth();

  const can = useCallback(
    (permission: Permission) => (user ? isAllowed(user.role, permission) : false),
    [user],
  );

  const canAny = useCallback(
    (permissions: readonly Permission[]) => permissions.some(can),
    [can],
  );

  const canAll = useCallback(
    (permissions: readonly Permission[]) => permissions.every(can),
    [can],
  );

  return { can, canAny, canAll };
}
