"""In-memory stand-ins for the backend, RAG service and permission layer.

Everything here is a stub: deterministic, offline, and honest about the fact
that the real implementations land in TASK-02, TASK-07 and TASK-08. The
behaviour encoded below is copied from PROJECT.md sections 12, 13, 15, 16 and
17, not invented, so the scenarios fail when a stub drifts away from the spec.
"""

from __future__ import annotations

import re
from dataclasses import replace
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from .base import (
    ROLE_ADMIN,
    ROLE_EMPLOYEE,
    ROLE_HR,
    ROUTE_ACTION,
    ROUTE_DB,
    ROUTE_NONE,
    ROUTE_RAG,
    STATUS_DENIED,
    STATUS_NEEDS_CLARIFICATION,
    STATUS_NEEDS_CONFIRMATION,
    STATUS_OK,
    AgentReply,
    AuditEntry,
    Chunk,
)

# --------------------------------------------------------------------------
# PROJECT.md section 13 - permission matrix, one row per operation.
# "Authorized" (HR update/delete employee) is encoded as allowed; the narrower
# per-record scope is a service-layer concern this stub does not model.
# --------------------------------------------------------------------------
PERMISSION_MATRIX: dict[str, frozenset[str]] = {
    "view_own_profile": frozenset({ROLE_ADMIN, ROLE_HR, ROLE_EMPLOYEE}),
    "view_all_employees": frozenset({ROLE_ADMIN, ROLE_HR}),
    "create_employee": frozenset({ROLE_ADMIN, ROLE_HR}),
    "update_employee": frozenset({ROLE_ADMIN, ROLE_HR}),
    "delete_employee": frozenset({ROLE_ADMIN, ROLE_HR}),
    "apply_leave": frozenset({ROLE_ADMIN, ROLE_HR, ROLE_EMPLOYEE}),
    "approve_leave": frozenset({ROLE_ADMIN, ROLE_HR}),
    "view_policies": frozenset({ROLE_ADMIN, ROLE_HR, ROLE_EMPLOYEE}),
    "manage_roles_permissions": frozenset({ROLE_ADMIN}),
}

INTENT_ACTIONS = {
    "POLICY_QUESTION": "view_policies",
    "LEAVE_BALANCE_QUERY": "apply_leave",
    "CREATE_EMPLOYEE": "create_employee",
    "DELETE_EMPLOYEE": "delete_employee",
}

REQUIRED_EMPLOYEE_FIELDS = ("email", "date_of_joining")

_STOPWORDS = frozenset(
    "a an and are as at be by for from how i in is it many my of on or that the "
    "to what when where which who why with do does did".split()
)

# Query/doc expansion so "work-from-home policy" reaches the "WFH days" wording.
_SYNONYMS = {
    "wfh": ("work", "from", "home"),
    "leave": ("leave", "leaves"),
    "leaves": ("leave", "leaves"),
    "left": ("leave", "leaves"),
    "holiday": ("holiday", "holidays"),
    "attendance": ("attendance",),
    "benefit": ("benefit", "benefits"),
    "delete": ("delete", "remove", "terminate"),
    "remove": ("delete", "remove"),
    "add": ("add", "create"),
    "create": ("add", "create"),
}

_STOP_MARKDOWN = re.compile(r"[`*_>#|\[\]()]+")
_TOKEN = re.compile(r"[a-z0-9]+")
_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
_DATE = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")


def _tokens(text: str) -> set[str]:
    words = _TOKEN.findall(_STOP_MARKDOWN.sub(" ", text.lower()))
    expanded: set[str] = set()
    for word in words:
        if word in _STOPWORDS:
            continue
        expanded.add(word)
        expanded.update(_SYNONYMS.get(word, ()))
    return expanded


class MockClock:
    """Monotonic, seeded clock so audit timestamps never vary between runs."""

    def __init__(self, start: str, step_seconds: int = 1) -> None:
        self._now = datetime.fromisoformat(start.replace("Z", "+00:00"))
        self._step = timedelta(seconds=step_seconds)

    def now(self) -> str:
        stamp = self._now.isoformat().replace("+00:00", "Z")
        self._now += self._step
        return stamp


