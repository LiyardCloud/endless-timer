# Plan: Edit Timer Entries

**Status:** ✅ done
**Created:** 2026-05-20

---

## ✅ Phase 1: Editing Model And Firestore Support

- [x] Confirm the edit scope preserves action-selection event semantics and live timer safety
- [x] Add Firestore client support for updating owned history entries
- [x] Update Firestore rules to allow safe owner edits for history entries
- [x] Decide and encode guards for active-entry editing

### Verify
- [x] Editing support does not change how new history events are created
- [x] Unauthorized history entry updates remain blocked
- [x] Active timer state cannot become orphaned or inconsistent

---

## ✅ Phase 2: Timeline Edit UI

- [x] Add edit affordance for eligible timeline rows
- [x] Build an edit form for action, title, and started-at time
- [x] Pre-fill the form from the selected history entry
- [x] Save edits and refresh the timeline state cleanly

### Verify
- [x] A past timeline entry can be edited from the UI
- [x] Updating started-at time changes the visible timeline spans as expected
- [x] The currently active entry stays protected from editing

---

## ✅ Phase 3: Regression Coverage And Deployment

- [x] Run lint/build verification
- [x] Deploy updated Firestore rules to `endlesstimer-b1f71`
- [x] Update the plan and note any manual QA gaps

### Verify
- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] Firestore rules deploy successfully

---
