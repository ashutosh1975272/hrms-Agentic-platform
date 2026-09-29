"""Fixtures for the section 17 end-to-end scenarios.

Every fixture is function-scoped: each scenario owns its data, so the suite is
order-independent and safe to shard (see README.md in this folder).
"""

import pytest

from adapters import (
    AuditLog,
    Datasets,
    InMemoryHrms,
    MockAgent,
    MockClock,
    MockPermissions,
    MockRetriever,
)

SEED_POLICIES = "backend/seed_policies"


@pytest.fixture
def clock():
    """Deterministic clock so audit timestamps never make the suite flaky."""
    return MockClock(start="2026-01-01T00:00:00Z", step_seconds=1)


@pytest.fixture
def policies():
    """RAG adapter over the real Markdown policies in ``backend/seed_policies``.

    Reading the shipped documents (rather than inline fixtures) keeps the
    scenarios honest: a policy edit that stops answering the question fails
    these tests.
    """
    return MockRetriever.from_directory(SEED_POLICIES)


@pytest.fixture
def hrms():
    return InMemoryHrms()


@pytest.fixture
def audit(clock):
    return AuditLog(clock)


@pytest.fixture
def permissions():
    """PROJECT.md section 13 permission matrix, as data."""
    return MockPermissions.from_project_matrix()


@pytest.fixture
def agent(hrms, audit, policies, permissions, clock):
    return MockAgent(
        hrms=hrms,
        audit=audit,
        retriever=policies,
        permissions=permissions,
        clock=clock,
    )


@pytest.fixture
def datasets(agent, hrms, audit, permissions):
    """One seeded world, rebuilt per test: admin, HR, employee and a victim.

    The victim exists so 17.4 has a real record that must survive the denied
    delete, instead of a request for something that was never there.
    """
    for employee_id, name, email, department, joined, role in (
        (Datasets.VICTIM, "Rahul Kumar", "rahul.kumar@existing.example.com",
         "Engineering", "2024-01-08", "employee"),
        (Datasets.EMPLOYEE, "Priya Sharma", "priya.sharma@example.com",
         "Engineering", "2023-06-12", "employee"),
        (Datasets.HR, "Meera Iyer", "meera.iyer@example.com",
         "Human Resources", "2021-02-01", "hr"),
        (Datasets.ADMIN, "Arjun Rao", "arjun.rao@example.com",
         "Administration", "2020-01-15", "admin"),
    ):
        hrms.create_employee(
            employee_id=employee_id,
            full_name=name,
            email=email,
            department=department,
            date_of_joining=joined,
            role=role,
        )
        permissions.register(employee_id, role)
    hrms.set_leave_balances(Datasets.EMPLOYEE, {"casual": 7, "sick": 4, "earned": 11})
    hrms.set_leave_balances(Datasets.VICTIM, {"casual": 10, "sick": 9, "earned": 12})
    return Datasets(agent=agent, hrms=hrms, audit=audit, policies=agent.retriever)