class AuditLog:
    def __init__(self, clock: MockClock) -> None:
        self._clock = clock
        self._entries: list[AuditEntry] = []

    def record(
        self,
        *,
        user: str,
        role: str,
        action: str,
        status: str,
        tool: str | None = None,
        entity: str | None = None,
        before: dict[str, Any] | None = None,
        after: dict[str, Any] | None = None,
        detail: dict[str, Any] | None = None,
    ) -> AuditEntry:
        entry = AuditEntry(
            user=user,
            role=role,
            action=action,
            status=status,
            occurred_at=self._clock.now(),
            tool=tool,
            entity=entity,
            before=before,
            after=after,
            detail=detail or {},
        )
        self._entries.append(entry)
        return entry

    def entries_for(self, user_id: str) -> list[AuditEntry]:
        return [entry for entry in self._entries if entry.user == user_id]

    def last_for(self, user_id: str) -> AuditEntry | None:
        entries = self.entries_for(user_id)
        return entries[-1] if entries else None

    def actions_for(self, user_id: str) -> list[str]:
        return [entry.action for entry in self.entries_for(user_id)]


class MockPermissions:
    def __init__(self, matrix: dict[str, frozenset[str]]) -> None:
        self._matrix = matrix
        self._roles: dict[str, str] = {}

    @classmethod
    def from_project_matrix(cls) -> "MockPermissions":
        return cls(dict(PERMISSION_MATRIX))

    def register(self, user_id: str, role: str) -> None:
        self._roles[user_id] = role

    def role_of(self, user_id: str) -> str:
        return self._roles.get(user_id, ROLE_EMPLOYEE)

    def check(self, user_id: str, action: str) -> bool:
        allowed = self._matrix.get(action)
        if allowed is None:
            return False
        return self.role_of(user_id) in allowed


class MockRetriever:
    """Section-weighted bag-of-words retrieval over the shipped policy docs.

    The document title is weighted heavily: a query naming a policy
    ("work-from-home policy") should stay inside that document instead of
    drifting into a neighbouring one. Section headings are weighted lightly.
    """

    TITLE_WEIGHT = 2.0
    HEADING_WEIGHT = 0.5

    def __init__(
        self, index: list[tuple[Chunk, frozenset[str], frozenset[str]]]
    ) -> None:
        self._index = index

    @classmethod
    def from_directory(cls, directory: str) -> "MockRetriever":
        index: list[tuple[Chunk, frozenset[str], frozenset[str]]] = []
        for path in sorted(Path(directory).glob("*.md")):
            index.extend(cls._index_document(path))
        return cls(index)

    @classmethod
    def _index_document(
        cls, path: Path
    ) -> list[tuple[Chunk, frozenset[str], frozenset[str]]]:
        title = ""
        sections: list[tuple[str, list[str]]] = []
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.startswith("# "):
                title = line[2:].strip()
            elif line.startswith("## "):
                sections.append((line[3:].strip(), []))
            elif sections:
                sections[-1][1].append(line)
        if not sections and title:
            sections = [(title, path.read_text(encoding="utf-8").splitlines())]

        title_tokens = frozenset(_tokens(title))
        index = []
        for heading, lines in sections:
            body = "\n".join(lines).strip()
            if not body:
                continue
            chunk = Chunk(
                source=path.name, section=f"{path.name} :: {heading}", text=body
            )
            index.append((chunk, title_tokens, frozenset(_tokens(heading))))
        return index

    def search(self, query: str, top_k: int = 3) -> list[Chunk]:
        wanted = _tokens(query)
        if not wanted:
            return []
        scored: list[Chunk] = []
        for chunk, title_tokens, heading_tokens in self._index:
            score = len(wanted & _tokens(chunk.text))
            score += self.TITLE_WEIGHT * len(wanted & title_tokens)
            score += self.HEADING_WEIGHT * len(wanted & heading_tokens)
            if score > 0:
                scored.append(replace(chunk, score=round(score, 3)))
        scored.sort(key=lambda c: (-c.score, c.source, c.section))
        return scored[:top_k]


