# Plan: Action Switch Sync

**Status:** 🔄 in-progress
**Created:** 2026-09-13

---

## 🔄 Phase 1: Remove Blocking Read

- [x] Keep the active history event ID in current user state.
- [x] Switch actions with a single batch write, without querying history first.
- [x] Preserve the prior event's title snapshot when its ID is available.

### Verify
- [ ] `npm run lint` passes (blocked: local dependencies are incomplete and `next` is unavailable).
- [ ] `npm run build` passes (blocked: local dependencies are incomplete and `next` is unavailable).

---

## 🔄 Phase 2: Deliver

- [x] Review the final diff.
- [x] Commit the implementation.
- [-] Push the commit to `origin/main`.

### Verify
- [ ] Confirm the working tree is clean and the remote branch contains the commit.

---
