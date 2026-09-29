"""The seeded world a scenario runs against.

``Datasets`` is what the ``datasets`` fixture hands to each test: the agent, the
HRMS store, the audit log and the retriever, plus the seeded identities as class
constants. Scenarios talk to the world, never to the adapters' internals.
"""

from __future__ import annotations

from typing import Any

from .base import ADMIN, DEFAULT_ADAPTER_NAME, EMPLOYEE, HR, VICTIM, AuditEntry
from .mock import AuditLog, InMemoryHrms, MockAgent, MockRetriever


class Datasets:
    """One isolated, seeded world per test."""

    EMPLOYEE = EMPLOYEE
    HR = HR
    ADMIN = ADMIN
    VICTIM = VICTIM
    AGENT_ADAPTER = DEFAULT_ADAPTER_NAME

    def __init__(
        self,
        *,
        agent: MockAgent,
        hrms: InMemoryHrms,
        audit: AuditLog,
        policies: MockRetriever,
    ) -> None:
        self.agent = agent
        self.hrms = hrms
        self.audit = audit
        self.policies = policies

    def find_employee(self, **lookup: str) -> dict[str, Any] | None:
        return self.hrms.find_employee(**lookup)

    def employee_id(self, user_id: str) -> str:
        record = self.hrms.find_employee(employee_id=user_id)
        if record is None:
            raise LookupError(f"no seeded employee for {user_id!r}")
        return record["id"]

    def leave_balances(self, user_id: str) -> dict[str, int]:
        return self.hrms.leave_balances(user_id)

    def audit_entries(self, user_id: str) -> list[AuditEntry]:
        return self.audit.entries_for(user_id)
