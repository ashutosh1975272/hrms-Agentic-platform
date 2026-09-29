import { Link, Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/AppShell';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { RequireRole } from './auth/RequireRole';
import { homeRouteForRole } from './auth/roles';
import { AdminDashboard } from './pages/AdminDashboard';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { HrDashboard } from './pages/HrDashboard';
import { LoginPage } from './pages/LoginPage';

function RoleHomeRedirect() {
  const { status, user } = useAuth();
  if (status === 'loading') {
    return <p role="status">Loading…</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={homeRouteForRole(user.role)} replace />;
}

function NotFoundPage() {
  const { user } = useAuth();
  const target = user ? homeRouteForRole(user.role) : '/login';
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <Link
        className="text-sm text-slate-700 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        to={target}
      >
        Go to my dashboard
      </Link>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RoleHomeRedirect />} />
        <Route
          path="/dashboard"
          element={
            <RequireRole allowed={['employee', 'hr', 'admin']}>
              <Shell>
                <EmployeeDashboard />
              </Shell>
            </RequireRole>
          }
        />
        <Route
          path="/hr"
          element={
            <RequireRole allowed={['hr', 'admin']}>
              <Shell>
                <HrDashboard />
              </Shell>
            </RequireRole>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRole allowed={['admin']}>
              <Shell>
                <AdminDashboard />
              </Shell>
            </RequireRole>
          }
        />
        <Route
          path="*"
          element={
            <Shell>
              <NotFoundPage />
            </Shell>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
