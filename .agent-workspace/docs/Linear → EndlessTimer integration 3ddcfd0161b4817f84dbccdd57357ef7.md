# Linear → EndlessTimer integration

<aside>
🎯

**Goal:** automatically synchronize work activity from Linear into EndlessTimer. When a Linear issue becomes actively worked on, EndlessTimer should switch to `Focus` and use the Linear issue identifier/title as the timer title. The integration is one-way: **Linear → EndlessTimer only**.

</aside>

## Context

EndlessTimer is a personal activity timer built on Next.js, Firebase Auth, and Firestore. It is hosted on Vercel. The current timer state already contains a `currentTitle`, active action, current history event and start time; history events snapshot the title when activity changes.

The desired behavior is to connect a user's work Linear account so that Linear becomes an external source of context for the current timer. The integration should continue to work even when the EndlessTimer web UI is closed.

The current user may only be a **Member** of a Linear workspace rather than an admin. Therefore the implementation must not depend on workspace-level administration privileges.

## Scope

### In scope

- Linear OAuth authorization for a normal workspace Member.
- Read-only access to Linear data available to the authorized user.
- Server-side polling of Linear while the EndlessTimer UI is closed.
- Detection of issue status transitions.
- Automatic switching of EndlessTimer to `Focus` when an issue moves into a started/In Progress state.
- Synchronization of Linear issue identifier and title into the EndlessTimer title.
- Tracking the Linear issue identity separately from plain timer title text.
- Updating the timer title when the active Linear issue is renamed.
- Correct handling of multiple issues that may simultaneously remain In Progress.
- Token refresh, retry handling and idempotency.
- Minimal integration status UI in EndlessTimer Profile.

### Out of scope

- EndlessTimer → Linear synchronization.
- Automatically changing Linear issue status from the timer.
- Generic integration platform or a universal integration server.
- Redis, Kafka, RabbitMQ or other queue infrastructure for the first version.
- Separate SQL database unless it becomes necessary later.
- Linear workspace-level webhooks for the first version.

## Key constraint: Linear Member access

A normal Linear Member can authorize an OAuth application with read access. The backend can then call Linear's API **on behalf of that user** and read the data that user already has permission to see.

This means the integration does not require the user to be a workspace admin for the core use case.

The first version should use:

```
Linear OAuth
scope = read
actor = user
```

The backend stores the resulting OAuth credentials and uses refresh tokens to continue accessing Linear without an open browser session.

Workspace-level webhook management should not be a dependency because that normally requires broader administrative permissions. Instead, the integration should use server-side polling.

## Target behavior

Example Linear issue:

```
ENG-421  Implement Xbox achievements
Todo → In Progress
```

Expected EndlessTimer state:

```
Action: Focus
Title: ENG-421 · Implement Xbox achievements
External source: Linear / ENG-421
```

When another issue later transitions into In Progress:

```
ENG-455  Fix achievement notifications
```

EndlessTimer switches to a new Focus history event:

```
ENG-421   10:00–10:42
ENG-455   10:42–...
```

The previous Linear issue may remain `In Progress` in Linear. Linear workflow state and the user's currently timed activity are not the same concept.

## Status synchronization rule

The timer must **not** simply select any issue whose current state is In Progress.

The rule should be:

> The most recent issue that transitions from a non-started state into a started state becomes the active Linear-linked timer activity.
> 

Conceptually:

```
previous.stateType != started
current.stateType  == started
        ↓
Start/switch EndlessTimer Focus activity
```

This avoids ambiguity when several Linear issues remain In Progress at once.

## Behavior for status changes

| Linear change | EndlessTimer behavior |
| --- | --- |
| Issue enters `started` / In Progress | Switch to `Focus`, set timer title from Linear issue, bind issue as external source |
| Active issue title changes | Update current timer title |
| Active issue leaves started state | Detach Linear binding; do not automatically switch to Break or mark any other activity |
| Another issue enters started | Create a new Focus history event for the newly started issue |
| Polling sees no changes | No Firestore/timer mutation |

## Why server-side polling

EndlessTimer is hosted on Vercel, but synchronization should not depend on an open browser tab. A small long-running process on the existing VPS can handle only the Linear integration workload.

The web application remains on Vercel:

```
EndlessTimer UI / Vercel
        │
        │ reads Firestore realtime state
        ▼
     Firestore
        ▲
        │
Linear sync process / VPS
        ▲
        │ OAuth + GraphQL polling
        │
      Linear
```

