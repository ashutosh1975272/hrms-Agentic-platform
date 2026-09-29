# Setup

Every command in this file was run before it was written down. The versions
below are the ones it was verified on; the supported floors are in brackets.

| Tool | Verified on | Floor |
|---|---|---|
| Python | 3.12.3 | 3.11 (`PLAN.md` section 1) |
| Node.js | 22.22.1 | 20.19 (Vite 7) |
| npm | 10.9.4 | ships with Node |

No database server, no LLM key and no network access are needed for the
commands below.

## Repository layout

```
agentic-hrms/
  backend/           FastAPI service, its tests and the seed policy documents
  frontend/          React + Vite + TypeScript app
  tests/e2e/         PROJECT.md section 17 scenarios (offline, mocks)
  docs/              this file, API.md
  design-system/     the UI standard the frontend follows
  .github/workflows/ CI
```

## Backend

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

Run the API:

```bash
cd backend
uvicorn app.main:app --reload
```

The service listens on <http://127.0.0.1:8000>. If that port is taken, add
`--port <n>` - for example `uvicorn app.main:app --reload --port 8123`.

Check it is alive:

```bash
curl http://127.0.0.1:8000/health
# {"status":"ok"}
```

Backend tests (from `backend/`):

```bash
python -m pytest
```

```
2 passed, 1 warning in 0.53s
```

The one warning is a `StarletteDeprecationWarning` from the pinned FastAPI /
Starlette test client; it does not affect results.

## Frontend

```bash
cd frontend
npm ci
```

Start the dev server:

```bash
npm run dev
```

Vite prints the local URL; the default is <http://127.0.0.1:5173>. Pass
`-- --port <n>` if that port is taken. The app starts in mock mode, so it runs
with no backend - see `frontend/README.md` for the demo accounts and the REST
contract it expects.

Frontend gates:

```bash
npm run lint     # eslint .
npm run test     # vitest run
npm run build    # tsc -b && vite build
```

```
Test Files  6 passed (6)
     Tests  60 passed (60)
```

## End-to-end scenarios

From the repository root, with the backend virtualenv active:

```bash
python -m pytest tests/e2e -m e2e
```

```
5 passed in 0.08s
```

These four scenarios (`PROJECT.md` section 17) run against in-memory mock
adapters: no server, no database, no key. `tests/e2e/README.md` explains how to
re-point the same scenarios at the real backend.

## Configuration

### Backend

Settings are read from the environment or from a local `.env` in `backend/`
(`backend/app/core/config.py`). **Never commit `.env` or any credential** - the
files are git-ignored, and `.env.example` is the only one that belongs in the
repository.

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./hrms.db` | SQLAlchemy database URL; point at Postgres in production |
| `APP_NAME` | `Agentic HRMS API` | Title in the OpenAPI schema |
| `APP_VERSION` | `0.1.0` | Version in the OpenAPI schema |
| `API_V1_PREFIX` | `/api/v1` | Prefix for versioned routers |

An `APP_NAME` exported in your shell overrides the default, so `curl
http://127.0.0.1:8000/openapi.json` may show a different title than the table
above.

`LLM_BASE_URL`, `LLM_API_KEY` and `LLM_MODEL` (`PLAN.md` section 1) arrive with
the AI agent in TASK-07. They are not read yet, and the agent falls back to a
deterministic offline LLM, so leave them unset until then. Never commit a key.

### Frontend

```bash
cd frontend
cp .env.example .env.local
```

| Variable | Default | Purpose |
|---|---|---|
| `USE_MOCK` | `true` | `true` uses the in-memory mock adapter, `false` calls the real API |
| `VITE_API_BASE_URL` | `/api` | Backend base URL when `USE_MOCK=false` |

`.env.local` is git-ignored (`frontend/.gitignore`).

## CI

`.github/workflows/ci.yml` runs on every push and pull request:

| Job | Steps |
|---|---|
| `backend` | `pip install -r requirements.txt`, `python -m pytest`, `python -m pytest tests/e2e -m e2e`, `yamllint .github/workflows/ci.yml` |
| `frontend` | `npm ci`, `npm run lint`, `npm run test`, `npm run build` |

Both jobs run with read-only repository permissions. To check the workflow file
locally:

```bash
pip install yamllint
yamllint .github/workflows/ci.yml
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `[Errno 98] address already in use` | Pass `--port <n>` to `uvicorn`, or `-- --port <n>` to `npm run dev` |
| `ModuleNotFoundError: No module named 'app'` | Run `pytest` from inside `backend/`, where `pytest.ini` sets `pythonpath` |
| `ModuleNotFoundError: No module named 'adapters'` | Run the e2e suite from the repository root, where `pytest.ini` sets `pythonpath = tests/e2e` |
| `hrms.db not found` | The SQLite file is created on first write; the scaffold does not need it yet |
