# TASK-02: Auth + RBAC

- Status: doing
- Mode: backend-dev
- Branch: `feature/TASK-02-auth`
- Depends on: TASK-01 (merged)

## Required reading (before coding)
1. `PROJECT.md` sections 4, 7, 13, 20 (roles, agent auth flow, permission matrix, security).
2. `../agent-resources/superpowers/skills/test-driven-development/SKILL.md` — tests first.
3. `../agent-resources/agency-agents/engineering/engineering-backend-architect.md`.

## Deliverables (`backend/`)
- `app/models/user.py` (User: id, email unique, hashed_password, full_name, role enum admin/hr/employee, is_active), `app/schemas/auth.py`, `app/core/security.py` (bcrypt hash/verify, JWT create/decode, SECRET_KEY from settings only — NEVER hardcoded), `app/core/permissions.py` ( RoleChecker dependency implementing PROJECT.md §13 matrix incl. own-data rules), `app/api/auth.py` (POST /auth/login, GET /auth/me), `app/api/users.py` (Admin-only user CRUD minimal for tests), Alembic-free table creation via Base.metadata for dev.
- `tests/test_auth.py`: login success/fail, /me with/without token, matrix denials (employee blocked from admin routes, HR blocked from role management), token expiry handling.

## Acceptance criteria
- [ ] `python -m pytest` passes (all tests incl. TASK-01's)
- [ ] Full §13 matrix enforced server-side; no role logic only in frontend
- [ ] No secrets committed; SECRET_KEY via env/settings with dev default clearly marked

## Agent report
(Agent fills: gate output, commit hash.)
