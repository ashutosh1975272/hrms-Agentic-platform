# TASK-00: Seed policy documents

- Status: review
- Mode: docs-writer
- Branch: `feature/TASK-00-seed`
- Depends on: nothing (independent; runs in parallel with TASK-01)

## Objective
Author realistic company policy docs that the RAG pipeline (TASK-08) will ingest.

## Deliverables (`backend/seed_policies/`)
- `wfh-policy.md`, `leave-policy.md`, `attendance-policy.md`, `code-of-conduct.md`, `benefits.md`, `travel-policy.md`
- Each 30-80 lines, concrete rules (days, limits, approvers), no placeholder lorem ipsum.

## Acceptance criteria
- [x] 6 files exist with substantive content
- [x] WFH doc states who is eligible + approval flow (used by RAG test later)

## Agent report

Commit: `73c594f` — "TASK-00: add 6 seed policy documents for RAG ingestion" (branch
`feature/TASK-00-seed`). This report/status commit follows on the same branch.

### What was written

Six Markdown policy documents in `backend/seed_policies/`, each with a version/effective-date
header, numbered `##` sections, and concrete rules (numbers, limits, approvers, deadlines).
Cross-references between docs are written as relative Markdown links so the RAG chunker
(TASK-08) can resolve them.

| File | Lines | Coverage |
|---|---|---|
| `wfh-policy.md` | 80 | Eligibility (5 conditions), ineligible roles, 2 days/week and 3 consecutive day caps, 7-step HRMS approval flow, core hours 11:00-15:00, security, suspension rules |
| `leave-policy.md` | 76 | Entitlement table (CL 12, SL 12, EL 15 @1.25/month, ML 26 weeks, PL 2 weeks, etc.), accrual, 15-day carry forward, 4-tier approval flow, 48-hour cancellation rule, LWP/sabbatical |
| `attendance-policy.md` | 71 | 09:30-18:30 timings, 09:00-10:00 flexible band, 11:00-15:00 core hours, 10:00 cut-off, grace/LM/HD/full-day thresholds, absence and regularisation rules, comp-off |
| `code-of-conduct.md` | 80 | Expected behaviour, zero-tolerance harassment clause, 4 reporting channels, POSH, confidentiality, conflicts, gifts, disciplinary ladder |
| `benefits.md` | 79 | Statutory table (PF/ESI/gratuity/bonus), insurance cover amounts, ESOP bands, EAP and fitness, parental and learning budgets, workplace perks, enrolment |
| `travel-policy.md` | 80 | HRMS pre-approval flow, class of service by duration, city-tier hotel cap table, per diem, expense claim deadlines, visa/passport, cancellations |

### Gate output

Docs-only task; no backend/frontend code touched, so pytest and npm gates do not apply.
Verification was run against the brief's own acceptance criteria.

```
$ wc -l backend/seed_policies/*.md
  71 backend/seed_policies/attendance-policy.md
  79 backend/seed_policies/benefits.md
  80 backend/seed_policies/code-of-conduct.md
  76 backend/seed_policies/leave-policy.md
  80 backend/seed_policies/travel-policy.md
  80 backend/seed_policies/wfh-policy.md
 466 total

$ ls -1 backend/seed_policies/ | wc -l
6

$ grep -n "eligible to work from home" backend/seed_policies/wfh-policy.md
14:An employee is eligible to work from home only when **all** of the following are true:
$ grep -n "^## 5. Approval flow" backend/seed_policies/wfh-policy.md
39:## 5. Approval flow

$ grep -rniE "lorem|ipsum|placeholder|TBD|TODO|FIXME|XXX" backend/seed_policies/
none found

$ grep -rniE "api[_-]?key|secret|token|password|passwd|PRIVATE KEY|\.env" backend/seed_policies/
none found
```

All 6 files are within the required 30-80 line range. No secrets, tokens, or `.env` files
are present in the commit.

### Notes for the lead

- `tasks/STATUS.md` had **no TASK-00 row** when this session started, and this task file was
  still `Status: queued` (workflow step 3 expects `doing`). I added my own row and set it to
  `review`; no other row was touched.
- The seed docs reference HRMS modules that TASK-03 to TASK-06 will build, so wording was kept
  module-agnostic where a specific endpoint is not yet fixed.

