# TASK-09: Frontend shell + dashboards (mock-first)

- Status: queued
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
(Agent fills: gate output, commit hash.)
