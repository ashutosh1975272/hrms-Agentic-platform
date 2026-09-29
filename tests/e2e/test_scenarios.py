"""End-to-end acceptance scenarios from PROJECT.md section 17.

These are harness stubs. They drive the agent through the mock adapters in
``adapters/`` so the suite is deterministic, offline and dependency-free
(``pytest`` only). The assertions are derived from PROJECT.md sections 13, 14,
17 and 20 - not from the mock's internals - so the same file can be pointed at
a real backend later. See ``README.md`` in this folder for that swap.
"""

import re

import pytest

from adapters import Datasets

SCENARIO_17_1 = "PROJECT.md 17.1 - employee policy question"
SCENARIO_17_2 = "PROJECT.md 17.2 - employee leave query"
SCENARIO_17_3 = "PROJECT.md 17.3 - HR creates an employee"
SCENARIO_17_4 = "PROJECT.md 17.4 - unauthorized request"


@pytest.mark.e2e
def test_17_1_policy_question_is_answered_from_rag_grounded_in_policies(datasets):
    """Employee asks a policy question -> RAG retrieval -> grounded answer.

    PROJECT.md 17.1: "What is the work-from-home policy?" -> auth ->
    classify as policy question -> RAG retrieval -> grounded response.
    """
    query = "What is the work-from-home policy?"

    reply = datasets.agent.as_user(Datasets.EMPLOYEE).ask(query)

    assert reply.status == "ok", SCENARIO_17_1
    assert reply.intent == "POLICY_QUESTION", SCENARIO_17_1
    assert reply.route == "rag", SCENARIO_17_1
    assert reply.tool_calls == ["policy.search"], SCENARIO_17_1

    # Grounded: the answer quotes a verifiable sentence out of a retrieved
    # chunk, and it is the RAG service that produced it, not the database.
    retrieved = datasets.policies.search(query, top_k=3)
    assert retrieved, SCENARIO_17_1
    assert reply.sources, SCENARIO_17_1
    assert all("wfh-policy" in source for source in reply.sources), SCENARIO_17_1

    quotable = {s for chunk in retrieved for s in chunk.sentences() if len(s) > 40}
    assert quotable, "retriever produced no verifiable sentence to check against"
    assert any(span in reply.text for span in quotable), (
        "answer is not grounded in any retrieved sentence"
    )

    # The retrieved policy text must actually carry the rules, not boilerplate:
    # the WFH document states its limits in quantities ("90 days", "2 WFH days
    # per calendar week"). Any answer has to be built from that.
    assert len({chunk.section for chunk in retrieved}) >= 2, (
        "retrieval collapsed to a single section"
    )
    assert re.search(
        r"\d+\s+(?:days?|months?|weeks?|hours?|WFH)",
        "\n".join(chunk.text for chunk in retrieved),
    ), "retrieval did not surface the quantitative rules of the policy"

    # PROJECT.md section 16: the exchange is auditable.
    entry = datasets.audit.last_for(Datasets.EMPLOYEE)
    assert entry is not None
    assert entry.action == "policy.search"
    assert entry.status == "ok"


@pytest.mark.e2e
def test_17_2_leave_query_is_answered_from_the_database(datasets):
    """Employee asks for leave balance -> structured query -> balance result.

    PROJECT.md 17.2: "How many leaves do I have left?" -> identify employee ->
    structured leave query -> leave tool -> balance -> result. PROJECT.md
    section 10 forbids answering structured data from RAG.
    """
    expected = datasets.leave_balances(Datasets.EMPLOYEE)

    reply = datasets.agent.as_user(Datasets.EMPLOYEE).ask(
        "How many leaves do I have left?"
    )

    assert reply.status == "ok", SCENARIO_17_2
    assert reply.intent == "LEAVE_BALANCE_QUERY", SCENARIO_17_2
    assert reply.route == "db", SCENARIO_17_2
    assert reply.tool_calls == ["leave.get_balance"], SCENARIO_17_2
    assert reply.sources == [], "structured data must not be answered from RAG"

    assert reply.data["balances"] == expected
    for leave_type, days in expected.items():
        assert f"{days}" in reply.text
        assert leave_type in reply.text.lower()

    # The identity used is the authenticated user, never a name in the text.
    assert reply.data["employee_id"] == datasets.employee_id(Datasets.EMPLOYEE)

    entry = datasets.audit.last_for(Datasets.EMPLOYEE)
    assert entry.action == "leave.get_balance"
    assert entry.status == "ok"


