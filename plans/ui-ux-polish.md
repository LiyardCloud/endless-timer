# Plan: UI UX Polish

**Status:** ✅ done
**Created:** 2026-05-19

---

## 🔄 Phase 1: Hierarchy And Interaction Audit

- [x] Review the current Tailwind/shadcn rewrite against the original layout shape
- [x] Identify the highest-signal UI issues to improve without changing product behavior
- [x] Define a conservative polish scope for timer hierarchy, actions clarity, and timeline readability

### Verify
- [x] The planned changes tighten the current UI instead of reimagining it
- [x] The polish scope is limited to presentation and interaction clarity

---

## ✅ Phase 2: Primary Screen Visual Polish

- [x] Rebalance the timer card so elapsed time and active action hierarchy are clearer
- [x] Refine the title input styling so it reads as a live editable field
- [x] Improve selected and mode states in the actions section
- [x] Increase consistency of spacing and section rhythm across the page

### Verify
- [x] The main screen feels clearer and more intentional on desktop and mobile
- [x] Selected action and edit modes are visually obvious without added clutter

---

## ✅ Phase 3: Timeline And Final Regression Pass

- [x] Improve timeline row grouping and timestamp readability
- [x] Keep the overall layout close to the original app structure while using the new primitives
- [x] Run build and lint verification after the polish pass
- [x] Remove redundant current-action duplication and tighten spacing
- [x] Refine long action-name behavior and selected/edit mode emphasis
- [x] Refine timer alignment, block spacing, active gradient, and connected timeline rail
- [x] Rework background, timeline connector alignment, and action switcher layout

### Verify
- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] The UI remains minimalist while feeling more polished and usable

---
