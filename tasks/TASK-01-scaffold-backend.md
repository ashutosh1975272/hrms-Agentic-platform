# TASK-01: Backend scaffold + skeleton

- Status: review
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
- [x] `cd backend && pip install -r requirements.txt && python -m pytest` passes
- [x] `uvicorn app.main:app` serves `/health` -> 200 `{"status":"ok"}`
- [x] No secrets committed; `.gitignore` covers `.env` and `*.db`

## Agent report

Implemented on `feature/TASK-01-scaffold` (test-first, per the TDD skill).

### What was built

- `backend/requirements.txt` — fastapi, uvicorn[standard], sqlalchemy 2, pydantic,
  pydantic-settings, python-jose[cryptography], passlib[bcrypt], python-multipart,
  pytest, httpx (pinned ranges).
- `backend/app/main.py` — FastAPI app; `GET /health` -> `200 {"status":"ok"}`.
- `backend/app/core/config.py` — `Settings` (pydantic-settings) with `DATABASE_URL`
  defaulting to `sqlite:///./hrms.db`, plus `APP_NAME`, `APP_VERSION`, `API_V1_PREFIX`.
  Reads env vars / local git-ignored `.env`; no secret is hardcoded. `get_settings()`
  is `lru_cache`d.
- `backend/app/db.py` — SQLAlchemy 2 engine, `SessionLocal`, declarative `Base`,
  and the `get_db` generator dependency. SQLite gets `check_same_thread=False` so the
  engine works under `TestClient`.
- `backend/app/__init__.py`, `backend/app/core/__init__.py` — packages.
- `backend/tests/test_health.py` — two tests: `/health` returns 200, and returns
  exactly `{"status": "ok"}`.
- `backend/pytest.ini` — `pythonpath = .` so both `pytest` and `python -m pytest`
  resolve the `app` package (bare `pytest` otherwise fails collection).
- `backend/README.md` — setup / run / test instructions and config table.
- `.gitignore` (repo root) — python, node, venv, `*.db`, `.env`, `__pycache__`,
  `node_modules/`, `dist/`, plus editor/OS noise.

### TDD evidence (RED -> GREEN)

1. Wrote `tests/test_health.py` first; `python -m pytest` -> `ModuleNotFoundError:
   No module named 'app'`.
2. Added empty `app/__init__.py` + bare `app/main.py` (no route) so the test collects
   and fails on the assertion itself:
   `FAILED test_health_returns_ok_status - assert 404 == 200`
   `FAILED test_health_returns_ok_body - assert {'detail': 'Not Found'} == {'status': 'ok'}`
3. Added the `/health` route -> both pass.

### Gate output

Test gate (`cd backend && python -m pytest`, configfile `pytest.ini`):

```
collected 2 items

tests/test_health.py ..                                                  [100%]

========================= 2 passed, 1 warning in 0.44s =========================
```

Bare `pytest` also passes (`2 passed, 1 warning in 0.46s`).

The single warning is third-party and pre-existing, not from project code:
`StarletteDeprecationWarning: Using httpx with starlette.testclient is deprecated;
install httpx2 instead` (emitted by `fastapi/testclient.py` on starlette 1.7.0).
Noted for the lead; pinning starlette is out of TASK-01 scope.

Server gate (`uvicorn app.main:app --host 127.0.0.1 --port 8137`):

```
INFO:     Uvicorn running on http://127.0.0.1:8137 (Press CTRL+C to quit)
```

```
$ curl -s -i http://127.0.0.1:8137/health
HTTP/1.1 200 OK
server: uvicorn
content-length: 15
content-type: application/json

{"status":"ok"}
```

Secrets check: regex scan for hardcoded password/secret/token/api-key assignments
across `backend/` -> no matches. `git status` staging dry-run lists exactly the 10
intended files; `.venv/` and `.pytest_cache/` are correctly ignored and no `.db`
file is created by the test run (the engine connects lazily).

Commit: `5f0ff44` (scaffold). Follow-up commit records this hash in the task file
and `tasks/STATUS.md`.
