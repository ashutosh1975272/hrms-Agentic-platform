# Agentic HRMS — Build Plan

Reference spec: `PROJECT.md` (authoritative). Task queue: `tasks/STATUS.md`.

## 1. Stack decisions (lead-approved)

- **Backend** (`backend/`): Python 3.11+, FastAPI, SQLAlchemy 2, SQLite dev database file
  (`DATABASE_URL` switchable to Postgres), JWT auth (`python-jose`), `passlib[bcrypt]`,
  `pytest` + `httpx` for API tests.
- **Frontend** (`frontend/`): React + Vite + TypeScript + TailwindCSS, `react-router-dom`,
  gates: `npm run build` + `npm run lint` must pass.
- **AI service** (inside backend, `backend/app/ai/`): agent orchestrator (intent router +
  tool layer with permission checks), conversation context store, confirmation flow,
  audit hooks. RAG: local TF-IDF retrieval over chunked Markdown policies in
  `backend/seed_policies/` (no GPU, no heavy deps). LLM provider: OpenAI-compatible
  API via env vars (`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`), with a deterministic
  `MockLLM` fallback so all tests run offline.
- **Seed policies** (`backend/seed_policies/*.md`): work-from-home, leave, attendance,
  code of conduct — short realistic docs used by RAG tests.

## 2. Folder layout

```
agentic-hrms/
  PROJECT.md  PLAN.md  README.md
  .kilocodemodes            # agent team (modes)
  .kilocode/rules/          # workflow + coding rules for agents
  tasks/STATUS.md           # live queue board (lead-owned)
  tasks/TASK-NN-*.md        # one brief per feature
  backend/app/{api,core,models,schemas,services,ai}/  tests/
  backend/seed_policies/
  frontend/src/{pages,components,api,auth}/
  docs/                     # user + API + agent docs
```

## 3. Feature breakdown (build order)

| Task | Feature | Owner mode | Branch | Key acceptance |
|---|---|---|---|---|
| TASK-01 | Repo scaffold + backend skeleton (FastAPI app, config, `/health`, pytest green) | backend-dev | `feature/TASK-01-scaffold` | `pytest` passes; `/health` 200 |
| TASK-02 | Auth + RBAC (users, 3 roles, JWT login, permission layer + matrix from PROJECT.md §13, tests) | backend-dev | `feature/TASK-02-auth` | login works; matrix enforced; tests green |
| TASK-03 | Employee + Department + Designation APIs + tests | backend-dev | `feature/TASK-03-employees` | CRUD per matrix; tests green |
| TASK-04 | Attendance APIs (check-in/out, views, corrections) + tests | backend-dev | `feature/TASK-04-attendance` | flows + reports; tests green |
| TASK-05 | Leave APIs (types, apply, balance, approve/reject, cancel) + tests | backend-dev | `feature/TASK-05-leave` | workflow E2E; tests green |
| TASK-06 | Audit logging + policy docs CRUD + tests | backend-dev | `feature/TASK-06-audit` | every mutation logged; tests green |
| TASK-07 | AI agent core (intent router, tool layer w/ permission checks, context, confirmation flow) + MockLLM tests incl. §17 scenarios | ai-engineer | `feature/TASK-07-agent` | scenarios 17.1–17.4 pass as tests |
| TASK-08 | RAG pipeline (ingestion, chunking, local retrieval, grounded answers) + tests | ai-engineer | `feature/TASK-08-rag` | WFH-policy QA grounded; tests green |
| TASK-09 | Frontend shell (login, role routing, 3 dashboards) | frontend-dev | `feature/TASK-09-frontend-shell` | build+lint pass; dashboards render |
| TASK-10 | Frontend HRMS modules (employees, attendance, leaves) | frontend-dev | `feature/TASK-10-frontend-modules` | build+lint pass; CRUD via API |
| TASK-11 | Frontend AI chat UI + integration | frontend-dev | `feature/TASK-11-frontend-chat` | chat works E2E w/ backend |
| TASK-12 | Security pass + full E2E + docs (all §17 scenarios live, leak/secrets audit, README/docs) | security+qa+docs | `feature/TASK-12-hardening` | all green; lead final review |

## 4. Gates (no exceptions)

1. Agent works ONLY on its task branch; never commits to `main`.
2. Task done = acceptance criteria met + test gate green + task file status updated + committed.
3. Lead (me) reviews every task: diff review + independent test run + spec check. Fail -> fix task re-queued.
4. Merge to `main` only after lead approval. PRs raised when GitHub remote is connected.
5. Never commit secrets, tokens, `.env`, or credentials. Ever.

## 5. Skills/tools each agent must use (from `../agent-resources/`)

- **All coding agents**: `superpowers/skills/test-driven-development/SKILL.md` (write tests first),
  `superpowers/skills/systematic-debugging/SKILL.md` (on failures),
  `superpowers/skills/verification-before-completion/SKILL.md` (before declaring done).
- **Frontend agents**: `Front-End-Checklist/skills/frontend-checklist-global/SKILL.md` + relevant
  category skills (accessibility, forms, performance); `Front-End-Checklist/README.md` checklist.
- **AI agents**: `ruflo` CLI (`../../.local/bin/ruflo`) for orchestration reference;
  `agency-agents/engineering/engineering-ai-engineer.md` for agent patterns.
- **Backend agents**: `agency-agents/engineering/engineering-backend-architect.md`,
  `engineering-api-platform-engineer.md`, `engineering-code-reviewer.md`.
- **Security reviewer**: `agency-agents/security/` + PROJECT.md §20.
- **QA**: `agency-agents/testing/` + PROJECT.md §17 scenarios as E2E tests.

## 6. Roles

- **Lead (me, outside the IDE)**: breaks down work, assigns tasks one-by-one, runs gates,
  reviews every diff, merges. I do not write feature code.
- **Kilo modes (inside the IDE)**: implement exactly one assigned task each, then stop and report.
