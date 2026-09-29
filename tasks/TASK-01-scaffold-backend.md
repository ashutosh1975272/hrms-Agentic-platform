# TASK-01: Backend scaffold + skeleton

- Status: doing
- Mode: backend-dev
- Branch: `feature/TASK-01-scaffold`
- Depends on: nothing (first task)

## Objective
Scaffold the backend so the team has a runnable, tested foundation.

## Required reading (before coding)
1. `PROJECT.md` sections 1-5, 19 (what we are building).
2. `../agent-resources/superpowers/skills/test-driven-development/SKILL.md` — write the health test FIRST.
3. `../agent-resources/agency-agents/engineering/engineering-backend-architect.md` — architecture patterns.

## Deliverables
- `backend/requirements.txt` (fastapi, uvicorn, sqlalchemy, pydantic, pydantic-settings, pytest, httpx, python-jose, passlib[bcrypt], python-multipart)
- `backend/app/__init__.py`, `backend/app/main.py` (FastAPI app with `/health` -> `{"status":"ok"}`), `backend/app/core/config.py` (settings with `DATABASE_URL`, default sqlite `./hrms.db`), `backend/app/db.py` (engine + session)
- `backend/tests/test_health.py` (TestClient asserts 200 + body)
- `backend/README.md` (setup: `pip install -r requirements.txt`, run: `uvicorn app.main:app`, test: `pytest`)
- `.gitignore` at repo root (python, node, venv, `*.db`, `.env`, `__pycache__`, `node_modules/`, `dist/`)

## Acceptance criteria
- [ ] `cd backend && pip install -r requirements.txt && python -m pytest` passes
- [ ] `uvicorn app.main:app` serves `/health` -> 200 `{"status":"ok"}`
- [ ] No secrets committed; `.gitignore` covers `.env` and `*.db`

## Agent report
(Agent fills: gate output, commit hash.)
