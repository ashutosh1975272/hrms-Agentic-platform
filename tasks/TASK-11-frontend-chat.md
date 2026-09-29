# TASK-11: Frontend AI chat UI (premium UI)

- Status: review
- Mode: frontend-dev
- Branch: `feature/TASK-11-frontend-chat`
- Depends on: TASK-07 (agent API). If not merged, build against a mock agent adapter with the planned contract and sample conversations from PROJECT.md §17.

## Required reading (before coding)
1. `PROJECT.md` sections 6-8, 12, 14-15 (agent behavior, CRUD, confirmation, context).
2. `.kilocode/rules/ui-ux.md` — MANDATORY visual standard + `design-system/agentic-hrms/MASTER.md`.
3. `../agent-resources/Front-End-Checklist/skills/frontend-checklist-global/SKILL.md`.

## Deliverables (`frontend/src/`)
- Chat panel (dockable sidebar + full-page view): message list with user/agent bubbles,
  markdown rendering, tool-call progress indicators ("Checking permissions…", "Searching policies…"),
  confirmation cards for sensitive actions (Approve/Deny buttons), follow-up question prompts,
  conversation history list, new-chat, typing/streaming states, error + retry states.
- Matches MASTER.md style; responsive (drawer on mobile).

## Acceptance criteria
- [x] All 4 PROJECT.md §17 scenarios playable in UI (mock or real API)
- [x] Confirmation cards + permission-denied states visibly handled
- [x] FULL ui-ux.md pre-delivery checklist confirmed in report
- [x] `npm run build` + `npm run lint` pass

## Agent report

**Branch:** `feature/TASK-11-frontend-chat` · **Mode:** frontend-dev · **Approach:** mock-first
(TASK-07 not merged, so the UI runs against a local mock agent adapter that speaks the planned
contract; a streaming HTTP adapter is included and takes over with `USE_MOCK=false`).

### What was built (`frontend/src/`)

**Agent adapter layer** (`src/agent/`) — the UI never calls a tool directly; it sends a turn and
renders the events streamed back (PROJECT.md §12 workflow, §13 permission layer, §14 confirmation,
§15 conversation context).

- `types.ts` — the agent contract: `AgentToolCall`, `AgentCitation`, `AgentConfirmation`,
  `AgentMessage`, `AgentConversation`, `AgentPending` (multi-step create-employee / leave-approval
  state) and the `AgentEvent` stream union.
- `mockAgent.ts` — replays all four §17 acceptance scenarios plus directory, attendance, holidays,
  department, profile, apply-leave, pending-leaves, leave-approval, help and a forced-failure path;
  emits streamed deltas, tool steps, citations, confirmations and suggestions.
- `httpAgent.ts` — NDJSON streaming adapter for the TASK-07 contract
  (`POST /agent/conversations/{id}/messages` and `.../confirmations/{confirmationId}`), bearer auth,
  `ApiError` mapping. Selected automatically when `USE_MOCK=false`.
- `client.ts` — `createAgentClient` + shared `resolveUseMock` flag.

**Chat state** (`src/chat/`) — `chatState.ts` (reducer: hydrate, new/select/delete conversation, user
turn, event folding, confirm settle, turn failure), `ChatProvider.tsx` (turn lifecycle, abort/stop,
retry, confirmation resolution), `chatStorage.ts` (per-user `sessionStorage`, §15 — never shared
across users, interrupted streams settled to a retryable failure on reload), `chatContext.ts` /
`useChat.ts`.

**UI** (`src/components/chat/`) — `ChatPanel` (shared by both surfaces), `MessageList` +
`MessageBubble` (user/agent bubbles, timestamps, `role="log"` live region, jump-to-latest),
`Markdown.tsx` (dependency-free renderer built from React elements — headings, lists, tables, code,
quotes, inline code/bold/italic and http(s) links; **no `dangerouslySetInnerHTML`**, so agent output
can never inject markup), `ToolCallProgress.tsx` ("Checking permissions…", "Searching policies…"
with per-step status), `ConfirmationCard.tsx` (§14 summary + "What will change" + Approve/Deny +
settled state), `ConversationList.tsx`, `ChatEmptyState.tsx` (role-aware prompt chips + SVG
illustration), `ChatComposer.tsx`, `ChatLauncher.tsx` / `ChatDock.tsx` / `ChatDockHost.tsx`,
`ChatErrorBoundary.tsx`.

