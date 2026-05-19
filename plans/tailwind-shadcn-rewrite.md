# Plan: Tailwind And shadcn Rewrite

**Status:** ✅ done
**Created:** 2026-05-19

---

## ✅ Phase 1: Tailwind And shadcn Foundation

- [x] Audit current styling entry points and identify files to replace (`globals.css`, app component styling, reusable control patterns)
- [x] Normalize dependencies for Tailwind, PostCSS, and shadcn-style utility packages
- [x] Add Tailwind configuration, PostCSS configuration, and base theme tokens
- [x] Add shared utility helpers such as `cn()` and establish the component structure for `src/components/ui`
- [x] Decide which existing custom CSS behavior should remain as theme tokens versus be rewritten as Tailwind utility composition

### Verify
- [x] Tailwind classes compile correctly in the Next.js app
- [x] Base theme variables are available globally without breaking the current app shell
- [x] The repo has a stable foundation for shadcn-style UI primitives

---

## ✅ Phase 2: Reusable UI Primitive Migration

- [x] Create shadcn-style primitives needed by the app (`Button`, `Input`, `Badge`, `Card`, `Separator`, and dialog/confirm surface as needed)
- [x] Replace direct ad hoc control styling with the new primitives in isolated parts of the UI
- [x] Align variant naming and sizing so the app can express primary, ghost, destructive, and selected states consistently
- [x] Ensure Lucide icons integrate cleanly with the new primitives

### Verify
- [x] Shared UI primitives render consistently across desktop and mobile layouts
- [x] Actions like create, change, remove, and auth buttons use the primitive system instead of one-off styling
- [x] No primitive depends on obsolete custom CSS class contracts from the old implementation

---

## ✅ Phase 3: EndlessTimer Screen Rewrite

- [x] Rewrite the main app layout in `src/components/endless-timer-app.tsx` using Tailwind utility composition
- [x] Rebuild the timer block using the new styling system while preserving current interaction behavior
- [x] Rebuild the actions flow with shadcn-style controls and dialog-based destructive confirmation if appropriate
- [x] Rebuild the timeline block and compact row variants using Tailwind classes
- [x] Remove superseded legacy CSS rules once all major sections are migrated

### Verify
- [x] The full page renders without relying on the previous large custom CSS layout system
- [x] Timer, actions, and timeline preserve their current product behavior after the rewrite
- [x] Desktop and mobile layouts remain usable after the migration

---

## ✅ Phase 4: Cleanup, Regression Check, And Handoff

- [x] Remove dead CSS and any no-longer-needed styling code paths
- [x] Reconcile any partial dependency or config drift introduced before the rewrite is complete
- [x] Run build and lint verification after migration
- [x] Document any new styling conventions or component usage expectations in repo docs if needed

### Verify
- [x] `npm run build` passes
- [x] Lint passes or remaining warnings are explicitly understood and documented
- [x] The rewrite leaves the repo simpler to extend than the previous styling approach

---
