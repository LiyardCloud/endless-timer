# Plan: Firestore Read Reduction

**Status:** ✅ done
**Created:** 2026-09-13

---

## ✅ Phase 1: Stabilize Live Listeners

- [x] Keep user, actions, and history subscriptions stable while UI mutation state changes.
- [x] Preserve title hydration after an action selection without restarting subscriptions.

### Verify
- [x] Listener effect now depends only on the authenticated user, not `busy`.

---

## ✅ Phase 2: Remove Redundant Bootstrap Writes

- [x] Avoid updating an existing user document unless Google profile metadata changed.
- [x] Keep first-time user creation and default action bootstrapping intact.

### Verify
- [x] Returning users do not write their user document solely because a session starts.

---

## ✅ Phase 3: Verification

- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Review the final diff for Firestore read/write behavior.

---