**Surfaces** — dockable assistant (`ChatDock`): right sidebar `complementary` at ≥1024px, modal
drawer `dialog` + `aria-modal` + backdrop + focus trap + Escape + focus return below it; full page
view at `/chat` (`ChatPage`), where the launcher steps aside and an "expand" control swaps dock →
page. The panel is mounted for all three roles via `AppShell`.

### Gate output (all green, run from `frontend/`)

```
$ npm run build
> tsc -b && vite build
vite v7.3.6 building client environment for production...
✓ 84 modules transformed.
dist/index.html                   0.51 kB │ gzip:   0.32 kB
dist/assets/index-BnL1LY_-.css   30.40 kB │ gzip:   6.47 kB
dist/assets/index-CAFqzLH4.js   349.14 kB │ gzip: 109.12 kB
✓ built in 1.99s
BUILD EXIT: 0

$ npm run lint
> eslint .
(no output — 0 errors, 0 warnings)
LINT EXIT: 0

$ npm test
 Test Files  9 passed (9)
      Tests  75 passed (75)
TEST EXIT: 0
```

Chat suite detail (15 tests, all passing):

```
✓ §17.1 answers a policy question with retrieval steps and sources
✓ §17.2 answers a leave balance question with a live table
✓ §17.3 collects missing fields, then asks HR to confirm before creating
✓ §17.4 blocks an unauthorized delete and never offers a confirm action
✓ lets HR deny a sensitive action without running the tool
✓ surfaces a failure with a retry that re-runs the request
✓ starts a new conversation and keeps the previous one in history
✓ sends a suggestion chip and blocks over-long messages
✓ opens as a modal drawer below 1024px and closes on Escape, returning focus
✓ renders as a docked sidebar complement from 1024px up
✓ steps the launcher aside for the full page chat view
✓ expands the dock into the full page route
✓ flags the launcher when a confirmation is waiting for a decision
✓ ChatErrorBoundary renders its children / contains a render failure and offers a retry
```

Smoke check on the production build: `vite preview` on port 4173 returned `HTTP 200`, title
`Agentic HRMS`, JS and CSS assets `HTTP 200`.

### Acceptance criteria

- [x] **All 4 §17 scenarios playable.** §17.1 policy question → permission check + policy search +
      grounded answer with a Sources region. §17.2 leave query → identity resolve + balance read
      rendered as a real `<table>` with column headers. §17.3 HR create → follow-up question for the
      two missing fields → confirmation card → approve → "Employee created" + audit note. §17.4
      employee delete → "Permission denied", the Approve button is never rendered, and the tool
      step shows as denied. Each is covered by a UI test above.
- [x] **Confirmation + permission-denied visibly handled.** `ConfirmationCard` is a labelled
      region listing the affected records, the risk badge and Approve/Deny, then collapses to
      "Approved and executed" / "Denied — no changes were made"; denials never run the tool.
      Denied tool calls render a `shield-x` banner ("Request blocked by the permission layer") and
      the launcher shows a confirmation-needed indicator. A banner in the composer states that
      nothing runs until a decision is made.
- [x] **Full ui-ux.md pre-delivery checklist.** See below.
- [x] **`npm run build` + `npm run lint` pass** (plus 75 Vitest tests green).

### ui-ux.md pre-delivery checklist

- [x] **MASTER.md tokens used everywhere (no raw hex, no mixed styles).** Every colour, radius,
      shadow and font in the chat code is a theme token (`bg-primary`, `text-muted-foreground`,
      `border-border`, `shadow-md`, `font-heading`, …). Verified by grep: **zero** raw hex values
      across `src/chat`, `src/components/chat`, `src/components/ui`, `src/agent` and
      `src/pages/ChatPage.tsx`. Glassmorphism surfaces reuse the shared `.glass-panel` / `.glass-card`
      classes added to `index.css` (backdrop blur + hairline border), not per-page one-offs.
- [x] **Shared components reused; no duplicated styles.** `Button`, `Badge` and `Icon` were extended
      for this task and every chat surface uses them — no local button/badge re-implementations.
      `Icon` is a single inlined Lucide-geometry set (`aria-hidden`, `focusable="false"`), so all
      icons are one consistent family.
