# Task: Linear timer model

**Status:** active
**Created:** 2026-09-16
**Updated:** 2026-09-16 23:37
**Linear:** not provided

---

## Brief

Implement Phase 2 of the personal Linear → EndlessTimer integration: represent an external Linear issue on timer state and history, preserve manual timer behavior, and add server-only operations needed by the later Node.js integration service.

## Current Understanding

- The integration is personal, polls only issues assigned to the connected Linear user, and uses the newest `updatedAt` when several transitions are observed together.
- A dedicated Integrations page will configure the target EndlessTimer action in a later phase.
- Manual action selection clears the current Linear binding. A user may edit a Linear-linked title until a later Linear title update overrides it.

## Related Artifacts

- Plans:
  - `.agent-workspace/plans/2026-09-16-2240-linear-integration.md`
- Docs:
  - `.agent-workspace/docs/Linear → EndlessTimer integration 3ddcfd0161b4817f84dbccdd57357ef7.md`
- Context:
  - none yet
- Audits:
  - none yet
- Code:
  - `src/lib/types.ts`
  - `src/lib/firestore.ts`
  - `src/lib/firestore-mappers.ts`
  - `src/lib/export-data.ts`
  - `src/lib/firebase-admin.ts`

## Progress

- [x] Extend client-visible timer and history models with `ExternalSource`.
- [x] Preserve external-source metadata in manual action switching and exports.
- [x] Add and test server-side atomic timer operations.
- [x] Run tests, lint/build, and review the change.

## Research And Findings

- Client timer mutation currently uses Firebase browser SDK batches in `src/lib/firestore.ts`; server operations must use Firebase Admin SDK and remain outside client imports.
- Added Vitest tests for source matching, manual selection detachment, transaction switching, idempotency, title update, and detach.
- `firebase-admin@14.3.0` requires Node.js 22+; the later VPS service must use Node.js 22 or newer.

## Decisions

- 2026-09-16: Use Node.js/TypeScript rather than Go for the VPS integration service, enabling shared server-safe TypeScript code.
- 2026-09-16: Keep the active Linear badge for the later Integrations UI phase.
- 2026-09-16: Persist a hash-addressed private transition receipt so a retried poll cannot duplicate a history event.

## Open Questions

- None for Phase 2.

## Risks And Follow-Ups

- The selected target action is configured only in the later Integrations page, so server operations accept a concrete action rather than resolving it themselves.

## Impact Notes