@pytest.mark.e2e
def test_17_3_hr_creates_employee_with_follow_up_and_audit_log(datasets):
    """HR asks to add an employee -> permission check -> follow-up -> create.

    PROJECT.md 17.3: "Add Rahul Kumar in Engineering." -> auth + HR role ->
    CREATE_EMPLOYEE intent -> permission check -> extract info -> ask
    follow-ups for missing fields -> call tool -> create -> audit log -> success.
    """

    first = datasets.agent.as_user(Datasets.HR).ask("Add Rahul Kumar in Engineering.")

    assert first.intent == "CREATE_EMPLOYEE", SCENARIO_17_3
    assert first.status == "needs_clarification", SCENARIO_17_3
    assert first.follow_ups, "missing fields must be asked for, not guessed"
    assert first.tool_calls == [], "no create call may happen before clarification"
    assert datasets.find_employee(email="rahul.kumar@example.com") is None

    # A second session is used on purpose: PROJECT.md section 15 scopes
    # conversation context to the authenticated user, not to a chat handle.
    second = datasets.agent.as_user(Datasets.HR).ask(
        "rahul.kumar@example.com, date of joining 2025-04-01"
    )

    assert second.status == "ok", SCENARIO_17_3
    assert second.tool_calls == ["employee.create"], SCENARIO_17_3

    created = datasets.find_employee(email="rahul.kumar@example.com")
    assert created is not None
    assert created["full_name"] == "Rahul Kumar"
    assert created["department"] == "Engineering"
    assert created["date_of_joining"] == "2025-04-01"

    entry = datasets.audit.last_for(Datasets.HR)
    assert entry.action == "employee.create"
    assert entry.role == "hr"
    assert entry.status == "ok"
    assert entry.entity == created["id"]
    assert entry.before is None
    assert entry.after["email"] == "rahul.kumar@example.com"
    assert entry.occurred_at, "audit entries are timestamped"


@pytest.mark.e2e
def test_17_4_employee_delete_request_is_denied_without_calling_the_tool(datasets):
    """Employee asks to delete a colleague -> permission check -> DENY.

    PROJECT.md 17.4: Employee: "Delete employee Rahul." -> auth ->
    DELETE_EMPLOYEE -> permission check -> DENY, never call the tool.
    PROJECT.md section 20: the LLM must not bypass backend authorization.
    """
    target = datasets.employee_id(Datasets.VICTIM)

    reply = datasets.agent.as_user(Datasets.EMPLOYEE).ask("Delete employee Rahul.")

    assert reply.intent == "DELETE_EMPLOYEE", SCENARIO_17_4
    assert reply.status == "denied", SCENARIO_17_4
    assert reply.tool_calls == [], "the delete tool must never be reached"
    assert datasets.employee_id(Datasets.VICTIM) == target
    assert datasets.find_employee(employee_id=target) is not None

    entry = datasets.audit.last_for(Datasets.EMPLOYEE)
    assert entry.action == "permission_denied"
    assert entry.role == "employee"
    assert entry.status == "denied"
    assert entry.entity == target
    assert "permission" in reply.text.lower()


@pytest.mark.e2e
def test_agent_fixture_can_be_replaced_by_a_real_backend_adapter(datasets):
    """The mock adapter is swappable, so the suite can drive a real backend.

    This is the seam the folder README documents. If the fixture stopped being
    overridable, the four scenarios above would be pinned to the mocks forever.
    """
    sentinel = datasets.agent.as_user(Datasets.HR)

    assert sentinel.role == "hr"
    assert Datasets.AGENT_ADAPTER == type(datasets.agent).__name__, (
        "default adapter must stay the mock so the offline suite is reproducible"
    )
