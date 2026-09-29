"""Standalone RAG service for Agentic HRMS (PROJECT.md section 9).

Public surface used by the agent core (TASK-07) and any API layer:

- :func:`ingest_docs` / :class:`RagPipeline` for ingestion and retrieval
- :meth:`RagPipeline.answer` for grounded answers with citations
- :meth:`TfidfStore.search` for raw scored chunks, with ``allowed_docs`` for
  document-level access control (PROJECT.md section 20)
"""

from app.ai.rag.chunker import (
    DEFAULT_CHUNK_OVERLAP,
    DEFAULT_CHUNK_SIZE,
    Chunk,
    chunk_markdown,
    make_chunk_id,
    parse_markdown_sections,
)
from app.ai.rag.pipeline import (
    NO_ANSWER_MESSAGE,
    SEED_POLICIES_DIR,
    RagAnswer,
    RagPipeline,
    answer_question,
    build_prompt,
    ingest_docs,
    load_documents,
)
from app.ai.rag.store import SearchResult, TfidfStore, tokenize

__all__ = [
    "DEFAULT_CHUNK_OVERLAP",
    "DEFAULT_CHUNK_SIZE",
    "NO_ANSWER_MESSAGE",
    "SEED_POLICIES_DIR",
    "Chunk",
    "RagAnswer",
    "RagPipeline",
    "SearchResult",
    "TfidfStore",
    "answer_question",
    "build_prompt",
    "chunk_markdown",
    "ingest_docs",
    "load_documents",
    "make_chunk_id",
    "parse_markdown_sections",
    "tokenize",
]