class InMemoryHrms:
    def __init__(self) -> None:
        self._employees: dict[str, dict[str, Any]] = {}
        self._balances: dict[str, dict[str, int]] = {}
        self._next_id = 1001

    def create_employee(self, **fields: Any) -> dict[str, Any]:
        employee_id = fields.pop("employee_id", None) or f"emp-{self._next_id}"
        self._next_id += 1
        record = {"id": employee_id, **fields}
        self._employees[employee_id] = record
        return record

    def delete_employee(self, employee_id: str) -> bool:
        return self._employees.pop(employee_id, None) is not None

    def find_employee(
        self,
        *,
        email: str | None = None,
        employee_id: str | None = None,
        name_contains: str | None = None,
    ) -> dict[str, Any] | None:
        for record in self._employees.values():
            if email is not None and record.get("email") != email:
                continue
            if employee_id is not None and record.get("id") != employee_id:
                continue
            if name_contains is not None:
                if name_contains.lower() not in record.get("full_name", "").lower():
                    continue
            return record
        return None

    def set_leave_balances(self, employee_id: str, balances: dict[str, int]) -> None:
        self._balances[employee_id] = dict(balances)

    def leave_balances(self, employee_id: str) -> dict[str, int]:
        return dict(self._balances.get(employee_id, {}))


class MockAgent:
    """Deterministic stand-in for the master agent (PROJECT.md section 12).

    The router is keyword based on purpose: the scenarios must be reproducible
    offline, and TASK-07 owns the real intent router.
    """

    def __init__(
        self,
        *,
        hrms: InMemoryHrms,
        audit: AuditLog,
        retriever: MockRetriever,
        permissions: MockPermissions,
        clock: MockClock,
    ) -> None:
        self.hrms = hrms
        self.audit = audit
        self.retriever = retriever
        self.permissions = permissions
        self.clock = clock
        self._context: dict[str, dict[str, Any]] = {}

    def as_user(self, user_id: str) -> "MockAgentSession":
        return MockAgentSession(self, user_id)

    def _handle(self, user_id: str, message: str) -> AgentReply:
        """Permission-first dispatch, mirroring PROJECT.md section 12."""
        context = self._context.setdefault(user_id, {})
        pending = context.get("pending")
        if pending:
            return _resume_create(self, user_id, pending, message)

        intent = _route(message)
        if intent == "UNKNOWN":
            return AgentReply(
                status=STATUS_OK,
                intent=intent,
                route=ROUTE_NONE,
                text=(
                    "I can answer policy questions, report your own leave balance, "
                    "and perform authorized HR actions. Please rephrase."
                ),
            )

        action = INTENT_ACTIONS[intent]
        if not self.permissions.check(user_id, action):
            return _deny(self, user_id, intent, action, message)

        if intent == "POLICY_QUESTION":
            return _answer_policy(self, user_id, message)
        if intent == "LEAVE_BALANCE_QUERY":
            return _answer_leave_balance(self, user_id)
        if intent == "CREATE_EMPLOYEE":
            return _start_create(self, user_id, message)
        return _delete_employee(self, user_id, message)


class MockAgentSession:
    def __init__(self, agent: MockAgent, user_id: str) -> None:
        self._agent = agent
        self.user_id = user_id

    @property
    def role(self) -> str:
        return self._agent.permissions.role_of(self.user_id)

    def ask(self, message: str) -> AgentReply:
        return self._agent._handle(self.user_id, message)


