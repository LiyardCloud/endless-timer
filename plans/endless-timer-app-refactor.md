# Plan: Endless Timer App Refactor

**Status:** 🔄 in-progress
**Created:** 2026-05-23

---

## ✅ Phase 1: Inventory And Stable Boundaries

- [x] Capture the current responsibilities inside `src/components/endless-timer-app.tsx`: auth, Firestore subscriptions, action CRUD, history editing, shell navigation, home, timeline, analytics, profile, dialogs, and date formatting helpers
- [x] Define the target module layout before moving code, keeping `EndlessTimerApp` as the public route entry point
- [x] Identify behavioral invariants to preserve: Google-only auth, one active endless timer, title saved in current state, title snapshotted into history, action selection always appends a history event, and same-action clicks still append
- [x] Decide the first extraction order so each commit/build can stay small and reversible

Target module layout:
- `src/components/endless-timer-app.tsx`: thin route resolver and app composition entry
- `src/components/endless-timer/types.ts`: UI/domain types used across the feature
- `src/components/endless-timer/constants.ts`: page metadata, empty drafts, nav items, and current-state defaults
- `src/components/endless-timer/helpers.ts`: feature-local pure date/time and history-neighbor helpers
- `src/components/endless-timer/use-endless-timer-state.ts`: composed state facade while smaller hooks are extracted
- `src/components/endless-timer/shell.tsx`: signed-out state, responsive shell, navigation, and banners
- `src/components/endless-timer/dialogs.tsx`: action/history delete confirmation dialogs
- `src/components/endless-timer/views/*.tsx`: home, timeline, analytics, and profile views
- `src/lib/firestore-mappers.ts`: Firestore document-to-domain mappers

### Verify
- [x] Proposed file layout is documented in this plan before implementation starts
- [x] No Firestore write behavior or product rule changes are included in the refactor scope

---

## ✅ Phase 2: Extract Types, Constants, And Pure Helpers

- [x] Move local UI/domain types such as `AppPage`, `ActionMode`, `ActionDraft`, `HistoryEditDraft`, and `AnalyticsRange` into colocated app component type modules
- [x] Move `navItems`, page descriptions, empty drafts, and current-state defaults into focused constants modules
- [x] Move pure local helpers such as `formatSegmentDuration`, `formatDateTimeLocalValue`, `parseDateTimeLocalValue`, `formatDateInputLabel`, and `getHistoryNeighbors` into `src/lib` or feature-local helper files
- [x] Move Firestore document mappers `mapAction` and `mapHistory` out of the component file, preferably near Firestore query/read utilities

### Verify
- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] Diff shows only imports/call sites changed for extracted pure helpers

---

## 🔄 Phase 3: Split State Into Hooks

- [x] Extract auth lifecycle into a hook that owns `user`, `authLoading`, sign-in, sign-out, and bootstrap error reporting
- [x] Extract Firestore live data subscriptions into a hook that owns current state, actions, history, snapshot mapping, and title hydration
- [x] Extract debounced current-title saving into a small hook that preserves the existing 450ms behavior
- [x] Extract action management state and handlers into a hook for create/edit/delete/select modes
- [x] Extract history edit/delete state and handlers into a hook for timeline entry mutation rules
- [x] Compose those hooks behind a stable `useEndlessTimerState` facade until views are migrated

### Verify
- [x] `npm run lint` passes
- [x] `npm run build` passes
- [ ] Manual smoke test: sign in, edit current title, select an action, select the same action again, and confirm two history events are created

---

## ✅ Phase 4: Extract App Shell And Shared UI

- [x] Move `SignedOutState`, `Header`, `DesktopSidebar`, `MobileBottomNav`, and shell-level Firebase/error banners into shell-focused component files
- [x] Move small reusable primitives `Eyebrow`, `Field`, and `Surface` into shared component files if they remain used by multiple views
- [x] Move action/history delete dialogs into focused dialog components controlled by the state facade
- [x] Keep layout flat and minimalist; avoid adding nested card wrappers while extracting components

### Verify
- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] Mobile and desktop navigation still render the same pages with the same route URLs

---

## ✅ Phase 5: Extract Page Views And Feature Components

- [x] Move `HomeView` into a home feature component, then split timer panel, action grid, mode controls, and action editor only where it reduces prop noise
- [x] Move `TimelineView` into a timeline feature component, then split date controls, edit form, and entry list
- [x] Move `AnalyticsView` into an analytics feature component, then split range controls, summary, and activity rows
- [x] Move `ProfileView` into a profile feature component, preserving PWA install behavior
- [x] Keep `src/components/endless-timer-app.tsx` as a thin route/page resolver plus shell composition

### Verify
- [x] `npm run lint` passes
- [x] `npm run build` passes
- [ ] Manual smoke test: Home timer/actions, Timeline date browsing/edit/delete, Analytics range/filter, Profile sign-out/install state

---

## 🔄 Phase 6: Tighten Contracts And Regression Coverage

- [x] Replace broad `ReturnType<typeof useEndlessTimerState>` view props with explicit prop types per view
- [ ] Add focused tests or lightweight assertions around history segment ordering, analytics range overlap, and history edit neighbor validation if the project test setup supports it
- [x] Review extracted files for circular imports, oversized prop bags, and duplicated state
- [x] Update this plan with any follow-up cleanup discovered during extraction

### Verify
- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] Refactored `src/components/endless-timer-app.tsx` is reduced to app composition, auth gating, page resolution, and dialog wiring
- [ ] Product invariants remain true for title/current-state/history behavior

---

## ✅ Phase 7: Fix Title Snapshot Race

- [x] Reproduce the likely race path from the refactor: current title debounce can outlive action selection and write the old title onto the newly selected action
- [x] Make action selection cancel pending debounced title saves and await any already-started title save before writing the history event and clearing current state
- [x] Verify lint and production build after the fix
- [x] Add temporary dev-only logs around title saving, action selection, Firestore writes, and timeline history rows
- [x] Use the logs to identify the real write bug: the outgoing title was being saved onto the newly selected history event
- [x] Update the Firestore action-selection mutation to snapshot the title onto the outgoing latest history event and create the new action event blank
- [x] Remove temporary debug logs after browser verification

### Verify
- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] Manual smoke test: enter a title on Work, select Break, and confirm the Work timeline entry keeps the title while Break starts blank

---
