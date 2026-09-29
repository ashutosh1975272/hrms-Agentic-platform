# Agent Workflow Protocol (MUST follow)

## Session start
1. Read `PROJECT.md` (requirements) and `PLAN.md` (plan + gates).
2. Read ONLY your assigned `tasks/TASK-NN-*.md`. Do not start other tasks.
3. Check `tasks/STATUS.md` — your task must say `doing` with your mode name.

## Branching
- Create/switch to the branch named in your task file: `git checkout -b <branch>`.
- NEVER commit to `main`. NEVER push to `main`. NEVER force-push.

## Implementation
- Follow the task brief's acceptance criteria exactly. No extra features.
- Read the required skills listed in the task brief BEFORE coding.
- Backend: pytest green. Frontend: `npm run build` + `npm run lint` green.

## Forbidden
- No secrets, tokens, API keys, passwords, or `.env` files in commits. Ever.
- No `git push` to any remote except your feature branch, and only if the lead asked.
- No editing files outside your task scope. No reformatting unrelated code.

## Session end
1. Run the gate commands; paste results into your task file under `## Agent report`.
2. Update task file: `Status: review` + commit hash.
3. Commit on your branch: `git add <your files>` then `git commit -m "TASK-NN: <summary>"`.
4. Update `tasks/STATUS.md`: move your task to `review`.
5. STOP. Report to the lead: what was done, gate output, commit hash. The lead reviews and merges.
