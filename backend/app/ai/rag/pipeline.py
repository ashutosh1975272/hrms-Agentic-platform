"""RAG pipeline: document ingestion and grounded answers over policy documents.

The service is standalone (no dependency on the agent core) so it can be wired
into the AI assistant later. Retrieval is local TF-IDF over markdown chunks, so
every call is offline, deterministic, and free of secrets or external calls.

Flow (PROJECT.md section 9):
    documents -> load -> chunk -> TF-IDF index -> search -> grounded answer.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.ai.rag.chunker import (
    DEFAULT_CHUNK_OVERLAP,
    DEFAULT_CHUNK_SIZE,
    Chunk,
    chunk_markdown,
)
from app.ai.rag.store import SearchResult, TfidfStore

SEED_POLICIES_DIR = Path(__file__).resolve().parents[3] / "seed_policies"
SUPPORTED_SUFFIXES = (".md", ".markdown", ".txt")
NO_ANSWER_MESSAGE = (
    "I could not find an answer to that in the company knowledge base. "
    "Try rephrasing the question or contact HR."
)
DEFAULT_MIN_SCORE = 0.01


def load_documents(directory: str | Path) -> list[tuple[Path, str]]:
    """Return ``(path, text)`` for supported documents, sorted for determinism."""
    root = Path(directory)
    if not root.is_dir():
        raise NotADirectoryError(f"Knowledge base directory not found: {root}")

    documents = [
        (path, path.read_text(encoding="utf-8"))
        for path in sorted(root.iterdir())
        if path.is_file() and path.suffix.lower() in SUPPORTED_SUFFIXES
    ]
    return documents


def ingest_docs(
    directory: str | Path = SEED_POLICIES_DIR,
    *,
    index_path: str | Path | None = None,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    metadata_by_doc: dict[str, dict[str, Any]] | None = None,
) -> TfidfStore:
    """Build a TF-IDF index from every supported document in ``directory``.

    ``index_path`` optionally persists the index as JSON so a later process can
    reload it with :meth:`TfidfStore.load` instead of re-reading the corpus.
    """
    metadata_by_doc = metadata_by_doc or {}
    store = TfidfStore()

    for path, text in load_documents(directory):
        doc_id = path.stem
        chunks = chunk_markdown(
            text,
            source=path.name,
            doc_id=doc_id,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            metadata=metadata_by_doc.get(doc_id, {}),
        )
        store.add_many(chunks)

    if index_path is not None:
        store.save(index_path)
    return store


@dataclass(frozen=True)
class RagAnswer:
    """Grounded answer plus the evidence it was built from."""

    question: str
    answer: str
    results: list[SearchResult]
    citations: list[str]

    @property
    def top_source(self) -> str | None:
        return self.results[0].chunk.source if self.results else None

    @property
    def found(self) -> bool:
        return bool(self.results)


class RagPipeline:
    """Retrieval service over a chunked, TF-IDF indexed knowledge base."""

    def __init__(
        self,
        store: TfidfStore | None = None,
        *,
        default_top_k: int = 3,
        min_score: float = DEFAULT_MIN_SCORE,
    ) -> None:
        self.store = store if store is not None else TfidfStore()
        self.default_top_k = default_top_k
        self.min_score = min_score

    @property
    def document_ids(self) -> set[str]:
        return self.store.document_ids

    def ingest(
        self,
        directory: str | Path = SEED_POLICIES_DIR,
        *,
        index_path: str | Path | None = None,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    ) -> "RagPipeline":
        """Replace the current index with the documents found in ``directory``."""
        self.store = ingest_docs(
            directory,
            index_path=index_path,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )
        return self

    def search(
        self,
        question: str,
        top_k: int | None = None,
        *,
        allowed_docs: Iterable[str] | None = None,
        min_score: float | None = None,
    ) -> list[SearchResult]:
        return self.store.search(
            question,
            top_k=self.default_top_k if top_k is None else top_k,
            allowed_docs=allowed_docs,
            min_score=self.min_score if min_score is None else min_score,
        )

    def answer(
        self,
        question: str,
        top_k: int | None = None,
        *,
        allowed_docs: Iterable[str] | None = None,
        min_score: float | None = None,
    ) -> RagAnswer:
        """Return a grounded, extractive answer for ``question``.

        No language model is called: the answer quotes the retrieved chunks and
        cites their sources, so it can never assert facts absent from the
        knowledge base. Callers with an LLM provider can feed
        :attr:`RagAnswer.results` into their own prompt.
        """
        results = self.search(
            question, top_k, allowed_docs=allowed_docs, min_score=min_score
        )
        if not results:
            return RagAnswer(
                question=question, answer=NO_ANSWER_MESSAGE, results=[], citations=[]
            )

        citations = _unique([result.chunk.source for result in results])
        lines = [
            f"{index}. {result.chunk.text.strip()}"
            f" (Source: {result.chunk.citation}, relevance {result.score:.3f})"
            for index, result in enumerate(results, start=1)
        ]
        return RagAnswer(
            question=question,
            answer="According to the company policy documents:\n" + "\n".join(lines),
            results=results,
            citations=citations,
        )


def _unique(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def build_prompt(question: str, results: Iterable[SearchResult]) -> str:
    """Render retrieved chunks as an LLM prompt context block.

    Provided for the agent core (TASK-07); this module itself never calls a
    model and never handles credentials.
    """
    context = "\n\n".join(
        f"[{index}] {result.chunk.citation}\n{result.chunk.text.strip()}"
        for index, result in enumerate(results, start=1)
    )
    return (
        "Answer the question using only the policy context below. "
        "If the context does not contain the answer, say so.\n\n"
        f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
    )


def answer_question(
    question: str,
    top_k: int = 3,
    *,
    allowed_docs: Iterable[str] | None = None,
    min_score: float | None = None,
) -> RagAnswer:
    """Answer a question against the default seed policy knowledge base."""
    return RagPipeline(ingest_docs(SEED_POLICIES_DIR)).answer(
        question, top_k, allowed_docs=allowed_docs, min_score=min_score
    )


__all__ = [
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
]
