# How We Work — Master Note (single control point)

Everything the team needs lives in THIS repo (`agent-hrms/`). The Lead
supervises from one place; Kilo agents read these files and follow them.

## 1. File locations (tell Kilo these)

| What | Path |
|---|---|
| Requirements (source of truth) | `PROJECT.md` |
| Build plan + stack + gates + coverage map | `PLAN.md` |
| Task queue board | `tasks/STATUS.md` |
| Task briefs (one per feature) | `tasks/TASK-NN-*.md` |
| Agent team (IDE modes) | `.kilocodemodes` |
| Agent rules (workflow + UI/UX) | `.kilocode/rules/workflow.md`, `.kilocode/rules/ui-ux.md` |
| Agent roster (CLI definitions) | `.kilo/agents/*.md` (6 agents) |
| Design system | `design-system/agentic-hrms/MASTER.md` |
| PR rules | `docs/PR-RULES.md` |
| Lead capabilities + call contract | `docs/LEAD-CAPABILITIES.md` |
| This master note | `HOW-WE-WORK.md` |
| Requests to Lead | `.lead/inbox/` |
| Lead replies | `.lead/outbox/` |
| Backend code | `backend/` |
| Frontend code | `frontend/` |
| Seed policies (RAG) | `backend/seed_policies/` |
| External skill repos (4) | `../agent-resources/` (Front-End-Checklist, superpowers, ruflo, agency-agents) |
| Secrets (never in files) | encrypted store: `GH_TOKEN` (+ future keys) |
| GitHub repo | `ashutosh1975272/hrms-Agentic-platform` |

## 2. Who does what

- KILO AGENTS: read brief + skills, implement ONE task on its branch, run gates,
  file `.lead/inbox` request, commit + push, STOP. Never merge to `main`.
- LEAD: verifies every task independently, reviews all diffs/PRs, merges to `main`,
  launches/resumes agents, owns STATUS.md, fixes conflicts, reports to chat.

## 3. How we talk (A2A)

- Kilo -> Lead INSTANT: `git push` fires the GitHub webhook; Lead wakes in ~1 min.
- Kilo -> Lead ASYNC: `.lead/inbox/REQUEST-*.md` files (verify/merge/blocked/question).
- Lead -> Kilo INSTANT: `kilo run --auto ...` launches/resumes workers immediately.
- Lead -> Kilo ASYNC: `.lead/outbox/` replies + numbered PR comments.
- Fallbacks: 30-min supervisor sweep + user `status` ping (immediate sweep).
- Emergency: user types `status` in chat.

## 4. Always-on access (tunnel)

- Public entry: the current `*.trycloudflare.com` URL (posted in chat; changes ONLY
  if the tunnel restarts). Password is project-private (in chat history).
- Root folder link: `<tunnel>/?folder=<workspace>/agent-hrms`.
- Keeper: `tunnel-health-watch` schedule checks every 20 min and restarts
  server/tunnel automatically, posting the fresh URL if it changed.
- Honest limit: the host can kill processes (rare); worst case the link is dark
  for <20 min until the watcher revives it. `main` + branches on GitHub are never
  affected — no code is ever lost to a tunnel outage.

## 5. Quality gates (nothing merges without ALL)

1. Agent's own gates green (pytest / build+lint / e2e as briefed).
2. Lead re-runs gates independently — green.
3. Diff matches ONLY the assigned brief (relevance).
4. Secrets scan clean. Permission matrix + security rules hold.
5. UI tasks: MASTER.md visual check + ui-ux checklist.
6. STATUS.md row -> `done` only after merge to `main`.

## 6. One prompt to rule every Kilo tab

```
Read agent-hrms/HOW-WE-WORK.md and docs/LEAD-CAPABILITIES.md first, then your
assigned tasks/TASK-NN brief. Implement ONLY that task on THIS branch. When
done/blocked: file .lead/inbox request, commit + push, STOP with a summary.
Never merge to main. Never commit secrets.
```
