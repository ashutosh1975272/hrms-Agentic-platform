# Agentic HRMS — Backend

FastAPI service for the Agentic HRMS platform (see `../PROJECT.md` and `../PLAN.md`).

## Requirements

- Python 3.11+
- SQLite for local development (swap `DATABASE_URL` for Postgres in production)

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload
```

The API is then available at <http://127.0.0.1:8000>:

- `GET /health` → `200 {"status":"ok"}`
- `GET /docs` → interactive OpenAPI/Swagger UI

## Test

```bash
pytest
```

## Configuration

Settings come from environment variables (or a local, git-ignored `.env` file).
Never commit `.env` or credentials.

| Variable        | Default                 | Description                            |
| --------------- | ----------------------- | -------------------------------------- |
| `DATABASE_URL`  | `sqlite:///./hrms.db`   | SQLAlchemy database URL                |
| `APP_NAME`      | `Agentic HRMS API`      | Application title                      |
| `APP_VERSION`   | `0.1.0`                 | Application version                    |
| `API_V1_PREFIX` | `/api/v1`               | Prefix for versioned API routers       |

Settings are defined in `app/core/config.py`; the engine, session factory,
declarative base, and the `get_db` dependency live in `app/db.py`.

## Layout

```
backend/
  app/
    main.py          # FastAPI application and /health endpoint
    db.py            # SQLAlchemy engine, session, Base, get_db
    core/config.py   # pydantic-settings configuration
  tests/
    test_health.py   # /health smoke tests
  seed_policies/     # Markdown policy docs for RAG (added in TASK-08)
  requirements.txt
```
