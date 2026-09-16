# Plan: Linear → EndlessTimer Integration

**Status:** 🔄 in-progress
**Created:** 2026-09-16

---

## ✅ Phase 1: Confirm the product contract and operational boundary

- [x] Limit the first release to the owner's personal Linear account; retain a user-scoped data model but do not build multi-user onboarding or operations.
- [x] Define the Linear issue set as issues assigned to the connected Linear user; never scan the whole workspace.
- [x] Add a dedicated client-side `Integrations` page where the user explicitly chooses the EndlessTimer action to start for Linear transitions; persist that action ID in safe integration configuration.
- [x] Use the existing VPS API host `https://api.timer.liyard.cloud`, managed by `systemd`; keep the service code, deployment files, and a simple Makefile workflow in this repository.
- [x] Define manual-override semantics: selecting an EndlessTimer action should clear an active Linear binding, while Linear does not change state until a later qualifying transition.

### Verify
- [x] Implement the VPS service in Node.js/TypeScript under `systemd`; defer the Docker decision until deployment preparation, since a container is not required for this single personal service.
- [x] Defer Node.js version, secret provisioning, systemd-unit location, and the exact Makefile implementation until deployment preparation.
- [x] Reserve the callback URL `https://api.timer.liyard.cloud/integrations/linear/callback`; register it before the OAuth connection flow is implemented.
- [x] Confirm by design that OAuth credentials remain server-only and inaccessible to client code.

---

## ✅ Phase 2: Extend the timer model and domain operations

- [x] Add typed `ExternalSource` metadata to user current state and history events, including Firestore mappers and export serialization.
- [x] Add reusable server-side timer operations using Admin SDK transactions, separate from browser Firebase helpers.
- [x] Implement idempotent `startExternalActivity`, which resolves the configured action, atomically closes the prior event, creates the next event, updates current state, and writes a private transition receipt.
- [x] Implement guarded external-title update and detach operations that affect only the currently bound Linear issue.
- [x] Preserve existing manual selection semantics, including a fresh event when the same action is chosen again and clearing `currentExternalSource`.
- [x] Keep the title editable while a Linear binding is active; the next matching Linear title update remains authoritative.

### Verify
- [x] Unit-test normal/same-action switch, duplicate external transition, renamed active issue, detach, and manual override.
- [x] Run `npm test`, `npm run lint`, and `npm run build`.

---

## 🔲 Phase 3: Build the isolated Linear integration service

- [ ] Create a deployable Node.js 22+ / TypeScript service for the VPS, separate from the Vercel Next.js runtime and sharing only server-safe domain code with the web app.
- [ ] Add the deployment assets: root-only secret-file contract, systemd unit, and `make up`, `make down`, `make update`, `make logs`, and `make status`.
- [ ] Implement OAuth authorization-code flow with `read` scope, CSRF `state`, PKCE, callback validation, token exchange, and secure redirect back to Profile.
- [ ] Store OAuth credentials and sync cursor/snapshots in a server-only Firestore location; encrypt tokens with a VPS-managed key before persistence.
- [ ] Store only safe connection/health metadata in `users/{uid}/integrations/linear` and update Firestore rules accordingly.
- [ ] Implement disconnect (revoke where possible, delete private credentials and snapshots, preserve timer history).

### Verify
- [ ] A normal Linear Member can connect and reconnect without admin privileges.
- [ ] Credentials, PKCE verifier, and OAuth state are never exposed through browser-readable Firestore data or redirects.
- [ ] Deploy updated Firestore rules after the rules change.

---

## 🔲 Phase 4: Poll, reconcile, and expose minimal UI

- [ ] Poll each connected user approximately once per minute, using paginated GraphQL queries filtered to relevant accessible issues and ordered by `updatedAt`.
- [ ] Establish a first-sync baseline without creating timer events; persist snapshots/cursor only after a successful fetch.
- [ ] Reconcile snapshots to process `non-started → started` transitions deterministically and idempotently; when several transitions appear in one poll, choose the issue with the newest Linear `updatedAt` (a documented approximation of transition order).
- [ ] Refresh expired OAuth tokens; classify revoked credentials as `reauth_required`; retry transient/network/rate-limit failures with bounded backoff.
- [ ] Add structured logs and a health endpoint, then build the dedicated `Integrations` page with target-action selection, connection state, workspace, last successful sync, reconnect, and disconnect controls.

### Verify
- [ ] Browser closed: a newly started assigned issue creates one Focus event within the polling interval.
- [ ] Existing started issues at first connection create no event.
- [ ] Repeated polls and a service restart create no duplicates.
- [ ] Active-issue rename updates the title; active issue leaving `started` only detaches the binding.
- [ ] A manually edited Linear-linked title persists until Linear later reports a title change.

---
