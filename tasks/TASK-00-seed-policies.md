# TASK-00: Seed policy documents

- Status: queued
- Mode: docs-writer
- Branch: `feature/TASK-00-seed`
- Depends on: nothing (independent; runs in parallel with TASK-01)

## Objective
Author realistic company policy docs that the RAG pipeline (TASK-08) will ingest.

## Deliverables (`backend/seed_policies/`)
- `wfh-policy.md`, `leave-policy.md`, `attendance-policy.md`, `code-of-conduct.md`, `benefits.md`, `travel-policy.md`
- Each 30-80 lines, concrete rules (days, limits, approvers), no placeholder lorem ipsum.

## Acceptance criteria
- [ ] 6 files exist with substantive content
- [ ] WFH doc states who is eligible + approval flow (used by RAG test later)

## Agent report
(Agent fills: what was written, commit hash.)
