# Plan: Action Switch Sync

**Status:** ✅ done
**Created:** 2026-09-13

---

## ✅ Phase 1: Remove Blocking Read

- [x] Keep the active history event ID in current user state.
- [x] Switch actions with a single batch write, without querying history first.
- [x] Preserve the prior event's title snapshot when its ID is available.

### Verify
- [x] `npm run lint` passes.
- [x] `npm run build` passes.

---

## ✅ Phase 2: Deliver

- [x] Review the final diff.
- [x] Commit the implementation.
- [x] Push the commit to `origin/main`.

### Verify
- [x] Confirm the working tree is clean and the remote branch contains the commit.

---
