# TASK-10: Frontend HRMS modules (premium UI)

- Status: queued
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
- [ ] All pages above work against mock adapter (or real API if available)
- [ ] Role matrix enforced in UI (Employee never sees admin actions)
- [ ] FULL ui-ux.md pre-delivery checklist confirmed in report
- [ ] `npm run build` + `npm run lint` pass

## Agent report
(Agent fills: gate output, checklist confirmation, commit hash.)
