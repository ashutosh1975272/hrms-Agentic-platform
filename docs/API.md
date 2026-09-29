# API reference

Base URL in development: `http://127.0.0.1:8000`

The table below is generated from the live FastAPI app (`backend/app/main.py`),
not hand-maintained. Regenerate it after adding or changing a route:

```bash
cd backend
python -c "
from app.main import app
for path, ops in app.openapi()['paths'].items():
    for method, op in ops.items():
        print(f'| \`{method.upper()} {path}\` | {op.get(\"summary\") or \"\"} | {\", \".join(op.get(\"tags\", []))} |')
"
```

The service also serves its own machine-readable schema, so this file never has
to be the source of truth:

| URL | What it is |
|---|---|
| `GET /openapi.json` | OpenAPI 3 schema - the authoritative endpoint list |
| `GET /docs` | Swagger UI, interactive |
| `GET /redoc` | ReDoc rendering |

## Current surface

As of TASK-13 the backend is still the TASK-01 scaffold: one route.

| Method and path | Summary | Tag | Auth |
|---|---|---|---|
| `GET /health` | Liveness probe. Returns `200 {"status":"ok"}`. | `system` | None |

```bash
curl http://127.0.0.1:8000/health
# {"status":"ok"}
```

## How the surface grows

Each task adds routers under the `API_V1_PREFIX` setting (`/api/v1` by default,
`backend/app/core/config.py`). Planned coverage, in the order it lands:

| Area | Task | Endpoints |
|---|---|---|
| Auth and RBAC | TASK-02 | Login, token refresh, current user, user and role administration |
| Employees, departments, designations | TASK-03 | CRUD plus search and lookup |
| Attendance | TASK-04 | Check-in, check-out, daily/monthly views, corrections, reports |
| Leave | TASK-05 | Leave types, apply, balance, history, approve/reject, cancel |
| Audit and policy documents | TASK-06 | Audit log query, policy document CRUD |
| AI agent | TASK-07 | Chat endpoint, confirmation, conversation context |
| RAG | TASK-08 | Policy search and grounded question answering |

This table is a plan, not a contract: only the "Current surface" section above is
verified against the running service. `PROJECT.md` section 11 lists the AI tool
capabilities the endpoints must eventually expose.

## Authentication

Endpoints added from TASK-02 onwards are authenticated with a bearer token from
the login endpoint:

```http
Authorization: Bearer <access_token>
```

Authorization is enforced per operation by the permission matrix in
`PROJECT.md` section 13 - the same matrix the AI tool layer checks before every
call (`PROJECT.md` section 20). Unauthenticated requests return `401`; a
permitted role that lacks the permission for the operation returns `403`.

## Conventions

- JSON request and response bodies; UTF-8.
- Timestamps are ISO 8601.
- Validation failures return `422` with the offending field paths.
- Every mutating operation writes an audit entry (`PROJECT.md` section 16).
