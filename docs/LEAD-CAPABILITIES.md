# Lead Agent — Capabilities & Call Contract

The Lead (Muse Code, --
 superb wiser) supervises all Kilo Code agents end-to-end.
Kilo agents implement tasks; the Lead verifies, reviews, merges, and unblocks.
Calling is ASYNC (file mailbox + scheduled sweeps). There is no real-time call.

## 1. What the Lead can do (full capability list)

1. VERIFY — run any gate independently: `pytest`, `npm run build`, `npm run lint`,
   e2e suites, single-scenario replays. Reports PASS/FAIL with output evidence.
2. REVIEW — diff review vs PROJECT.md/PLAN.md/task brief; permission-matrix check (§13);
   security scan (§20: secrets, auth bypass, injection, data isolation); UI check vs
   MASTER.md + ui-ux checklist; relevance check (no out-of-scope files).
3. MERGE & PUSH — merge approved branches to `main`, push `main` + feature branches,
   resolve conflicts (STATUS.md etc.), keep `main` green.
4. GITHUB PRs — open PRs, post numbered review comments, merge approved PRs (API).
   Token lives in encrypted secrets; NEVER in files.
5. TASK FLOW — own `tasks/STATUS.md`, write briefs, plan waves, split/parallelize,
   assign next tasks, resume dead sessions from branch state.
6. AGENT OPS — launch/steer/stop `kilo run` agents (`--auto`, Max variant), create
   worktrees + branches, read live logs, map AGENT-N names to tasks.
7. SCAFFOLD & DOCS — write PROJECT.md/PLAN.md/briefs/rules/agent definitions
   (`.kilo/agents/`), PR rules, design systems, API docs.
8. SCHEDULES — recurring auto-sweeps (tunnel health every 20 min; lead supervision
   sweep: inbox, branches, logs, verify, merge, resume).
9. SECRETS — store tokens encrypted (`GH_TOKEN` etc.); wire git/API auth without
   ever writing values to files. Agents must NEVER commit secrets.
10. BROWSER & UI — drive the managed browser: login, navigate, click/type, read page
    state for visual verification. Cannot operate the USER's personal browser tabs.
11. RESEARCH — web search + fetch docs, compare libraries, check CVEs/versions.
12. REPORT — per-agent status, merge record, next-wave plan, blockers + fixes.

## 2. What the Lead CANNOT do (limits)

- No synchronous/real-time call: requests are answered on the next sweep or user ping.
- No control inside the user's own browser tabs (user pastes prompts there).
- No merge without independent green gates. No pushing secrets. Ever.
- No 24/7 instant response: default sweep cadence is 30 min (faster on user "status").

## 3. How a Kilo agent calls the Lead (mailbox protocol)

### Send a request (exact commands)
```bash
BRANCH=$(git branch --show-current)
cat > .lead/inbox/REQUEST-<TASK-NN>-<topic>.md <<'EOF'
From: <agent-name> (<mode>)
Task/Branch: TASK-NN / <branch>
Type: verify | merge-request | blocked | question | pr-review
Commit: <hash or NONE>
Summary: <5 lines max: what was done / what is needed>
Gate output: <paste gate commands + results>
Files changed: <git status --short>
EOF
git add .lead/inbox/ && git commit -qm "TASK-NN: request <topic>" && git push origin $BRANCH
```

### After sending
STOP your run with a short summary ("request filed, awaiting lead").
Do NOT poll. The Lead answers async via a resume-run or outbox file.

### Read the reply
```bash
ls .lead/outbox/   # REPLY-<topic>.md with verdict + actions taken
```

## 4. Request types & what to include

- `verify` — "gates pass on my side, independently confirm": include gate output + commit.
- `merge-request` — task complete per brief: include report + STATUS.md set to `review`.
- `blocked` — include error output + what was tried + files involved.
- `question` — include options considered + recommendation.
- `pr-review` — PR URL + what changed; Lead posts numbered verdict on the PR.

## 5. Lead sweep (automatic, every 30 min)

1. Read all `.lead/inbox/*` across task branches.
2. Check agent sessions alive/dead; resume dead ones from branch state.
3. Re-run gates on `review` tasks; APPROVE+merge or post numbered REQUEST-CHANGES.
4. Push `main` + branches; update STATUS.md; launch next wave.
5. Write `.lead/outbox/REPLY-*` for every request; report actions to chat.

## 6. Copy-paste prompt for Kilo agents (project bootstrap)

```
You are a Kilo Code agent on this repo. Our Lead (supervisor) works async via
docs/LEAD-CAPABILITIES.md — read it first. Implement ONLY your assigned task
brief. When done/blocked/needing review: file a request with the exact commands
in section 3, commit + push your branch, then STOP with a summary. Never merge
to main. Never commit secrets. Never poll the outbox inside this run.
```

## 7. Emergency (need the Lead NOW)

The user types `status` in the project chat — the Lead runs a full sweep immediately
(verify, merge, resume, next wave) instead of waiting for the next schedule.

## 8. A2A v2 — instant push lane (ACTIVE)

Every `git push` to ANY branch fires a GitHub webhook that wakes the Lead within
~1 minute. No waiting for the 30-min sweep.

- Kilo -> Lead instant path: `git push origin <branch>` (+ inbox request file).
  Lead auto-runs: fetch branch, review diff vs brief, re-run gates, secrets scan,
  merge-if-green or numbered REQUEST-CHANGES + fix-agent resume.
- Lead -> Kilo instant path: `kilo run --auto --dir <worktree> --agent <name> ...`
  launches/resumes workers immediately; `.lead/outbox/` replies + PR comments carry
  verdicts.
- Fallbacks (if webhook misses): 30-min supervisor sweep + user `status` ping.
- Webhook: repo Settings -> Webhooks -> agents.excellencetechnologies.in hook (push).
  Do NOT delete it. Secret is server-side; never print it.
