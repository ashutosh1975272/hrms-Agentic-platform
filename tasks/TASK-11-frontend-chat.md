# TASK-11: Frontend AI chat UI (premium UI)

- Status: queued
- Mode: frontend-dev
- Branch: `feature/TASK-11-frontend-chat`
- Depends on: TASK-07 (agent API). If not merged, build against a mock agent adapter with the planned contract and sample conversations from PROJECT.md §17.

## Required reading (before coding)
1. `PROJECT.md` sections 6-8, 12, 14-15 (agent behavior, CRUD, confirmation, context).
2. `.kilocode/rules/ui-ux.md` — MANDATORY visual standard + `design-system/agentic-hrms/MASTER.md`.
3. `../agent-resources/Front-End-Checklist/skills/frontend-checklist-global/SKILL.md`.

## Deliverables (`frontend/src/`)
- Chat panel (dockable sidebar + full-page view): message list with user/agent bubbles,
  markdown rendering, tool-call progress indicators ("Checking permissions…", "Searching policies…"),
  confirmation cards for sensitive actions (Approve/Deny buttons), follow-up question prompts,
  conversation history list, new-chat, typing/streaming states, error + retry states.
- Matches MASTER.md style; responsive (drawer on mobile).

## Acceptance criteria
- [ ] All 4 PROJECT.md §17 scenarios playable in UI (mock or real API)
- [ ] Confirmation cards + permission-denied states visibly handled
- [ ] FULL ui-ux.md pre-delivery checklist confirmed in report
- [ ] `npm run build` + `npm run lint` pass

## Agent report
(Agent fills: gate output, checklist confirmation, commit hash.)
