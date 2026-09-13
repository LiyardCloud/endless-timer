# Plan: Client Log Export

**Status:** 🔄 in-progress
**Created:** 2026-09-13

---

## 🔄 Phase 1: Local Client Event Journal

- [x] Create a browser-only, session-persistent log buffer with wall-clock and navigation-relative timestamps.
- [x] Record loading start, authentication completion, home-page readiness, activities readiness, and successful activity changes.
- [x] Keep event payloads limited to diagnostic metadata and activity names; exclude credentials and user identifiers.

### Verify
- [ ] Events persist across an in-app navigation and are visible in the browser console.

---

## 🔄 Phase 2: Profile Export

- [x] Add a Profile button that downloads the local client journal as JSON.
- [x] Keep the Profile layout flat and mobile-friendly.

### Verify
- [ ] Downloaded JSON has event names and timestamps.

---

## 🔲 Phase 3: Quality Checks

- [x] Run `npm run lint`.
- [x] Run `npm run build`.

---
