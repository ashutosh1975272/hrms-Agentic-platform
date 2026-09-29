"""Markdown-aware chunking for the RAG pipeline.

Documents are split on markdown headings first, then on paragraph, sentence and
word boundaries, so that every chunk stays close to ``chunk_size`` characters
while keeping enough overlap for contextual retrieval.
"""

from __future__ import annotations

import hashlib
import re
from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any

DEFAULT_CHUNK_SIZE = 500
DEFAULT_CHUNK_OVERLAP = 80
DEFAULT_MIN_CHUNK_CHARS = 40

_HEADING_RE = re.compile(r"^(#{1,6})\s+(.*\S)\s*$")
_SENTENCE_END_RE = re.compile(r"[.!?:;][\"')\]]*$")
_AVERAGE_WORD_CHARS = 6
_FENCE_RE = re.compile(r"^\s*(```|~~~)")


@dataclass(frozen=True)
class Chunk:
    """A retrievable slice of a source document."""

    chunk_id: str
    doc_id: str
    source: str
    heading: str
    text: str
    index: int
    metadata: Mapping[str, Any] = field(default_factory=dict)

    @property
    def citation(self) -> str:
        """Human readable reference used in grounded answers."""
        if self.heading:
            return f"{self.source} - {self.heading}"
        return self.source

    def to_dict(self) -> dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "doc_id": self.doc_id,
            "source": self.source,
            "heading": self.heading,
            "text": self.text,
            "index": self.index,
            "metadata": dict(self.metadata),
        }

    @classmethod
    def from_dict(cls, payload: Mapping[str, Any]) -> "Chunk":
        return cls(
            chunk_id=payload["chunk_id"],
            doc_id=payload["doc_id"],
            source=payload.get("source", ""),
            heading=payload.get("heading", ""),
            text=payload["text"],
            index=int(payload.get("index", 0)),
            metadata=dict(payload.get("metadata", {})),
        )


def make_chunk_id(doc_id: str, index: int) -> str:
    """Deterministic identifier so re-ingesting a corpus is reproducible."""
    digest = hashlib.sha1(f"{doc_id}:{index}".encode("utf-8")).hexdigest()
    return f"{doc_id}-{digest[:12]}"


def parse_markdown_sections(markdown: str) -> list[tuple[str, str]]:
    """Split markdown into ``(heading, body)`` pairs, keeping fenced code intact.

    The document title becomes the heading of the leading body, so no content is
    dropped.
    """
    sections: list[tuple[str, str]] = []
    heading = ""
    buffer: list[str] = []
    in_fence = False

    for line in markdown.splitlines():
        if _FENCE_RE.match(line):
            in_fence = not in_fence
            buffer.append(line)
            continue

        match = None if in_fence else _HEADING_RE.match(line)
        if match:
            body = "\n".join(buffer).strip()
            if body or heading:
                sections.append((heading, body))
            heading = match.group(2).strip()
            buffer = []
            continue

        buffer.append(line)

    body = "\n".join(buffer).strip()
    if body or not sections:
        sections.append((heading, body))
    return [(title, body) for title, body in sections if body]


def _overlap_words(chunk_overlap: int) -> int:
    if chunk_overlap <= 0:
        return 0
    return max(1, chunk_overlap // _AVERAGE_WORD_CHARS)


def _to_units(body: str) -> list[list[str]]:
    """Break a section body into indivisible units.

    Prose yields one unit per word so sentences can be split cleanly, while a
    markdown table row stays a single unit so a chunk never quotes half a row.
    """
    units: list[list[str]] = []
    for line in body.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("|"):
            units.append(stripped.split())
        else:
            units.extend([word] for word in stripped.split())
    return units


def _unit_chars(units: list[list[str]]) -> int:
    return len(" ".join(word for unit in units for word in unit))


def _unit_text(units: list[list[str]]) -> str:
    return " ".join(word for unit in units for word in unit)


def _last_sentence_boundary(units: list[list[str]]) -> int | None:
    """Index of the last unit that ends a sentence, if any."""
    for index in range(len(units) - 1, -1, -1):
        if _SENTENCE_END_RE.search(units[index][-1]):
            return index
    return None


def _cut(units: list[list[str]]) -> tuple[list[list[str]], list[list[str]]]:
    """Split an oversized buffer, preferring a sentence boundary."""
    boundary = _last_sentence_boundary(units)
    if boundary is None or boundary == len(units) - 1:
        boundary = len(units) - 2
    return units[: boundary + 1], units[boundary + 1 :]


def _split_section(
    body: str, chunk_size: int, overlap_words: int, min_chunk_chars: int
) -> list[str]:
    """Split one markdown section body into overlapping chunks.

    Chunks break at sentence boundaries when one fits inside the budget, so a
    retrieved chunk never starts mid-sentence, table rows are never split, and
    consecutive chunks share ``overlap_words`` trailing words.
    """
    units = _to_units(body)
    if not units:
        return []

    chunks: list[str] = []
    current: list[list[str]] = []

    def emit(buffer: list[list[str]]) -> list[list[str]]:
        chunks.append(_unit_text(buffer))
        return buffer[-overlap_words:] if overlap_words else []

    for unit in units:
        while current and _unit_chars([*current, unit]) > chunk_size:
            head, tail = _cut(current)
            overlap = [*emit(head), *tail]
            current = tail if len(overlap) >= len(current) else overlap
        current.append(unit)

    if current:
        tail = _unit_text(current)
        if chunks and len(tail) < min_chunk_chars:
            chunks[-1] = f"{chunks[-1]} {tail}"
        else:
            chunks.append(tail)

    return chunks


def chunk_markdown(
    markdown: str,
    *,
    source: str = "",
    doc_id: str | None = None,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    min_chunk_chars: int = DEFAULT_MIN_CHUNK_CHARS,
    metadata: Mapping[str, Any] | None = None,
) -> list[Chunk]:
    """Chunk markdown into overlapping, retrieval-sized :class:`Chunk` records.

    ``source`` is the display name (usually a file name) and ``doc_id`` the stable
    document identifier used for document-level access filtering. ``doc_id``
    defaults to ``source``.
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be smaller than chunk_size")

    document_id = doc_id or source or "document"
    extra_metadata: dict[str, Any] = dict(metadata or {})
    overlap = _overlap_words(chunk_overlap)
    texts: list[tuple[str, str]] = []

    for heading, body in parse_markdown_sections(markdown):
        for piece in _split_section(body, chunk_size, overlap, min_chunk_chars):
            texts.append((heading, piece))

    if not texts:
        return []

    chunks: list[Chunk] = []
    for index, (heading, text) in enumerate(texts):
        chunks.append(
            Chunk(
                chunk_id=make_chunk_id(document_id, index),
                doc_id=document_id,
                source=source,
                heading=heading,
                text=text,
                index=index,
                metadata=extra_metadata,
            )
        )
    return chunks