def _route(text: str) -> str:
    lowered = text.lower()
    if "delete" in lowered or "remove" in lowered:
        return "DELETE_EMPLOYEE"
    if "policy" in lowered or "work from home" in lowered or "wfh" in lowered:
        return "POLICY_QUESTION"
    if "leave" in lowered and any(
        word in lowered for word in ("left", "remaining", "balance", "how many")
    ):
        return "LEAVE_BALANCE_QUERY"
    if "add " in lowered or "create " in lowered:
        return "CREATE_EMPLOYEE"
    return "UNKNOWN"


def _deny(
    agent: MockAgent, user_id: str, intent: str, action: str, message: str
) -> AgentReply:
    """PROJECT.md 17.4 / section 20: deny before any tool is reached."""
    role = agent.permissions.role_of(user_id)
    target = _resolve_employee(agent, message) if intent == "DELETE_EMPLOYEE" else None
    agent.audit.record(
        user=user_id,
        role=role,
        action="permission_denied",
        status=STATUS_DENIED,
        entity=target["id"] if target else None,
        detail={
            "requested_intent": intent,
            "requested_action": action,
            "tool_invoked": False,
        },
    )
    return AgentReply(
        status=STATUS_DENIED,
        intent=intent,
        route=ROUTE_NONE,
        text=(
            f"I cannot do that: {action} is a permission you do not have as a "
            f"{role}. No tool was called and nothing was changed."
        ),
        follow_ups=[
            "Ask an HR user to run this, or request an administrator to grant access."
        ],
    )


def _answer_policy(agent: MockAgent, user_id: str, query: str) -> AgentReply:
    retrieved = agent.retriever.search(query, top_k=3)
    if not retrieved:
        return AgentReply(
            status=STATUS_OK,
            intent="POLICY_QUESTION",
            route=ROUTE_RAG,
            text="I could not find a company policy document covering that question.",
        )
    quotes: list[str] = []
    for chunk in retrieved[:2]:
        quotes.extend(chunk.sentences()[:2])
    agent.audit.record(
        user=user_id,
        role=agent.permissions.role_of(user_id),
        action="policy.search",
        status=STATUS_OK,
        tool="policy.search",
        entity=retrieved[0].source,
        detail={"query": query, "sources": [c.source for c in retrieved]},
    )
    lead = " ".join(quotes[:3])
    return AgentReply(
        status=STATUS_OK,
        intent="POLICY_QUESTION",
        route=ROUTE_RAG,
        text=(
            f"Based on {retrieved[0].section}:\n\n{lead}\n\n"
            f"Sources: {', '.join(c.section for c in retrieved)}"
        ),
        tool_calls=["policy.search"],
        sources=[chunk.source for chunk in retrieved],
        data={"query": query, "sections": [c.section for c in retrieved]},
    )


def _answer_leave_balance(agent: MockAgent, user_id: str) -> AgentReply:
    balances = agent.hrms.leave_balances(user_id)
    agent.audit.record(
        user=user_id,
        role=agent.permissions.role_of(user_id),
        action="leave.get_balance",
        status=STATUS_OK,
        tool="leave.get_balance",
        entity=user_id,
        detail={"leave_types": sorted(balances)},
    )
    summary = ", ".join(f"{days} {name}" for name, days in sorted(balances.items()))
    return AgentReply(
        status=STATUS_OK,
        intent="LEAVE_BALANCE_QUERY",
        route=ROUTE_DB,
        text=f"Your remaining leave balance is: {summary} days.",
        tool_calls=["leave.get_balance"],
        data={"employee_id": user_id, "balances": balances},
    )


def _start_create(agent: MockAgent, user_id: str, message: str) -> AgentReply:
    draft = _parse_create_intent(message)
    missing = [f for f in REQUIRED_EMPLOYEE_FIELDS if not draft.get(f)]
    if missing:
        agent._context[user_id] = {"pending": "CREATE_EMPLOYEE", "draft": draft}
        questions = [
            "What is the employee's email address?"
            if f == "email"
            else "What is the employee's date of joining (YYYY-MM-DD)?"
            for f in missing
        ]
        return AgentReply(
            status=STATUS_NEEDS_CLARIFICATION,
            intent="CREATE_EMPLOYEE",
            route=ROUTE_ACTION,
            text=(
                "I can create that employee, but I still need "
                f"{', '.join(missing)} before I save the record."
            ),
            follow_ups=questions,
        )
    return _persist_create(agent, user_id, draft)


