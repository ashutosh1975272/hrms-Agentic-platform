# TASK-13: E2E harness + CI + docs skeleton

- Status: doing
- Mode: qa-tester (harness) + docs-writer (docs) — one agent, both hats.
- Branch: `feature/TASK-13-e2e-docs`
- Depends on: nothing (independent).

## Required reading (before coding)
1. `PROJECT.md` sections 17 (4 acceptance scenarios), 19, 20.
2. `../agent-resources/superpowers/skills/test-driven-development/SKILL.md`.
3. `../agent-resources/agency-agents/testing/` (pick relevant).

## Deliverables
- `tests/e2e/test_scenarios.py`: 4 scenario test stubs (§17.1–17.4) with mock adapters + fixtures, marked `@pytest.mark.e2e`, all passing against mocks; README in folder explaining how to point at real backend later.
- `.github/workflows/ci.yml`: backend job (pip install + pytest) + frontend job (npm ci + build + lint).
- `docs/SETUP.md` (verified commands only — run each), `docs/API.md` (endpoint table from backend routes), root `README.md` (project intro + links).

## Acceptance criteria
- [ ] `python -m pytest tests/e2e -m e2e` passes; CI yaml valid (`yamllint` or python yaml parse)
- [ ] Every documented command verified by running it
- [ ] No secrets committed

## Agent report
(Agent fills: gate output, commit hash.)
