# Plan: Route-Scoped Firestore Reads

**Status:** 🔄 in-progress
**Created:** 2026-09-13

---

## 🔄 Phase 1: Core Home Data

- [x] Keep only the current user document and actions as realtime Home subscriptions.
- [x] Remove history and API-key subscriptions from the shared app state.
- [x] Preserve action selection through `currentHistoryEventId`, with a bounded fallback for legacy user documents.

### Verify
- [ ] A normal Home open uses reads only for the user document and actions.
- [ ] Selecting an action does not subscribe to history.

---

## 🔲 Phase 2: Page-Scoped History

- [ ] Give Timeline a date-scoped query plus bounded neighbouring entries for segment and edit calculations.
- [ ] Give Analytics a selected-range query plus preceding and following boundary entries.
- [ ] Keep full-range export as an on-demand query only after the user requests a download.

### Verify
- [ ] Changing Timeline date reads only that date's entries and boundaries.
- [ ] Analytics reads only the selected range and its two boundary entries.

---

## 🔲 Phase 3: Profile And Bootstrap

- [ ] Load API keys only on Profile.
- [ ] Replace Profile history count with an aggregate count query.
- [ ] Finish reducing bootstrap reads for returning users without breaking first-user defaults.

### Verify
- [ ] Home never reads API keys or history solely to render.

---

## 🔲 Phase 4: Safety And Measurement

- [ ] Add event-level client diagnostics for each Firestore subscription/query.
- [ ] Run lint, build, and Home/Timeline/Analytics/Profile smoke tests.
- [ ] Compare Firestore Usage before and after deployment.

---
