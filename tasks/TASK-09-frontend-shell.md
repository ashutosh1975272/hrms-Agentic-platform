# TASK-09: Frontend shell + dashboards (mock-first)

- Status: review
- Mode: frontend-dev
- Branch: `feature/TASK-09-frontend-shell`
- Depends on: nothing (MOCK-FIRST: runs in parallel with backend; do not wait for real APIs)

## Required reading (before coding)
1. `PROJECT.md` sections 4, 5.6, 18.
2. `../agent-resources/Front-End-Checklist/skills/frontend-checklist-global/SKILL.md` + README checklist.
3. `../agent-resources/superpowers/skills/test-driven-development/SKILL.md`.

## Deliverables (`frontend/`)
- Vite + React + TypeScript + Tailwind scaffold, `react-router-dom` routing.
- Pages: Login, EmployeeDashboard, HRDashboard, AdminDashboard (role switch via mock auth context).
- `src/api/client.ts` with a MOCK adapter implementing the planned REST contract (auth login, me, employees list, leave balance) + `USE_MOCK=true` env flag; real fetch adapter added when backend lands.
- `README.md` (setup, dev, build).

## Acceptance criteria
- [ ] `npm install && npm run build && npm run lint` all pass
- [ ] Login + 3 dashboards render with mock data; role routing enforced in UI
- [ ] No secrets committed

## Agent report

**Branch:** `feature/TASK-09-frontend-shell` · **Mode:** frontend-dev · **Approach:** TDD (test first,
watch fail, implement) + MOCK-FIRST (no backend dependency).

### What was built (`frontend/`)

- Vite 7 + React 19 + TypeScript 5.9 + TailwindCSS 4 + `react-router-dom` 7 scaffold, ESLint 9
  flat config, Vitest + Testing Library (jsdom).
- `src/api/client.ts` — `createApiClient` + `resolveUseMock` flag resolver
  (`USE_MOCK` / `VITE_USE_MOCK`; `true|1|on|yes` / `false|0|off|no`; default mock).
  `src/api/mockAdapter.ts` — seeded demo users/employees, leave balances, dashboards, role-scoped
  employee list, stateless token validation. `src/api/httpAdapter.ts` — `fetch` adapter for the
  planned REST contract (`POST /auth/login`, `GET /auth/me`, `GET /employees`, `GET /leaves/balance`,
  `GET /dashboard/{employee,hr,admin}`), bearer header, `ApiError(status, detail)`.
- `src/auth/` — `AuthProvider` (login, logout, session restore from `sessionStorage`, client
  injectable for tests), `RequireRole` guard, `roles.ts` (`/dashboard`, `/hr`, `/admin` home map).
- `src/pages/` — `LoginPage`, `EmployeeDashboard`, `HrDashboard`, `AdminDashboard` per
  PROJECT.md §4 and §5.6. `src/components/` — `AppShell`, `Panel`, `StatCard`, `DataTable`.
  `src/hooks/useAsyncData.ts` — loading/error/data states with no cascading renders.
- `frontend/README.md` (setup, dev, mock-vs-real flag, REST contract, layout, gates) and
  `frontend/.env.example` (flags only, no secrets).

### Gate output (all green, run from `frontend/`)

```
$ npm run build
> tsc -b && vite build
vite v7.3.6 building client environment for production...
✓ 57 modules transformed.
dist/index.html                   0.51 kB │ gzip:   0.32 kB
dist/assets/index-Bo15D8qn.css   14.40 kB │ gzip:   3.67 kB
dist/assets/index-BsLeB9Fe.js   287.02 kB │ gzip:  89.90 kB
✓ built in 1.88s

$ npm run lint
> eslint .
(no output — 0 errors, 0 warnings, exit 0)

$ npm test
 Test Files  6 passed (6)
      Tests  60 passed (60)
```

Manual smoke check: `vite preview` on port 4173 returned `HTTP 200`, title `Agentic HRMS`, JS asset
`HTTP 200`.

### Acceptance criteria

- [x] `npm install && npm run build && npm run lint` all pass (plus 60 Vitest tests green)
- [x] Login + 3 dashboards render with mock data; role routing enforced in UI
      (tests cover employee/HR/admin home routing, cross-role denial, sign-out, session restore)
- [x] No secrets committed (`.env*` git-ignored; only mock demo fixtures in `mockAdapter.ts`)

### Notes for the lead

- Demo credentials are local mock fixtures (`DEMO_PASSWORD` in `src/api/mockAdapter.ts`), not
  credentials for any real system.
- REST paths above are the contract the frontend expects; TASK-02..06 should match them, or
  `httpAdapter.ts` needs a one-line path adjustment.
- Accessibility per the Front-End Checklist: labelled inputs with `aria-invalid` /
  `aria-describedby`, password show/hide toggle, `autocomplete` hints, `scope="col"` table headers
  with captions, labelled regions, skip link, visible `:focus-visible` rings, reduced-motion guard.

**Commit:** _(filled in below after commit)_

