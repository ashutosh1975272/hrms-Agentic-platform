# Agentic HRMS — Frontend

React + Vite + TypeScript + TailwindCSS shell for Agentic HRMS: login, role-based routing and
the Admin, HR and Employee dashboards. Built mock-first so it runs before the backend API exists.

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

| Method | Path                | Purpose                          |
| ------ | ------------------- | -------------------------------- |
| POST   | `/auth/login`       | `{ access_token, token_type, user }` |
| GET    | `/auth/me`          | current user                     |
| GET    | `/employees`        | employee list (role filtered)    |
| GET    | `/leaves/balance`   | leave balance for the caller     |
| GET    | `/dashboard/employee` | employee dashboard payload     |
| GET    | `/dashboard/hr`     | HR dashboard payload             |
| GET    | `/dashboard/admin`  | admin dashboard payload          |

Auth errors map to `ApiError` (`status` + backend `detail` message) so pages can render an alert.

## Project layout

```
src/
  api/         client (mode selection), mock adapter, fetch adapter, shared types
  auth/        AuthContext (session restore, login, logout), role routing helpers, RequireRole
  components/  AppShell, Panel, StatCard, DataTable
  hooks/       useAsyncData (loading / error / data)
  pages/       LoginPage, EmployeeDashboard, HrDashboard, AdminDashboard
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
a skip link, and visible `:focus-visible` rings.

## Notes for the next tasks

- TASK-10 can add module pages under `src/pages/` and reuse `DataTable`, `useAsyncData` and
  the client methods.
- TASK-11 can mount the chat panel inside `AppShell` next to the dashboard routes.
- Never commit `.env.local` or any credential; `.env*` files are git-ignored.
