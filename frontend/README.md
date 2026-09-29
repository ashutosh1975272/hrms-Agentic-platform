# Agentic HRMS — Frontend

React + Vite + TypeScript + TailwindCSS app for Agentic HRMS: login, role-based routing, the
Admin, HR and Employee dashboards, and the Employees, Attendance, Leaves, Policies, Holidays and
Announcements modules. Built mock-first so it runs before the backend API exists.

## Stack

- React 19 + Vite 7 + TypeScript 5.9
- TailwindCSS 4 (via `@tailwindcss/vite`)
- `react-router-dom` 7 for routing
- Vitest + Testing Library for unit and component tests

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

The dev server starts with mock data enabled, so no backend is required. Sign in with any of the
demo accounts listed on the login screen (mock-only fixtures, not real credentials):

| Role     | Email                           |
| -------- | ------------------------------- |
| Admin    | `admin@agentichrms.test`        |
| HR       | `hr@agentichrms.test`           |
| Employee | `employee@agentichrms.test`     |

The shared mock password is defined in `src/api/mockAdapter.ts` as `DEMO_PASSWORD`.

## Mock mode vs. real API

`src/api/client.ts` resolves the mode from the `USE_MOCK` (or `VITE_USE_MOCK`) env flag:

- `true`, `1`, `on`, `yes` — use the in-memory mock adapter (default when the flag is absent)
- `false`, `0`, `off`, `no` — use the `fetch` adapter in `src/api/httpAdapter.ts`

```bash
cp .env.example .env.local   # then set USE_MOCK=false and VITE_API_BASE_URL=http://localhost:8000/api
```

The `fetch` adapter implements the REST contract the backend is expected to expose:

| Method | Path                             | Purpose                                    |
| ------ | -------------------------------- | ------------------------------------------ |
| POST   | `/auth/login`                    | `{ access_token, token_type, user }`       |
| GET    | `/auth/me`                       | current user                               |
| GET    | `/employees`                     | employee list (role filtered)              |
| POST   | `/employees`                     | create an employee                         |
| GET    | `/employees/{id}`                | one employee record                        |
| PATCH  | `/employees/{id}`                | update an employee record                  |
| DELETE | `/employees/{id}`                | delete an employee record                  |
| GET    | `/departments`                   | departments                                |
| GET    | `/designations`                  | designations                               |
| GET    | `/attendance/me?month=`          | own monthly attendance                     |
| POST   | `/attendance/check-in`           | check in                                   |
| POST   | `/attendance/check-out`          | check out                                  |
| GET    | `/attendance?employeeId=&month=` | attendance history                         |
| GET    | `/attendance/corrections`        | correction log                             |
| POST   | `/attendance/corrections`        | request a correction                       |
| GET    | `/leaves/balance`                | leave balance for the caller               |
| GET    | `/leaves/requests`               | leave requests (role filtered)             |
| POST   | `/leaves/requests`               | apply for leave                            |
| POST   | `/leaves/requests/{id}/cancel`   | cancel a request                           |
| POST   | `/leaves/requests/{id}/review`   | approve or reject                          |
| GET    | `/policies`                      | policy summaries visible to the caller     |
| GET    | `/policies/{id}`                 | one policy document                        |
| GET    | `/holidays`                      | holiday calendar                           |
| GET    | `/announcements`                 | announcements for the caller's role        |
| GET    | `/dashboard/employee`            | employee dashboard payload                 |
| GET    | `/dashboard/hr`                  | HR dashboard payload                       |
| GET    | `/dashboard/admin`               | admin dashboard payload                    |

Auth errors map to `ApiError` (`status` + backend `detail` message) so pages can render an alert.

## Modules and role matrix

Every route and every control is gated by the permission matrix in `src/auth/permissions.ts`
(derived from `PROJECT.md` §13) through the `useCan(permission)` hook. Privileged controls are not
rendered at all for a role that lacks the permission, and the mock adapter enforces the same rules
server-side.

| Route           | Employee                    | HR                          | Admin |
| --------------- | --------------------------- | --------------------------- | ----- |
| `/dashboard`    | Personal snapshot           | Personal snapshot           | Personal snapshot |
| `/employees`    | Own record only, read-only  | Search, create, edit        | + delete |
| `/attendance`   | Check in/out, own calendar and history | Own views + org history and corrections | Same as HR |
| `/leaves`       | Balance, apply, cancel, history | Own views + approval inbox | Same as HR |
| `/policies`     | Published, audience-filtered documents | Same | Same |
| `/holidays`     | Full calendar               | Full calendar               | Full calendar |
| `/announcements`| Role-filtered notices       | Role-filtered notices       | Role-filtered notices |
| `/hr`           | No access                   | HR dashboard                | HR dashboard |
| `/admin`        | No access                   | No access                   | Admin console |

## Project layout

```
src/
  api/         client (mode selection), mock adapter, fetch adapter, shared types
  auth/        AuthContext (session restore, login, logout), permissions, role routing, RequireRole
  components/  AppShell (topbar + role-filtered sidebar)
  components/ui/  Button, Card, Badge/Avatar, Field (Input/Select/Textarea/Checkbox),
                  DataTable, Pagination, Modal/ConfirmDialog, Drawer, Toast, StatCard, States, Icon
  components/employees/, attendance/, leaves/   module-specific dialogs and views
  hooks/       useAsyncData, useResource (loading / error / data / reload), useCan
  pages/       LoginPage, dashboards, Employees, Attendance, Leaves, Policies, Holidays, Announcements
  App.tsx      route table
```

## Quality gates

```bash
npm run build   # tsc -b && vite build
npm run lint    # eslint .
npm test        # vitest run
```

## Accessibility notes

Labelled inputs with `aria-invalid` / `aria-describedby` errors, a password visibility toggle,
`autocomplete` hints, semantic tables with `scope="col"` headers and captions, labelled regions,
a skip link, visible `:focus-visible` rings, focus-trapped modals and drawers that restore focus to
their trigger, `aria-label` on every icon-only control, 44px minimum touch targets, and
`prefers-reduced-motion` honoured for every animation.

## Notes for the next tasks

- TASK-11 can mount the chat panel inside `AppShell` next to the module routes; the shell already
  renders a single `<AppShell>` around every authenticated route.
- Never commit `.env.local` or any credential; `.env*` files are git-ignored.
