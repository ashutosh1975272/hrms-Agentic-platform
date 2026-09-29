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
    ai/rag/          # RAG service: chunker.py, store.py, pipeline.py
  tests/
    test_health.py   # /health smoke tests
    test_rag.py      # chunking, TF-IDF retrieval, grounded answers
  seed_policies/     # Markdown policy docs ingested by the RAG service
  requirements.txt
```

## RAG service

`app/ai/rag/` is a standalone, offline retrieval service over
`seed_policies/`. It uses only the standard library (no ML dependencies):

```python
from app.ai.rag import RagPipeline, ingest_docs

pipeline = RagPipeline(ingest_docs("seed_policies"))
answer = pipeline.answer("What is the company work-from-home policy?", top_k=3)

answer.top_source  # 'wfh-policy.md'
answer.citations   # ['wfh-policy.md', ...]
answer.answer      # extractive, grounded answer quoting the retrieved chunks
```

- `ingest_docs(dir, index_path=...)` chunks every `.md`/`.txt` document
  (~500 characters, 80-character overlap, sentence and table-row aware) and
  builds the index; `index_path` persists it as JSON for later reload.
- `TfidfStore.search(query, top_k, allowed_docs=...)` returns scored chunks.
  `allowed_docs` enforces document-level access (PROJECT.md §20) so callers can
  restrict retrieval before any text leaves the service.
- `RagPipeline.answer()` returns a grounded, extractive answer with citations.
  It never calls a language model; `build_prompt(question, results)` renders the
  same retrieved context for an LLM provider supplied by the agent core.
- Retrieval is deterministic: the same corpus and query always produce the same
  ranking, so tests run offline with no network access.