The VPS process is **not intended to become a generic integration server in this task**. Its responsibility is only to run the Linear OAuth/API synchronization and write the corresponding EndlessTimer state.

A first version can poll approximately once per minute. This introduces at most roughly one polling interval of delay, which is acceptable for time tracking and avoids relying on workspace-level Linear webhooks.

## OAuth flow

Recommended flow:

```
EndlessTimer Profile
      │
      │ Connect Linear
      ▼
VPS /integrations/linear/connect
      │
      ▼
Linear authorization
      │
      ▼
VPS /integrations/linear/callback
      │
      ├─ exchange code for tokens
      ├─ fetch viewer/workspace identity
      ├─ store integration credentials
      └─ redirect back to EndlessTimer Profile
```

The OAuth callback should preferably terminate on the VPS so Linear client secrets and refresh-token handling stay outside the Vercel frontend application.

## Integration data model

The timer should not identify a Linear issue by parsing `currentTitle`. The external entity must be stored explicitly.

Suggested model:

```tsx
type ExternalSource = {
  provider: "linear";
  issueId: string;
  identifier: string;
  url?: string;
};
```

Add an optional external source to the current timer state:

```tsx
currentExternalSource?: ExternalSource | null;
```

and to history events:

```tsx
externalSource?: ExternalSource | null;
```

This enables future analytics such as time per Linear issue without relying on text parsing.

### Private integration state

OAuth credentials and synchronization state should be server-only. Conceptually:

```
integrations_private/{userId}/linear
```

Example fields:

```
linearUserId
workspaceId
accessTokenEncrypted
refreshTokenEncrypted
lastSyncAt
status
```

Client-visible status can remain separate:

```
users/{uid}/integrations/linear
```

with only safe metadata such as:

```
connected
workspaceName
lastSyncAt
status
```

The client must never receive Linear refresh tokens.

## Linear issue snapshot

Polling requires remembering enough previous state to detect transitions rather than only inspecting the current state.

Minimal snapshot:

```tsx
type LinearIssueSnapshot = {
  issueId: string;
  identifier: string;
  title: string;
  stateId: string;
  stateType: string;
  updatedAt: string;
};
```

The first successful synchronization should establish a baseline snapshot and **must not create artificial timer history for issues that were already In Progress before the integration was connected**.

Subsequent syncs compare old and new snapshots.

## Sync algorithm

```
Every ~60 seconds
    ↓
Load enabled Linear integration
    ↓
Ensure valid OAuth access token
    ↓
Fetch relevant assigned/accessible issues changed since last sync
    ↓
Compare with stored snapshots
    ↓
Detect transitions / title changes
    ↓
Apply normalized change to EndlessTimer
    ↓
Persist new snapshots + lastSyncAt
```

Important properties:

- No write when nothing changed.
- A repeated poll must not create duplicate history events.
- Server restart must not replay previously processed transitions.
- Token expiration should trigger refresh automatically.
- Temporary Linear/API failures should retry later without corrupting timer state.

## Timer-side behavior

The synchronization layer should call a small timer-domain operation rather than manually duplicating Firestore transition logic in multiple places.

Conceptually:

```tsx
startExternalActivity({
  userId,
  action: "Focus",
  title: "ENG-421 · Implement Xbox achievements",
  externalSource: {
    provider: "linear",
    issueId,
    identifier: "ENG-421"
  }
});
```

This operation should perform the same semantic transition as a normal EndlessTimer activity switch: snapshot the previous event, create the next history event and update current state atomically.

For title updates of the currently bound issue, a dedicated operation such as `updateExternalTitle()` should update only the active matching Linear-bound event/state.

## Failure handling

### OAuth/token failure

- Expired access token → refresh and retry.
- Invalid/revoked refresh token → mark integration `reauth_required`.
- Do not delete historical Linear-linked timer events.

### Linear unavailable / rate limited

- Preserve current timer state.
- Retry on the next scheduled run or with bounded exponential backoff.
- Do not invent transitions from incomplete responses.

### Firestore write failure

- Do not mark the Linear transition as successfully processed until the corresponding timer update is committed.
- A later retry must remain idempotent.

## Minimal EndlessTimer UI

Profile should expose only what is necessary:

```
Linear
Connected to <workspace>
Last sync: <time>
Status: Healthy

[Reconnect] [Disconnect]
```

