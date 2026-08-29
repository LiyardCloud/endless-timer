# Plan: Data Export API

**Status:** ✅ done
**Created:** 2026-08-29

---

## ✅ Phase 1: Data Model And API Shape

- [x] Define export period inputs, response shape, and API key format
- [x] Add typed API key data and Firestore helpers
- [x] Add server-side Firebase Admin support for API export

### Verify
- [x] TypeScript build can resolve client and server data paths

---

## ✅ Phase 2: Profile UI

- [x] Add profile export controls for selected period
- [x] Add API key creation, one-time key reveal, and revoke flow
- [x] Keep profile layout flat and compact

### Verify
- [x] `npm run lint` passes
- [x] `npm run build` passes

---

## ✅ Phase 3: Rules And Verification

- [x] Update Firestore rules for user-owned API key documents
- [x] Run lint/build
- [x] Deploy Firestore rules or report deployment blocker

### Verify
- [x] Firestore rules deployment result is known

Deployment result: `firebase deploy --only firestore:rules --project endlesstimer-b1f71` released ruleset `3c713127-a26f-4ada-9ca0-9062f4a84ffe` to `cloud.firestore`.

---
