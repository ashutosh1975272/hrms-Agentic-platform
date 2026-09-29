import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import type { Role } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABEL } from '../auth/roles';
import { ChatDockHost } from './chat/ChatDockHost';
import { ChatProvider } from '../chat/ChatProvider';

const NAV_ITEMS: Array<{ to: string; label: string; allowed: Role[] }> = [
  { to: '/dashboard', label: 'My dashboard', allowed: ['employee', 'hr', 'admin'] },
  { to: '/hr', label: 'HR workspace', allowed: ['hr', 'admin'] },
  { to: '/admin', label: 'Admin console', allowed: ['admin'] },
  { to: '/chat', label: 'AI assistant', allowed: ['employee', 'hr', 'admin'] },
];

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const visibleNav = user ? NAV_ITEMS.filter((item) => item.allowed.includes(user.role)) : [];

  return (
    <ChatProvider>
      <div className="min-h-screen bg-slate-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-lg font-semibold text-slate-900">Agentic HRMS</p>
            <p className="text-sm text-slate-600">Role-based human resource management</p>
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              <p className="text-sm text-slate-700">
                <span className="font-medium text-slate-900">{user.fullName}</span>
                <span className="ml-2 rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-800">
                  {ROLE_LABEL[user.role]}
                </span>
              </p>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
        <nav aria-label="Dashboards" className="mx-auto max-w-6xl px-4 pb-3">
          <ul className="flex flex-wrap gap-4">
            {visibleNav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="rounded-md px-2 py-1 text-sm text-slate-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
      <ChatDockHost />
      </div>
    </ChatProvider>
  );
}
