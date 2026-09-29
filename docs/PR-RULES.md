# PR Rules (Agent Manager contract)

## Branching
- One branch per task: `feature/TASK-NN-short-name` (see `tasks/STATUS.md`).
- Agents work ONLY on their assigned branch. `main` is merge-only by the lead.
- One worktree per branch for parallel agents (`kilo worktree create <name>` or `git worktree`).

## Before a PR exists (agent duties)
- Acceptance criteria in the task brief: ALL met, nothing extra.
- Gates green, run by the agent: backend `python -m pytest`; frontend `npm run build` + `npm run lint`; docs tasks: verified commands.
- Task file `## Agent report` filled (gate output + commit hash); `tasks/STATUS.md` row set to `review`.
- No secrets, tokens, `.env`, credentials, or `*.db` files in the diff. Ever.
- Link worktree to PR once opened: `kilo pr link <url>` (or record URL in task file).

## PR format
- Title: `TASK-NN: <feature>` (e.g. `TASK-02: Auth + RBAC`).
- Body: task brief link, what changed (bullets), gate results (paste output), test evidence, known limitations.
- Small and single-purpose: one task per PR. No drive-by refactors.

## Lead review (supervisor duties — every PR)
1. Relevance: does the diff match ONLY the assigned brief? Out-of-scope files = request removal.
2. Gates re-run independently by the lead. Any failure = PR blocked.
3. Spec check: PROJECT.md sections cited in the brief (esp. §13 matrix, §20 security, §17 scenarios).
4. Secrets scan: grep for keys/tokens/passwords in the diff.
5. UI tasks: visual check against `design-system/agentic-hrms/MASTER.md` + ui-ux checklist.
- Verdicts: APPROVE+merge | REQUEST-CHANGES (numbered issues posted on the PR; agent resumes same branch) | REJECT (wrong task — close branch, re-brief).

## Merge
- Only the lead merges, only after APPROVE. `main` must stay green.
- After merge: STATUS.md row -> `done`, worktree removed, next wave assigned.

## When agents find a problem in another agent's PR
- File it as a numbered PR comment with file/line + evidence. Never push fixes to someone else's branch.
