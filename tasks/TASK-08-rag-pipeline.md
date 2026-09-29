# TASK-08: RAG pipeline (standalone service)

- Status: doing
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
- [ ] `python -m pytest tests/test_rag.py` passes; full `pytest` still passes
- [ ] No heavy ML deps (stdlib + scikit-learn optional; prefer pure-python TF-IDF)
- [ ] No secrets committed

## Agent report
(Agent fills: gate output, commit hash.)