def _resume_create(
    agent: MockAgent, user_id: str, pending: str, message: str
) -> AgentReply:
    draft = dict(agent._context[user_id]["draft"])
    email = _EMAIL.search(message)
    if email:
        draft["email"] = email.group(0)
    joined = _DATE.search(message)
    if joined:
        draft["date_of_joining"] = joined.group(0)
    if pending != "CREATE_EMPLOYEE":
        return _start_create(agent, user_id, message)
    missing = [f for f in REQUIRED_EMPLOYEE_FIELDS if not draft.get(f)]
    if missing:
        return _start_create(agent, user_id, message)
    agent._context.pop(user_id, None)
    return _persist_create(agent, user_id, draft)


def _persist_create(
    agent: MockAgent, user_id: str, draft: dict[str, Any]
) -> AgentReply:
    role = agent.permissions.role_of(user_id)
    created = agent.hrms.create_employee(**draft)
    agent.audit.record(
        user=user_id,
        role=role,
        action="employee.create",
        status=STATUS_OK,
        tool="employee.create",
        entity=created["id"],
        before=None,
        after=created,
    )
    return AgentReply(
        status=STATUS_OK,
        intent="CREATE_EMPLOYEE",
        route=ROUTE_ACTION,
        text=(
            f"Created employee {created['full_name']} ({created['email']}) in "
            f"{created['department']}, joining on {created['date_of_joining']}."
        ),
        tool_calls=["employee.create"],
        data={"employee": created},
    )


def _delete_employee(agent: MockAgent, user_id: str, message: str) -> AgentReply:
    target = _resolve_employee(agent, message)
    if target is None:
        return AgentReply(
            status=STATUS_NEEDS_CLARIFICATION,
            intent="DELETE_EMPLOYEE",
            route=ROUTE_ACTION,
            text="I could not tell which employee record you mean.",
            follow_ups=["Which employee should I delete? Give me their full name."],
        )
    return AgentReply(
        status=STATUS_NEEDS_CONFIRMATION,
        intent="DELETE_EMPLOYEE",
        route=ROUTE_ACTION,
        text=(
            f"About to delete {target['full_name']} ({target['email']}). "
            "Confirm to proceed."
        ),
        tool_calls=[],
        follow_ups=["Confirm the deletion of this employee record."],
        data={"target": target},
    )


def _resolve_employee(agent: MockAgent, message: str) -> dict[str, Any] | None:
    email = _EMAIL.search(message)
    if email:
        return agent.hrms.find_employee(email=email.group(0))
    cleaned = re.sub(
        r"\b(delete|remove|employee|record|the)\b", " ", message, flags=re.IGNORECASE
    )
    for word in _TOKEN.findall(cleaned):
        if len(word) > 2:
            found = agent.hrms.find_employee(name_contains=word.capitalize())
            if found is not None:
                return found
    return None


def _parse_create_intent(message: str) -> dict[str, Any]:
    """Pull name and department out of "Add Rahul Kumar in Engineering."."""
    draft: dict[str, Any] = {}
    remainder = re.sub(
        r"^\s*(please\s+)?(add|create)\s+(a\s+)?(new\s+)?(employee\s+)?",
        "",
        message,
        flags=re.IGNORECASE,
    )
    parts = re.split(r"\s+(?:in|to|at|for)\s+", remainder, maxsplit=1)
    name = " ".join(parts[0].split()).strip(" .,")
    if name:
        draft["full_name"] = name
    if len(parts) > 1:
        department = parts[1].strip(" .,")
        if department:
            draft["department"] = department
    email = _EMAIL.search(message)
    if email:
        draft["email"] = email.group(0)
    joined = _DATE.search(message)
    if joined:
        draft["date_of_joining"] = joined.group(0)
    return draft
