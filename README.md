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

History events are created only when an action is selected. Selecting the same action again creates a fresh event and snapshots the latest title.
