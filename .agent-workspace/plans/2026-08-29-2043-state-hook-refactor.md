# Plan: State Hook Refactor

**Status:** ✅ done
**Created:** 2026-08-29

---

## ✅ Phase 1: Split Hook Responsibilities

- [x] Identify the existing internal hook boundaries in `use-endless-timer-state.ts`
- [x] Extract shared hook types and error helpers
- [x] Move auth/session logic into a focused hook file
- [x] Move timer live-data and debounced title saving into focused hook files
- [x] Move action management into a focused hook file
- [x] Move history event management into a focused hook file
- [x] Keep `useEndlessTimerState` as the stable facade used by the app

### Verify
- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] Public imports of `useEndlessTimerState` and `EndlessTimerState` still work

---
