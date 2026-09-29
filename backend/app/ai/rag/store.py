"""Local TF-IDF vector index for RAG retrieval.

Pure-python (stdlib only) so the service runs offline without heavy ML
dependencies. The index is persisted as a single JSON file and can be filtered by
document id, which is how document-level access control is applied
(PROJECT.md section 20).
"""

from __future__ import annotations

import json
import math
import re
from collections.abc import Iterable, Iterator, Mapping
from dataclasses import dataclass
from pathlib import Path

from app.ai.rag.chunker import Chunk

INDEX_VERSION = 1

__all__ = ["INDEX_VERSION", "SearchResult", "TfidfStore", "stem", "tokenize"]

_TOKEN_RE = re.compile(r"[a-z0-9]+")

STOPWORDS = frozenset(
    """
    a about above after again against all am an and any are as at be because been
    before being below between both but by can cannot could did do does doing down
    during each few for from further had has have having he her here hers herself him
    himself his how i if in into is it its itself just me more most my myself no nor
    not of off on once only or other ought our ours ourselves out over own same she
    should so some such than that the their theirs them themselves then there these
    they this those through to too under until up very was we were what when where
    which while who whom why will with would you your yours yourself yourselves
    """.split()
)


@dataclass(frozen=True)
class SearchResult:
    """A scored chunk returned by :meth:`TfidfStore.search`."""

    chunk: Chunk
    score: float


def stem(token: str) -> str:
    """Fold ``-ies`` plurals onto their singular (``policies`` -> ``policy``).

    Deliberately minimal and dependency-free. Wider suffix stripping (plain
    ``-s``, ``-ing``, ``-ed``) was measured against the seed policy corpus and
    rejected: it lowered top-1 accuracy on policy questions and introduced
    false matches, so the simpler rule is kept.
    """
    if len(token) > 4 and token.endswith("ies"):
        return f"{token[:-3]}y"
    return token


def tokenize(text: str) -> list[str]:
    """Lowercase word tokens with English stopwords removed and lightly stemmed."""
    return [
        stemmed
        for token in _TOKEN_RE.findall(text.lower())
        if token not in STOPWORDS
        for stemmed in (stem(token),)
    ]


def _term_frequencies(tokens: Iterable[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for token in tokens:
        counts[token] = counts.get(token, 0) + 1
    return counts


def _l2_normalize(vector: Mapping[str, float]) -> dict[str, float]:
    norm = math.sqrt(sum(value * value for value in vector.values()))
    if norm == 0.0:
        return {}
    return {term: value / norm for term, value in vector.items()}


class TfidfStore:
    """In-memory TF-IDF index over :class:`Chunk` objects."""

    def __init__(self) -> None:
        self._chunks: list[Chunk] = []
        self._vectors: list[dict[str, float]] = []
        self._vocabulary: set[str] = set()
        self._idf: dict[str, float] = {}
        self._indexed = False

    def __len__(self) -> int:
        return len(self._chunks)

    def __iter__(self) -> Iterator[Chunk]:
        return iter(self._chunks)

    @property
    def chunks(self) -> list[Chunk]:
        return list(self._chunks)

    @property
    def document_ids(self) -> set[str]:
        return {chunk.doc_id for chunk in self._chunks}

    def add(self, chunk: Chunk) -> None:
        self.add_many([chunk])

    def add_many(self, chunks: Iterable[Chunk]) -> None:
        """Add chunks, replacing any existing chunks from the same document."""
        incoming = list(chunks)
        replaced = {chunk.doc_id for chunk in incoming}
        if replaced:
            self.remove_document(*replaced)
        for chunk in incoming:
            self._chunks.append(chunk)
        self._indexed = False

    def remove_document(self, *doc_ids: str) -> None:
        targets = set(doc_ids)
        if not targets:
            return
        self._chunks = [chunk for chunk in self._chunks if chunk.doc_id not in targets]
        self._indexed = False

    def clear(self) -> None:
        self._chunks = []
        self._vectors = []
        self._vocabulary = set()
        self._idf = {}
        self._indexed = False

    def _build_index(self) -> None:
        document_frequency: dict[str, int] = {}
        term_frequencies: list[dict[str, int]] = []

        for chunk in self._chunks:
            counts = _term_frequencies(tokenize(chunk.text))
            term_frequencies.append(counts)
            for term in counts:
                document_frequency[term] = document_frequency.get(term, 0) + 1

        total = len(self._chunks)
        self._vocabulary = set(document_frequency)
        self._idf = {
            term: math.log((1.0 + total) / (1.0 + count)) + 1.0
            for term, count in document_frequency.items()
        }

        self._vectors = [
            _l2_normalize(
                {
                    term: (1.0 + math.log(count)) * self._idf[term]
                    for term, count in counts.items()
                }
            )
            for counts in term_frequencies
        ]
        self._indexed = True

    def _query_vector(self, query: str) -> dict[str, float]:
        counts = _term_frequencies(tokenize(query))
        weighted = {
            term: (1.0 + math.log(count)) * self._idf[term]
            for term, count in counts.items()
            if term in self._vocabulary
        }
        return _l2_normalize(weighted)

    def search(
        self,
        query: str,
        top_k: int = 5,
        *,
        allowed_docs: Iterable[str] | None = None,
        min_score: float = 0.0,
    ) -> list[SearchResult]:
        """Return the best matching chunks, highest score first.

        ``allowed_docs`` restricts retrieval to specific document ids so callers
        can enforce document-level access before anything leaves the service.
        """
        if not self._chunks or top_k <= 0:
            return []

        if not self._indexed:
            self._build_index()

        permitted = set(allowed_docs) if allowed_docs is not None else None
        query_vector = self._query_vector(query)
        if not query_vector:
            return []

        scored: list[SearchResult] = []
        for chunk, vector in zip(self._chunks, self._vectors):
            if permitted is not None and chunk.doc_id not in permitted:
                continue
            score = sum(value * vector.get(term, 0.0) for term, value in query_vector.items())
            if score > min_score:
                scored.append(SearchResult(chunk=chunk, score=score))

        # Deterministic ordering: score desc, then document and chunk position.
        scored.sort(key=lambda result: (-result.score, result.chunk.doc_id, result.chunk.index))
        return scored[:top_k]

    def save(self, path: str | Path) -> Path:
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "version": INDEX_VERSION,
            "chunks": [chunk.to_dict() for chunk in self._chunks],
        }
        target.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
        return target

    @classmethod
    def load(cls, path: str | Path) -> "TfidfStore":
        source = Path(path)
        store = cls()
        if not source.exists():
            return store
        payload = json.loads(source.read_text(encoding="utf-8"))
        store.add_many(Chunk.from_dict(item) for item in payload.get("chunks", []))
        return store
