"""Contracts the end-to-end scenarios are written against.

The four PROJECT.md section 17 scenarios only ever talk to these types. Keeping
them free of any mock behaviour is what lets the same tests be re-pointed at a
real backend later: implement :class:`AgentAdapter` over HTTP and the scenarios
do not change. See ``README.md`` in this folder.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable

ROLE_ADMIN = "admin"
ROLE_HR = "hr"
ROLE_EMPLOYEE = "employee"

EMPLOYEE = "emp-priya"
HR = "emp-meera"
ADMIN = "emp-arjun"
VICTIM = "emp-rahul"

DEFAULT_ADAPTER_NAME = "MockAgent"

#: PROJECT.md section 12 - which branch of the workflow served the answer.
ROUTE_RAG = "rag"
ROUTE_DB = "db"
ROUTE_ACTION = "action"
ROUTE_NONE = "none"

#: PROJECT.md section 7 - what the agent is allowed to return.
STATUS_OK = "ok"
STATUS_DENIED = "denied"
STATUS_NEEDS_CLARIFICATION = "needs_clarification"
STATUS_NEEDS_CONFIRMATION = "needs_confirmation"

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")


@dataclass(frozen=True)
class AgentReply:
    """One assistant turn, as the chat UI and the scenarios consume it."""

    status: str
    intent: str
    route: str
    text: str
    tool_calls: list[str] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)
    follow_ups: list[str] = field(default_factory=list)
    data: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class AuditEntry:
    """PROJECT.md section 16 - what an action must leave behind."""

    user: str
    role: str
    action: str
    status: str
    occurred_at: str
    tool: str | None = None
    entity: str | None = None
    before: dict[str, Any] | None = None
    after: dict[str, Any] | None = None
    detail: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class Chunk:
    """A retrieved passage, quoted verbatim so answers stay checkable."""

    source: str
    section: str
    text: str
    score: float = 0.0

    def sentences(self, minimum: int = 20) -> list[str]:
        """Verbatim sentences, safe to use as grounding assertions."""
        parts: list[str] = []
        for block in self.text.splitlines():
            for sentence in _SENTENCE_SPLIT.split(block.strip()):
                cleaned = " ".join(sentence.split()).lstrip("-*0123456789. ").strip()
                if len(cleaned) >= minimum:
                    parts.append(cleaned)
        return parts


@runtime_checkable
class RetrieverAdapter(Protocol):
    """RAG service (PROJECT.md section 9.2)."""

    def search(self, query: str, top_k: int = 3) -> list[Chunk]: ...


@runtime_checkable
class HrmsAdapter(Protocol):
    """The HRMS database (PROJECT.md section 10)."""

    def find_employee(self, **lookup: str) -> dict[str, Any] | None: ...
    def create_employee(self, **fields: Any) -> dict[str, Any]: ...
    def leave_balances(self, employee_id: str) -> dict[str, int]: ...


@runtime_checkable
class PermissionAdapter(Protocol):
    """Permission layer every tool call must pass (PROJECT.md section 13)."""

    def check(self, user_id: str, action: str) -> bool: ...
    def role_of(self, user_id: str) -> str: ...


@runtime_checkable
class AuditAdapter(Protocol):
    """Audit service (PROJECT.md section 16)."""

    def last_for(self, user_id: str) -> AuditEntry | None: ...


@runtime_checkable
class AgentSession(Protocol):
    """A conversation bound to one authenticated user."""

    user_id: str
    role: str

    def ask(self, message: str) -> AgentReply: ...


@runtime_checkable
class AgentAdapter(Protocol):
    """Master AI agent (PROJECT.md sections 7 and 12)."""

    def as_user(self, user_id: str) -> AgentSession: ...
