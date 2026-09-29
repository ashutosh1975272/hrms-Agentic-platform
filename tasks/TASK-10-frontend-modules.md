# TASK-10: Frontend HRMS modules (premium UI)

- Status: review
- Mode: frontend-dev
- Branch: `feature/TASK-10-frontend-modules`
- Depends on: TASK-09 (shell). If backend APIs exist, wire them; else extend the mock adapter with the same contract.

## Required reading (before coding)
1. `PROJECT.md` sections 4, 5.1-5.5, 13 (roles + modules + permission matrix).
2. `.kilocode/rules/ui-ux.md` — MANDATORY visual standard + `design-system/agentic-hrms/MASTER.md`.
3. `../agent-resources/Front-End-Checklist/skills/frontend-checklist-global/SKILL.md` + category skills for tables, forms, accessibility.

## Deliverables (`frontend/src/`)
- Restyle TASK-09 shell to fully match MASTER.md if it does not already.
- Pages (all roles see only what PROJECT.md §13 allows; hide/disable the rest):
  - Employees: searchable/filterable table, profile drawer, add/edit modal (HR/Admin), delete with confirm (Admin).
  - Attendance: check-in/out widget, monthly calendar view, history table, correction flow (HR).
  - Leaves: apply form, balance cards, history timeline, approve/reject inbox (HR/Admin), cancel flow.
  - Policies: document list + reader view. Holidays + announcements views.
- Shared `ui/` components extended as needed; role-guard hook (`useCan(permission)`).

## Acceptance criteria
- [x] All pages above work against mock adapter (or real API if available)
- [x] Role matrix enforced in UI (Employee never sees admin actions)
- [x] FULL ui-ux.md pre-delivery checklist confirmed in report
- [x] `npm run build` + `npm run lint` pass

## Agent report

### What was delivered

Continued the interrupted session and completed the module set on `feature/TASK-10-frontend-modules`.

**API layer (resumed work, finished)**
- `src/api/types.ts` — full contract for §5.1–5.5: `Employee`/`EmployeeInput`/`EmployeeFilters`,
  `Department`, `Designation`, `MonthlyAttendance`/`AttendanceRecord`/`AttendanceCorrection`,
  `LeaveBalance`/`LeaveRequest`/`LeaveInput`/`LeaveDecision`, `PolicySummary`/`PolicyDocument`,
  `Holiday`, `Announcement`, plus label maps for every enum.
- `src/api/mockAdapter.ts` — mock-first implementation of the whole contract with seeded employees,
  leave requests, deterministic attendance generation, policies, holidays and announcements, and
  server-side role enforcement (`requireRole`) so the UI can never be the only guard.
- `src/api/httpAdapter.ts` — `fetch` implementation of the same `ApiClient` contract (query
  encoding, POST/PATCH/DELETE helpers), so the app is mock-agnostic.

**Role guard (deliverable)**
- `src/auth/permissions.ts` — `PERMISSION_ROLES` matrix transcribed from PROJECT.md §13 and
  extended with the module operations in §4.1–4.3 / §5.1–§5.5.
- `src/hooks/useCan.ts` — `useCan()` returning `{ can, canAny, canAll }`; returns `false` while the
  session is still resolving so privileged controls never flash for an unknown user.
- `src/components/AppShell.tsx` — rewritten to MASTER.md: glass topbar, role-filtered sidebar with
  a `Dashboards` nav and an `HRMS modules` nav, `aria-expanded` mobile disclosure, skip link,
  44px controls. Module links are hidden, not disabled, when the role lacks the permission.

**Shared `ui/` component library**
`Button`/`IconButton`, `Card`/`SectionCard`/`PageHeader`, `Badge`/`Avatar`, `Field`
(`TextField`/`SelectField`/`TextareaField`/`CheckboxField`), `DataTable` (built-in loading, empty
and error states, `scope="col"` headers, `sr-only` caption), `Pagination`, `Modal`/`ConfirmDialog`,
`Drawer`, `Toast`/`ToastProvider`, `StatCard`, `States` (skeleton/loading/empty/error), `Icon`
(inline Lucide-style SVG set), `useDialogFocus` (shared focus trap + focus restore). The three
legacy components (`components/Panel|StatCard|DataTable.tsx`) were deleted; every page now uses
`components/ui/`.

**Pages** (`src/pages/`)
- `EmployeesPage` — search + department + status filters, paginated directory table, profile
  drawer, add/edit modal with full inline validation, admin delete behind a confirm dialog.
- `AttendancePage` — check-in/out widget with today's state, month navigation, monthly calendar
  grid, org-wide history + correction log for HR/Admin, personal history for everyone.
- `LeavesPage` — balance cards and table, apply form (dates, half-day, reason), personal history
  timeline, HR/Admin approval inbox with approve/reject, cancel flow behind a confirm dialog.
- `PoliciesPage` — searchable, category-filtered policy library + read-only reader with sections,
  version and audience; admin-only documents are hidden from employees.
- `HolidaysPage` — holiday calendar with type badges, region, countdown and type filter.
- `AnnouncementsPage` — notice board, pinned first, filtered to the caller's role.
- Dashboards, LoginPage and `App.tsx` migrated off the legacy components onto MASTER.md tokens and
  the new route table. `README.md` updated with the full endpoint contract and role matrix.

### Gate output