- [x] **Responsive at 375/768/1024/1440, no horizontal scroll.** Mobile-first: the assistant is a
      full-width drawer with an overlay history list below `md`; the history becomes an inline
      `md:w-60` column from 768px; the dock switches from dialog to a 24rem sidebar complement at
      1024px. Wide agent tables and code blocks are wrapped in `overflow-x-auto`, bubbles are
      `min-w-0 max-w-[85%]`, and the message log is a scroll container, so no content forces
      page-level horizontal scroll. 1440px is covered by the max-w-6xl shell.
- [x] **Contrast 4.5:1, focus rings, keyboard nav, reduced-motion.** Text pairs were computed
      against their effective backgrounds: `muted-foreground` on `background` ≈ 7.2:1,
      `primary` on `primary/10` ≈ 4.6:1, `destructive` on white ≈ 4.8:1, `on-accent` on `accent`
      ≈ 5.9:1, `muted-foreground` on `muted` ≈ 6.6:1 — all ≥4.5:1, and meaning is never carried by
      colour alone (each status pairs an icon and a text label). Focus: a global
      `:focus-visible { outline: 2px solid currentColor; outline-offset: 2px }` rule, never removed;
      the composer input also adopts the MASTER.md input focus treatment (`focus:border-primary`).
      Keyboard: the whole flow is reachable by Tab, Enter sends / Shift+Enter newlines, the drawer
      traps focus and closes on Escape returning focus to the launcher, the message log is
      focusable for keyboard scrolling, and no positive `tabindex` is used. Reduced motion: spinners
      use `motion-safe:animate-spin`, the list stagger is disabled and smooth scrolling is downgraded
      to instant under `prefers-reduced-motion: reduce`.
- [x] **Loading + empty + error states on every data view.** Loading = live tool-call step list plus
  a "Working on it / Still writing" indicator and an `sr-only` `role="status"` announcement.
  Empty = SVG illustrated empty state with role-aware prompt chips, plus a history-empty message.
  Error = inline `role="alert"` with the message and a Retry button that re-runs the turn, a
  forced-failure mock path, and a `ChatErrorBoundary` around both surfaces so a render failure
  shows a recoverable retry instead of a blank panel.
- [x] **`npm run build` + `npm run lint` pass** — see gate output above.

Also verified: no emojis used as icons (emoji scan over `src/` is clean), every clickable element has
`cursor-pointer` and a 150–300ms transition, all interactive targets are ≥44px
(`min-h-11`/`h-11`/`h-12`), icon-only buttons carry `aria-label`s, the form has a real `<label>` plus
`aria-describedby`/`aria-invalid` and an inline error, markdown tables use `<th scope="col">` with a
caption, and conversation state is scoped per user in `sessionStorage`.

### Notes for the lead

- Swapping to the real backend needs no UI change: set `USE_MOCK=false` (or `VITE_USE_MOCK=false`,
  same resolver as the REST client) and the app uses `httpAgent.ts` against
  `POST /api/agent/conversations/{id}/messages` (NDJSON `AgentEvent` stream) and
  `POST /api/agent/conversations/{id}/confirmations/{confirmationId}` with `{ decision }`. If
  TASK-07 lands a different envelope, only `httpAgent.ts` and `types.ts` need to change — the UI
  consumes `AgentEvent` only. Conversation context is passed per turn (`history` + `pending`), so
  the server may keep §15 memory authoritative without a UI rewrite.
- The mock agent's identities (`usr-emp-1`, `usr-hr-1`, `usr-admin-1`) mirror the TASK-09 demo
  fixtures; §17.3/§17.4 are role-gated in the mock exactly as the §13 matrix requires, so the UI
  guard is demonstrable before TASK-07 exists.
- Worth a design decision at lead level: the MASTER.md `border` token (`#E2E8F0`) is below the 3:1
  non-text threshold on white. I did not override it, because ui-ux.md mandates MASTER.md tokens;
  focus rings and hover borders keep boundaries independently visible. If you want the token
  darkened, it is a one-line change in `index.css`.
- Rendered-page (visual) verification at the four breakpoints is left to the lead per PLAN §7; the
  gate evidence above is build + lint + 75 tests.

