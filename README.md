# Agentic HRMS — Role-Based AI-Powered Human Resource Management System

Everything for this project lives in THIS folder (single location).

## Start here
1. `HOW-WE-WORK.md` — master note: how the team works, file map, A2A loop.
2. `PROJECT.md` — full requirements (source of truth).
3. `PLAN.md` — build plan, stack, gates, requirement coverage.
4. `tasks/STATUS.md` — live task queue board.

## Build & run
- Backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app`
- Frontend: `cd frontend && npm install && npm run dev`
- Details: `backend/README.md`, `frontend/README.md`, `docs/SETUP.md`.

## For agents
- Task briefs: `tasks/TASK-NN-*.md` (implement exactly one per session).
- Rules: `.kilocode/rules/` · Roster: `.kilo/agents/` · Modes: `.kilocodemodes`.
- Design: `design-system/agentic-hrms/MASTER.md` · PRs: `docs/PR-RULES.md`.
- Talk to Lead: `docs/LEAD-CAPABILITIES.md` + `.lead/inbox|outbox`.

## Status
See `tasks/STATUS.md`. Only the Lead merges to `main`. Never commit secrets.
