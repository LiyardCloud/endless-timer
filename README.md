# EndlessTimer

Minimal MVP for a personal activity timer built with Next.js, Firebase Auth, and Firestore.

## Local setup

1. Copy `.env.example` to `.env.local`
2. Fill in the Firebase web app environment variables from your existing Firebase project
3. Install dependencies with `npm install`
4. Run `npm run dev`

## Data model

- `users/{uid}`
  - `displayName`
  - `email`
  - `photoURL`
  - `currentTitle`
  - `currentActionId`
  - `currentActionName`
  - `currentActionColor`
  - `currentActionIcon`
  - `currentStartedAt`
  - `createdAt`
  - `updatedAt`
- `users/{uid}/actions/{actionId}`
- `users/{uid}/history_events/{eventId}`
- `users/{uid}/api_keys/{keyId}`

History events are created only when an action is selected. Selecting the same action again creates a fresh event and snapshots the latest title.

## Data export API

Users can create API keys from the Profile screen. The raw key is shown once and must be sent as a Bearer token:

```sh
curl "https://your-domain.example/api/export?from=2026-08-01&to=2026-08-29" \
  -H "Authorization: Bearer <api-key>"
```

The endpoint returns JSON with the selected period, user profile snapshot, current state, actions, history events, and computed activity segments. Server-side export requires Firebase Admin credentials in the deployment environment. Set either `FIREBASE_SERVICE_ACCOUNT_KEY` as a JSON string, or `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.
