import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import type { Role } from '../api/types';
import { useAuth } from './AuthContext';
import { homeRouteForRole, isRoleAllowed } from './roles';

export interface RequireRoleProps {
  allowed: readonly Role[];
  children: ReactNode;
}

export function RequireRole({ allowed, children }: RequireRoleProps) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <p role="status" aria-live="polite" className="p-8 text-center text-slate-600">
        Checking your session…
      </p>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isRoleAllowed(user.role, allowed)) {
    return <Navigate to={homeRouteForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
