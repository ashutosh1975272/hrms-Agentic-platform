import type { ReactNode } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/AppShell';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { RequireRole } from './auth/RequireRole';
import { homeRouteForRole } from './auth/roles';
import { ToastProvider } from './components/ui/Toast';
import { PageHeader } from './components/ui/Card';
import { AdminDashboard } from './pages/AdminDashboard';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { AttendancePage } from './pages/AttendancePage';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { EmployeesPage } from './pages/EmployeesPage';
import { HolidaysPage } from './pages/HolidaysPage';
import { HrDashboard } from './pages/HrDashboard';
import { LeavesPage } from './pages/LeavesPage';
import { LoginPage } from './pages/LoginPage';
import { PoliciesPage } from './pages/PoliciesPage';

const ALL_ROLES = ['employee', 'hr', 'admin'] as const;

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
    <PageHeader
      title="Page not found"
      description="That route does not exist in this workspace."
      actions={
        <Link
          to={target}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-control border-2 border-primary px-4 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary-soft"
        >
          Go to my dashboard
        </Link>
      }
    />
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <RequireRole allowed={ALL_ROLES}>
      <AppShell>{children}</AppShell>
    </RequireRole>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RoleHomeRedirect />} />
          <Route
            path="/dashboard"
            element={
              <Shell>
                <EmployeeDashboard />
              </Shell>
            }
          />
          <Route
            path="/hr"
            element={
              <RequireRole allowed={['hr', 'admin']}>
                <AppShell>
                  <HrDashboard />
                </AppShell>
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole allowed={['admin']}>
                <AppShell>
                  <AdminDashboard />
                </AppShell>
              </RequireRole>
            }
          />
          <Route
            path="/employees"
            element={
              <Shell>
                <EmployeesPage />
              </Shell>
            }
          />
          <Route
            path="/attendance"
            element={
              <Shell>
                <AttendancePage />
              </Shell>
            }
          />
          <Route
            path="/leaves"
            element={
              <Shell>
                <LeavesPage />
              </Shell>
            }
          />
          <Route
            path="/policies"
            element={
              <Shell>
                <PoliciesPage />
              </Shell>
            }
          />
          <Route
            path="/holidays"
            element={
              <Shell>
                <HolidaysPage />
              </Shell>
            }
          />
          <Route
            path="/announcements"
            element={
              <Shell>
                <AnnouncementsPage />
              </Shell>
            }
          />
          <Route
            path="*"
            element={
              <AppShell>
                <NotFoundPage />
              </AppShell>
            }
          />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
