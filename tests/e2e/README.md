# End-to-end scenarios (PROJECT.md section 17)

Harness stubs for the four acceptance scenarios in `PROJECT.md` section 17.
They run against in-memory mock adapters, so the suite is deterministic, offline
and needs nothing but `pytest`. No backend, no database, no LLM key, no network.

```bash
python -m pytest tests/e2e -m e2e          # the four scenarios
python -m pytest tests/e2e -m e2e -v       # with names
python -m pytest tests/e2e                 # everything in this folder
```

## What is covered

| Test | Scenario | Contract it pins down |
|---|---|---|
| `test_17_1_policy_question_is_answered_from_rag_grounded_in_policies` | 17.1 Employee policy question | Routed to RAG, answered from a retrieved chunk, quotes a verifiable sentence, stays inside the work-from-home document |
| `test_17_2_leave_query_is_answered_from_the_database` | 17.2 Employee leave query | Structured data comes from the database (`leave.get_balance`), never from RAG (PROJECT.md section 10), scoped to the authenticated user |
| `test_17_3_hr_creates_employee_with_follow_up_and_audit_log` | 17.3 HR creates an employee | Permission check first, follow-up questions for missing fields, no create call before clarification, audit entry with before/after |
| `test_17_4_employee_delete_request_is_denied_without_calling_the_tool` | 17.4 Unauthorized request | Denied at the permission layer, the delete tool is never reached, the record survives, the denial is audited (PROJECT.md section 20) |
| `test_agent_fixture_can_be_replaced_by_a_real_backend_adapter` | harness | The mock is swappable, so the scenarios are not pinned to it forever |

The assertions are written against `PROJECT.md` sections 12, 13, 14, 15, 16, 17
and 20 - not against the mock's internals. The stubs are wrong on purpose where
the spec and a convenient stub disagree, so a passing run means the spec is met.

## Layout

```
tests/e2e/
  test_scenarios.py     the four scenarios
  conftest.py          function-scoped fixtures (new world per test)
  adapters/
    base.py            contracts: AgentAdapter, AgentSession, AgentReply,
                       AuditEntry, Chunk, RetrieverAdapter, PermissionAdapter
    mock.py            offline implementations
    world.py           the seeded world a scenario runs against
  README.md            this file
```

Fixtures are function-scoped and every scenario seeds its own data, so the suite
is order-independent and safe to shard or run in parallel.

Determinism: `MockClock` stamps audit entries with a seeded clock, the intent
router is keyword-based, and retrieval reads the real Markdown policies in
`backend/seed_policies/` - so editing a policy document that stops answering the
question fails 17.1 instead of silently passing.

## Pointing the scenarios at the real backend

The mocks implement the protocols in `adapters/base.py`. To run the same four
scenarios against the real service once TASK-07/08 land:

1. Add `tests/e2e/adapters/http.py` with a class satisfying
   `adapters.base.AgentAdapter`:

   ```python
   class HttpAgentAdapter:
       def __init__(self, base_url: str) -> None:
           self._base_url = base_url

       def as_user(self, user_id: str) -> AgentSession:
           return HttpAgentSession(self, user_id)
   ```

   `AgentSession.ask(message)` posts the message to the chat endpoint with the
   user's bearer token and maps the JSON response onto `AgentReply`
   (`status`, `intent`, `route`, `text`, `tool_calls`, `sources`, `follow_ups`,
   `data`). Assert on what the API actually returns - the fields listed above
   are the contract the scenarios rely on.

2. Override the `agent` fixture in `conftest.py`, keyed off an environment
   variable so one command runs both ways:

   ```python
   @pytest.fixture
   def agent(hrms, audit, policies, permissions, clock):
       base_url = os.environ.get("HRMS_API_URL")
       if base_url:
           return HttpAgentAdapter(base_url)
       return MockAgent(hrms=hrms, audit=audit, retriever=policies,
                        permissions=permissions, clock=clock)
   ```

3. Run it:

   ```bash
   HRMS_API_URL=http://127.0.0.1:8000 python -m pytest tests/e2e -m e2e
   ```

Three things to expect when you make the swap:

- **The audit assertions move.** `datasets.audit` is a stub. Against a real
  backend, assert the audit trail through its own read API, or drop those
  assertions until the audit endpoints exist (TASK-06).
- **The `datasets.hrms` assertions need real records.** Seed the identities in
  `adapters/base.py` (`EMPLOYEE`, `HR`, `ADMIN`, `VICTIM`) in the real database
  first, or the lookup helpers in `adapters/world.py` will raise `LookupError`.
- **The retriever is local on purpose.** `MockRetriever.from_directory()` reads
  `backend/seed_policies/`. The real RAG service (TASK-08) must return the same
  `Chunk.source` names for the source assertions to hold.

Browser-level journeys (chat UI, dashboards) are a different pyramid level and
are not in this folder - see `docs/API.md` for the endpoint surface they would
drive.
