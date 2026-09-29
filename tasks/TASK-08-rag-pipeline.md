# TASK-08: RAG pipeline (standalone service)

- Status: review
- Mode: ai-engineer
- Branch: `feature/TASK-08-rag`
- Depends on: TASK-00 only (seed docs merged). STANDALONE: no agent-core dependency; expose clean functions for later wiring.

## Required reading (before coding)
1. `PROJECT.md` sections 5.5, 6.2, 9, 20 (last bullet: doc-level access).
2. `../agent-resources/superpowers/skills/test-driven-development/SKILL.md`.
3. `../agent-resources/agency-agents/engineering/engineering-ai-engineer.md`.

## Deliverables (`backend/app/ai/rag/` + tests)
- `chunker.py` (markdown-aware chunking ~500 chars + overlap), `store.py` (local TF-IDF index, add/search, persist to JSON file), `pipeline.py` (`ingest_docs(dir)`, `answer(question, top_k)` returning chunks + grounded-answer template output), `__init__.py` exports.
- `backend/tests/test_rag.py`: ingestion of `backend/seed_policies/` (6 docs), WFH-policy question returns WFH chunk ranked first, unrelated question returns low scores, determinism (same query twice = same result).

## Acceptance criteria
- [x] `python -m pytest tests/test_rag.py` passes; full `pytest` still passes
- [x] No heavy ML deps (stdlib + scikit-learn optional; prefer pure-python TF-IDF)
- [x] No secrets committed

## Agent report

### What was built

Standalone RAG service in `backend/app/ai/rag/` (no agent-core dependency, no new
requirements — standard library only):

- `chunker.py` — `Chunk` dataclass (chunk_id/doc_id/source/heading/text/index/metadata,
  JSON round-trip) and `chunk_markdown()`. Markdown-aware: splits on headings, then
  on sentence boundaries, keeps markdown table rows whole, targets ~500 chars with an
  80-char overlap, merges tiny tails, deterministic sha1-based `chunk_id`s.
- `store.py` — `TfidfStore`: pure-python TF-IDF (smoothed idf, sublinear tf,
  L2-normalised vectors, cosine via dot product). `add`/`add_many` (re-ingestion
  replaces a document), `remove_document`, `search(query, top_k, allowed_docs=...,
  min_score=...)` returning `SearchResult(chunk, score)`, `save`/`load` to a single
  JSON file, `len`/iteration/`document_ids`. `allowed_docs` is the hook for
  document-level access control (PROJECT.md §20).
- `pipeline.py` — `load_documents`, `ingest_docs(dir, index_path=...)`,
  `RagPipeline` (`.ingest()`, `.search()`, `.answer()`, `.document_ids`),
  `RagAnswer` (answer, results, citations, `top_source`, `found`),
  `answer_question()` module-level convenience, `build_prompt()` for the agent core
  to hand retrieved context to an LLM provider later.
- `__init__.py` — re-exports the public surface; `app/ai/__init__.py` added.
- `backend/README.md` — RAG service usage section added to the layout.

Behaviour: answers are extractive and grounded — the answer quotes the retrieved
chunks and cites `source - heading`. No LLM call, no network call, no credentials.
When nothing clears `min_score` (default 0.01) the answer is
`NO_ANSWER_MESSAGE` rather than a guess.

### Tests (`backend/tests/test_rag.py`, 38 tests)

Written test-first per the TDD skill; every test was run red before its
implementation. Covers: chunk sizing/overlap/heading/id stability/empty input,
sentence-boundary starts, table rows not split, TF-IDF ranking, top_k,
determinism, stopword-only queries, `allowed_docs` filtering, `min_score`,
document replace/remove, JSON save/load round-trip, tokenisation, and the
seed-corpus scenarios required by the brief — ingestion of all 6
`backend/seed_policies/` docs, the WFH question returning a `wfh-policy.md` chunk
first, unrelated questions returning no results, and repeat-query determinism.

### Retrieval quality check (measured, not assumed)

Corpus: 6 docs → 83 chunks, 83–496 chars, no chunk exceeding 500, no chunk
splitting a table row, no chunk starting mid-sentence in new content.

Wider suffix stemming (`-s`/`-ing`/`-ed`) was implemented, measured on the seed
corpus, and **rejected**: top-1 accuracy on 8 policy questions dropped 6/8 → 5/8
and it introduced a false match (leave-policy chunks scoring for "WFH days per
week"). Only `-ies` → `-y` folding is kept; the rejected experiment is recorded in
the `stem()` docstring.

### Gate output

```
$ python -m pytest tests/test_rag.py
......................................                                   [100%]
38 passed in 0.22s

$ python -m pytest
40 passed, 1 warning in 0.66s
```

Full suite includes the pre-existing `tests/test_health.py`. The single warning is
the pre-existing `StarletteDeprecationWarning` from FastAPI's `TestClient`
(present before this task, not introduced by it). Ruff is not installed in the
shared venv, so lint was not run; `python -m compileall` is clean.

Environment note: the system `python3` has no pytest; the shared venv at
`../agentic-hrms/.venv` (Python 3.12.3) was used to run the gates.

### Not in scope

No API routes, no agent wiring (TASK-07), no policy-doc CRUD (TASK-06). The
service exposes plain functions and a class for later wiring.

### Commit

`TASK-08: add standalone RAG service (chunker, TF-IDF store, pipeline) + tests`
— commit `1db95b2` on `feature/TASK-08-rag`.

