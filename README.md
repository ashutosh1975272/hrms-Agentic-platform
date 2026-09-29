# Agentic HRMS

A role-based Human Resource Management System with an AI assistant that can
answer questions about company policy, report your own HR data, and perform
authorized operations through natural language - without ever bypassing the
same authorization rules the dashboard enforces.

Three roles, **Admin**, **HR** and **Employee**, each with its own dashboard,
data scope and permissions.

## How it works

```
USER -> Authentication -> Role -> Permission Check -> AI Agent
                                     |-> RAG agent   -> policy documents (vector search)
                                     |-> Database    -> HRMS data (employees, leave, attendance)
                                     |-> Action      -> authorized tools
                                  -> Response
```

- **Policy questions** are answered from the knowledge base with retrieval, so
  the answer is grounded in a document you can open.
- **HR data** (leave balance, attendance, employee records) is answered by
  structured database queries, never by retrieval.
- **Actions** (create an employee, approve a leave) go through the same
  permission matrix the UI uses, and a denied action never reaches the tool.
- **Sensitive actions** require explicit confirmation, and every mutation is
  written to an audit log.

`PROJECT.md` is the authoritative specification; this file only summarises it.

## Status

The project is under active build, task by task, against the queue in
[`tasks/STATUS.md`](tasks/STATUS.md). Today:

| Area | State |
|---|---|
| Backend scaffold, `/health`, config | Done (TASK-01) |
| Auth and RBAC | In progress (TASK-02) |
| Frontend shell, login, role routing, three dashboards | Done (TASK-09) |
| HRMS modules, AI chat UI | In progress (TASK-10, TASK-11) |
| AI agent, RAG, remaining modules | Queued (TASK-03 - TASK-08) |
| E2E harness, CI, docs | Done (TASK-13) |
| Security pass | Queued (TASK-12) |

The backend currently serves one route, `GET /health`; the frontend runs on
mock data so the whole app is usable before the API lands. See
[`docs/API.md`](docs/API.md) for the live endpoint table.

## Getting started

Full, verified instructions are in [`docs/SETUP.md`](docs/SETUP.md). The short
version:

```bash
# Backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend && uvicorn app.main:app --reload

# Frontend (second terminal)
cd frontend && npm ci && npm run dev
```

## Repository layout

```
backend/            FastAPI service, pytest suite, seed policy documents
frontend/           React + Vite + TypeScript + TailwindCSS app
tests/e2e/          PROJECT.md section 17 scenarios against offline mocks
design-system/      UI standard every frontend change follows
docs/               Setup and API reference
tasks/              Task queue and per-task briefs
.github/workflows/  CI
PROJECT.md          Requirements - the source of truth
PLAN.md             Build plan and gates
```

## Tests and gates

| Suite | Command | Verified result |
|---|---|---|
| Backend | `cd backend && python -m pytest` | 2 passed |
| End-to-end | `python -m pytest tests/e2e -m e2e` | 5 passed |
| Frontend | `cd frontend && npm run lint && npm run test && npm run build` | 60 tests passed, build and lint clean |
| CI config | `yamllint .github/workflows/ci.yml` | clean |

The end-to-end suite encodes the four acceptance scenarios from
`PROJECT.md` section 17 and runs offline against mock adapters -
[`tests/e2e/README.md`](tests/e2e/README.md) explains how to run the same
scenarios against a real backend.

## Documentation

| Document | What it covers |
|---|---|
| [`PROJECT.md`](PROJECT.md) | Requirements, roles, permission matrix, acceptance scenarios |
| [`PLAN.md`](PLAN.md) | Stack decisions, build order, quality gates |
| [`docs/SETUP.md`](docs/SETUP.md) | Verified install, run, test and configuration commands |
| [`docs/API.md`](docs/API.md) | Endpoint table generated from the running service |
| [`tests/e2e/README.md`](tests/e2e/README.md) | E2E harness layout and how to re-point it at a real backend |
| [`backend/README.md`](backend/README.md) | Backend specifics |
| [`frontend/README.md`](frontend/README.md) | Frontend specifics, mock mode, expected REST contract |
| [`design-system/agentic-hrms/MASTER.md`](design-system/agentic-hrms/MASTER.md) | UI standard |

## Security

Authorization is enforced in the backend for every request and every AI tool
call; the assistant cannot widen its own permissions. Employee data is scoped
to the caller, destructive actions require confirmation, inputs are validated
before any database change, and important operations are audited.

Configuration is supplied through environment variables or a git-ignored `.env`
file. **Never commit secrets, tokens, API keys or `.env` files.**
