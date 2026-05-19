# AGENTS.md

## Project

EndlessTimer is a minimalist personal activity tracker built as a single-page Next.js app.

Core stack:
- Next.js
- React
- Firebase Auth with Google Sign-In only
- Cloud Firestore
- Vercel for deployment

Core product behavior:
- One endless timer is always active once the user selects an action
- The current title is stored in user current state
- The title is also snapshotted into history events
- History events are created only when the user selects an action
- Clicking the same action again must still create a new history event with the latest title
- New users should be bootstrapped with default actions

## Data Model

Primary Firestore structure:
- `users/{uid}`
- `users/{uid}/actions/{actionId}`
- `users/{uid}/history_events/{eventId}`

Rules source file:
- `firebase/firestore.rules`

Firebase project:
- `endlesstimer-b1f71`

Repo Firebase config:
- `.firebaserc`
- `firebase.json`

## Working Rules

- Preserve the single-page MVP shape unless the user asks to expand scope
- Keep auth Google-only unless the user explicitly changes the requirement
- Treat Firestore history as append-only for action-selection events
- Do not change the title/history behavior without checking the product rules above

## Firestore Rules Deployment

If `firebase/firestore.rules` changes, deploy the updated rules.

Deploy command:

```sh
firebase deploy --only firestore:rules --project endlesstimer-b1f71
```

Expectation:
- After any rules change, re-deploy the rules before considering the task complete
- If deployment fails, report the failure clearly and do not assume the rules are live