For the active timer, an optional small `Linear` badge and issue identifier can make the source explicit. Full issue management inside EndlessTimer is not required.

---

# Implementation plan

## Phase 1 — Timer model and server-side transition API

**Goal:** prepare EndlessTimer to safely represent and mutate Linear-linked activities.

- [ ]  Add `ExternalSource` / Linear source metadata to current timer state and history events.
- [ ]  Extract the semantics of activity switching into a reusable server/domain operation.
- [ ]  Implement `startExternalActivity()` using atomic Firestore writes.
- [ ]  Implement `updateExternalTitle()` for the currently bound issue.
- [ ]  Implement detach behavior when the current Linear issue leaves the started state.
- [ ]  Ensure existing manual timer behavior remains unchanged.

**Result:** EndlessTimer can represent an externally sourced activity without Linear being connected yet.

## Phase 2 — Linear OAuth connection

**Goal:** allow a normal Linear Member to connect their account securely.

- [ ]  Create Linear OAuth application with read-only scope.
- [ ]  Add `/integrations/linear/connect` endpoint on the VPS process.
- [ ]  Add `/integrations/linear/callback` endpoint.
- [ ]  Exchange authorization code for access/refresh tokens.
- [ ]  Fetch and save Linear user/workspace identity.
- [ ]  Encrypt/store refresh credentials server-side.
- [ ]  Add safe client-visible integration status in Firestore.
- [ ]  Add `Connect Linear`, reconnect and disconnect controls to EndlessTimer Profile.

**Result:** a workspace Member can connect Linear without requiring admin permissions.

## Phase 3 — Polling and baseline synchronization

**Goal:** run synchronization independently of the EndlessTimer browser UI.

- [ ]  Add a long-running Linear sync process on the VPS.
- [ ]  Run sync approximately every 60 seconds.
- [ ]  Implement Linear GraphQL client and OAuth token refresh.
- [ ]  Fetch relevant issues assigned/visible to the authorized user.
- [ ]  Store minimal `LinearIssueSnapshot` state.
- [ ]  On first sync, establish baseline only; do not create timer events.
- [ ]  Optimize subsequent requests around issue `updatedAt` / last sync timestamp where practical.

**Result:** Linear state is continuously observed even when EndlessTimer is closed.

## Phase 4 — Linear → EndlessTimer transitions

**Goal:** make Linear status changes drive the timer.

- [ ]  Detect `non-started → started` transitions.
- [ ]  Start/switch EndlessTimer to `Focus` with `<identifier> · <title>`.
- [ ]  Persist the Linear issue ID as `externalSource`.
- [ ]  Detect title changes for the currently active Linear issue.
- [ ]  Update active timer title when the Linear title changes.
- [ ]  Detect when the active issue leaves the started state and detach the binding.
- [ ]  Implement the rule that the most recently transitioned started issue becomes active when multiple issues remain In Progress.

**Result:** the core user-facing integration works end-to-end.

## Phase 5 — Reliability and production hardening

**Goal:** make continuous synchronization safe for daily use.

- [ ]  Make transition processing idempotent.
- [ ]  Prevent duplicate history events across repeated polling and server restarts.
- [ ]  Add refresh-token error handling and `reauth_required` state.
- [ ]  Add handling for Linear rate limits and temporary 5xx/network failures.
- [ ]  Add structured logs for sync runs and transition decisions.
- [ ]  Add a basic health endpoint for the VPS process.
- [ ]  Verify Firestore security rules keep private integration credentials inaccessible to clients.
- [ ]  Test restart/recovery scenarios.

**Result:** the integration can run continuously without requiring an open EndlessTimer tab or manual intervention during normal operation.

## Acceptance criteria

- [ ]  A normal Linear workspace Member can connect their account without admin permissions.
- [ ]  Synchronization continues while EndlessTimer is closed.
- [ ]  Moving an assigned issue into In Progress creates/switches to a Focus activity within approximately one polling interval.
- [ ]  Timer title contains the Linear issue identifier and current title.
- [ ]  Renaming the currently timed Linear issue updates the timer title.
- [ ]  Multiple In Progress issues do not create ambiguous or repeated timer switches.
- [ ]  First-time connection does not generate fake historical transitions.
- [ ]  Repeated polling and service restarts do not duplicate history events.
- [ ]  Linear OAuth credentials are never exposed to the browser.
- [ ]  No EndlessTimer action automatically changes Linear data.