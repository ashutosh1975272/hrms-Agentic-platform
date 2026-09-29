# UI/UX Standard (MANDATORY for all frontend tasks)

## Design system (single source of truth)
1. Read `design-system/agentic-hrms/MASTER.md` FIRST. Follow its colors, typography
   (Poppins headings / Open Sans body), spacing, glassmorphism style, and effects exactly.
   Use CSS variables / Tailwind theme tokens — never raw hex in components.
2. Check `design-system/agentic-hrms/pages/<page>.md` for page overrides.

## Component rules
- Build a shared component library first (`src/components/ui/`): Button, Input, Select,
  Card, Badge, Modal, Table, Pagination, Toast, Avatar, StatCard, Sidebar, Topbar.
  Every page reuses these — no one-off styles per page.
- Icons: Lucide/Heroicons SVG only. NEVER emoji as icons.
- Every clickable element: `cursor-pointer` + visible hover state (150-300ms transition).
- Forms: visible labels, inline validation, errors next to the field, helper text.
- Loading/empty/error states for EVERY data view (skeleton loaders, empty illustrations via SVG, retry buttons).
- Touch targets min 44x44px; 8px+ spacing.

## Layout & responsive (must verify all)
- Mobile-first; no horizontal scroll; verified at 375px, 768px, 1024px, 1440px.
- Dashboards: stat cards row + charts + tables; dense but breathable (8-32px scale).
- Charts need legends + tooltips + accessible colors (never color-alone meaning).

## Accessibility (hard gate)
- Text contrast 4.5:1 minimum; visible keyboard focus rings; full keyboard navigation;
  aria-labels on icon buttons; `prefers-reduced-motion` respected.
- Apply Front-End Checklist skills: `frontend-checklist-global` + relevant category
  skills (forms, tables, color-contrast, keyboard-navigation, focus-management).

## Motion
- Subtle and meaningful only: page transitions, list stagger on load, modal scale/fade.
  Duration 150-450ms, ease-out. No animation of width/height. Skip under reduced-motion.

## Pre-delivery checklist (agent must confirm each in report)
- [ ] MASTER.md tokens used everywhere (no raw hex, no mixed styles)
- [ ] Shared components reused; no duplicated styles
- [ ] Responsive at 375/768/1024/1440, no horizontal scroll
- [ ] Contrast 4.5:1, focus rings, keyboard nav, reduced-motion
- [ ] Loading + empty + error states on every data view
- [ ] `npm run build` + `npm run lint` pass
