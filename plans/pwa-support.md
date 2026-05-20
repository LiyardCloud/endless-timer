# Plan: PWA Support

**Status:** ✅ done
**Created:** 2026-05-20

---

## ✅ Phase 1: Web App Metadata And Assets

- [x] Review the current Next.js app shell and choose a minimal PWA shape that fits the MVP
- [x] Add manifest metadata and install-oriented app metadata
- [x] Add app icons for browser and homescreen install flows
- [x] Add theme color and standalone display settings

### Verify
- [x] The app exposes a valid web app manifest
- [x] The app has installable icon metadata for modern browsers and iOS
- [x] The app shell metadata still matches the current product branding

---

## ✅ Phase 2: Offline Shell Support

- [x] Add a service worker for app-shell and route caching
- [x] Register the service worker from the client app shell
- [x] Add an offline fallback route for navigation failures
- [x] Keep the caching strategy conservative so Firebase-backed data stays fresh

### Verify
- [x] Static assets and core routes are available after first load
- [x] Offline navigation falls back to cached app shell instead of a browser error
- [x] Live Firestore data is not incorrectly cached as stale API responses

---

## ✅ Phase 3: Verification

- [x] Run lint/build verification
- [x] Update the plan with any manual install/offline QA gaps

### Verify
- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] Remaining browser-only QA steps are documented

---