```
### npm run build   (cd frontend)
> tsc -b && vite build
vite v7.3.6 building client environment for production...
transforming...
✓ 86 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.51 kB │ gzip:  0.32 kB
dist/assets/index-G5fxAZpK.css   31.99 kB │ gzip:  6.69 kB
dist/assets/index-tj9gVJ6a.js   378.77 kB │ gzip: 114.43 kB
✓ built in 2.36s

### npm run lint    (cd frontend)
> eslint .
(no output, exit 0)

### npm test        (cd frontend)
> vitest run
 Test Files  7 passed (7)
      Tests  78 passed (78)
   Duration  7.04s
```

`npm run build` and `npm run lint` are the task's required gates and both pass. `npm test` is also
green: 78 tests across 7 files, including the 18 new module tests in
`src/pages/Modules.test.tsx` that exercise every page against the mock adapter and assert the role
matrix (employee cannot create/edit/delete employees, cannot see the HR approval inbox, the org
attendance view, the correction log, or admin-only policy documents).

### UI/UX pre-delivery checklist (`.kilocode/rules/ui-ux.md`)

- [x] **MASTER.md tokens used everywhere (no raw hex, no mixed styles)** — the full palette,
  Poppins/Open Sans typography, `--space-*`, `--shadow-*` and radius tokens live in
  `src/index.css` `@theme`. Verified: `grep` for raw hex outside `index.css` returns nothing, and
  no legacy `slate-*` / `red-*` / `emerald-*` palette classes remain. Glassmorphism surfaces use
  the `glass-panel` / `glass-rail` / `app-backdrop` component classes. Verified in the built CSS
  that `bg-primary-soft`, `rounded-control`, `rounded-card`, `text-muted-foreground`, `bg-accent`,
  `text-on-accent`, `border-border`, `glass-panel` and `stagger-item` all generate utilities.
- [x] **Shared components reused; no duplicated styles** — every page composes `components/ui/`
  only. `useDialogFocus` is shared by `Modal` and `Drawer`; `DataTable` owns the loading/empty/
  error pattern; no page re-declares a card, table or button style.
- [x] **Responsive at 375 / 768 / 1024 / 1440, no horizontal scroll** — mobile-first throughout:
  sidebar collapses into a disclosure below `lg`, filter forms are 1/2/4 column, dashboards and
  the policy library stack below `lg`. The only fixed intrinsic widths are `min-w-[36rem]`
  (`DataTable`) and `min-w-[34rem]` (attendance calendar), both inside an `overflow-x-auto`
  wrapper, so they scroll within their card instead of the page. Layout uses `min-w-0` on flex and
  grid children and `break-words` on long values (names, emails, addresses) to prevent overflow.
- [x] **Contrast 4.5:1, focus rings, keyboard nav, reduced motion** — text pairs were chosen to clear
  4.5:1 (`#475569` on white ≈ 7.5:1, `#1d4ed8` on `#e4edff` ≈ 5.7:1, `#15803d` on `#dcfce7`
  ≈ 4.6:1, `#92400e` on `#fef3c7` ≈ 6.4:1, `#b91c1c` on the destructive tint ≈ 5.7:1, black on
  `#ea580c` ≈ 5.9:1). Status is never colour-alone: every Badge carries a text label. A global
  `:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px }` gives every
  interactive element a visible ring; nothing sets `outline: none`. Modals and the drawer move
  focus in on open, trap Tab, close on Escape and return focus to the trigger. All clickable
  elements use `cursor-pointer`; hover/colour transitions run 200ms and animate only
  `background-color`, `border-color`, `color`, `box-shadow` and `transform` — never width/height.
  `prefers-reduced-motion: reduce` disables every animation and transition (including the
  `motion-reduce:` Tailwind variants on the spinner and hover lift). Icon-only controls all carry
  `aria-label`; every `Icon` is `aria-hidden` unless given a `title`.
- [x] **Loading + empty + error states on every data view** — `DataTable` renders a skeleton
  loader (`role="status"` + `sr-only` label), an illustrated `EmptyState` with an optional
  recovery action, and an `ErrorState` (`role="alert"`) with a retry button that calls the
  resource's `reload`. Card-based views (Today, calendar, policy list/reader, notice board) use
  `SkeletonCards` / `Skeleton`, `EmptyState` and `ErrorState` directly. All data goes through
  `useAsyncData` / `useResource`, which surface the API error message.
- [x] **`npm run build` + `npm run lint` pass** — see gate output above (build clean, lint exit 0
  with zero warnings).
- [x] Additional checks: no emoji used as icons (icon set is inline Lucide-style SVG in
  `components/ui/Icon.tsx`); tables use semantic `<th scope="col">` + `<caption>` and are never
  used for layout; forms use real `<label for>` with `aria-invalid` and `aria-describedby` linking
  both hint and error text, and `required` on required fields; no secrets, tokens or `.env` files
  are included in the change (the demo password is a documented mock fixture, as before).

### Notes / limits

- Backend task APIs (TASK-03/04/05) were not merged at the time of writing, so the app runs
  mock-first. The `httpAdapter` implements the identical `ApiClient` contract, so switching to the
  real API is an env flag (`USE_MOCK=false`) rather than a page rewrite.
- Policy and announcement management (create/edit/publish) is Admin-only in the permission matrix;
  the pages surface that affordance as a disabled, labelled control for Admin only, since no
  management endpoints exist in the contract yet.

Commit: _(recorded below after commit)_
