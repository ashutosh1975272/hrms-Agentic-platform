import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import type { Role } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useCan } from '../hooks/useCan';
import type { Permission } from '../auth/permissions';
import { ROLE_LABEL } from '../auth/roles';
import { ChatProvider } from '../chat/ChatProvider';
import { ChatDockHost } from './chat/ChatDockHost';
import { Avatar, Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Icon, type IconName } from './ui/Icon';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  allowed?: readonly Role[];
  permission?: Permission;
}

const DASHBOARD_NAV: NavItem[] = [
  { to: '/dashboard', label: 'My dashboard', icon: 'dashboard' },
  { to: '/hr', label: 'HR workspace', icon: 'users', allowed: ['hr', 'admin'] },
  { to: '/admin', label: 'Admin console', icon: 'shield', allowed: ['admin'] },
  { to: '/chat', label: 'AI assistant', icon: 'message' },
];

const MODULE_NAV: NavItem[] = [
  { to: '/employees', label: 'Employees', icon: 'user', permission: 'employee.view_own' },
  { to: '/attendance', label: 'Attendance', icon: 'clock', permission: 'attendance.mark' },
  { to: '/leaves', label: 'Leaves', icon: 'calendar', permission: 'leave.apply' },
  { to: '/policies', label: 'Policies', icon: 'book', permission: 'policy.view' },
  { to: '/holidays', label: 'Holidays', icon: 'briefcase', permission: 'holiday.view' },
  { to: '/announcements', label: 'Announcements', icon: 'megaphone', permission: 'announcement.view' },
];

const NAV_LINK_CLASS =
  'flex min-h-11 items-center gap-2.5 rounded-control px-3 text-sm font-medium transition-[background-color,color] duration-200 ease-out';

const NAV_LINK_ACTIVE = 'bg-primary-soft text-primary-strong';
const NAV_LINK_IDLE = 'text-muted-foreground hover:bg-muted hover:text-foreground';

function NavList({
  items,
  label,
  heading,
  can,
  role,
  onNavigate,
}: {
  items: NavItem[];
  label: string;
  heading: string;
  can: (permission: Permission) => boolean;
  role: Role;
  onNavigate?: () => void;
}) {
  const visible = items.filter(
    (item) => (!item.allowed || item.allowed.includes(role)) && (!item.permission || can(item.permission)),
  );
  if (visible.length === 0) {
    return null;
  }

  return (
    <nav aria-label={label}>
      <h2 className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{heading}</h2>
      <ul className="mt-2 space-y-1">
        {visible.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `${NAV_LINK_CLASS} ${isActive ? NAV_LINK_ACTIVE : NAV_LINK_IDLE}`
              }
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const { can } = useCan();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeNav = () => setNavOpen(false);

  return (
    <ChatProvider>
    <div className="app-backdrop min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-card focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary focus:shadow-lg"
      >
        Skip to main content
      </a>

      <header className="glass-rail sticky top-0 z-30 border-b border-border">
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-expanded={navOpen}
              aria-controls="app-shell-nav"
              onClick={() => setNavOpen((current) => !current)}
              className="inline-flex size-11 cursor-pointer items-center justify-center rounded-control text-primary transition-colors duration-200 hover:bg-muted lg:hidden"
            >
              <Icon name={navOpen ? 'close' : 'menu'} size={20} />
              <span className="sr-only">{navOpen ? 'Close navigation' : 'Open navigation'}</span>
            </button>
            <Link
              to={user ? '/dashboard' : '/login'}
              className="flex items-center gap-2 rounded-control font-heading text-base font-semibold text-foreground"
            >
              <span className="inline-flex size-9 items-center justify-center rounded-control bg-primary text-on-primary">
                <Icon name="shield" size={18} />
              </span>
              Agentic HRMS
            </Link>
          </div>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={user.fullName} size="sm" />
                <div className="hidden leading-tight sm:block">
                  <p className="text-sm font-semibold text-foreground">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user.designation ?? ROLE_LABEL[user.role]}</p>
                </div>
              </div>
              <Badge tone="primary">{ROLE_LABEL[user.role]}</Badge>
              <Button variant="subtle" size="sm" icon="log-out" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto flex max-w-[100rem] flex-col gap-6 px-4 py-6 lg:flex-row lg:gap-8">
        <div
          id="app-shell-nav"
          className={`${navOpen ? 'block' : 'hidden'} shrink-0 lg:block lg:w-64`}
        >
          <div className="glass-panel sticky top-20 space-y-5 rounded-card p-4">
            {user ? (
              <>
                <NavList
                  items={DASHBOARD_NAV}
                  label="Dashboards"
                  heading="Dashboards"
                  can={can}
                  role={user.role}
                  onNavigate={closeNav}
                />
                <NavList
                  items={MODULE_NAV}
                  label="HRMS modules"
                  heading="Modules"
                  can={can}
                  role={user.role}
                  onNavigate={closeNav}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sign in to open the modules.</p>
            )}
          </div>
        </div>

        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
      {user ? <ChatDockHost /> : null}
    </div>
    </ChatProvider>
  );
}
