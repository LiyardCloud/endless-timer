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
- Keep the UI structurally flat and minimalist: do not create multi-layer card interfaces, nested cards, or stacked decorative containers unless the user explicitly asks for that layout

## Refactor And Architecture Rules

- Prevent god scripts: do not let one component own route composition, page rendering, state orchestration, data subscriptions, domain mutation logic, dialogs, and helper functions at the same time
- Keep `src/components/endless-timer-app.tsx` thin: it should remain the route/page resolver, auth gate, and high-level app composition entry point
- Put shared EndlessTimer feature code under `src/components/endless-timer/`:
  - `use-endless-timer-state.ts` for the composed app state facade and smaller state hooks
  - `shell.tsx` for signed-out state, responsive shell, and navigation
  - `dialogs.tsx` for app-level confirmation dialogs
  - `views/*.tsx` for page-level views
  - `types.ts`, `constants.ts`, `helpers.ts`, and `ui-primitives.tsx` for shared feature support
- Keep Firestore document mappers and reusable data utilities outside page/view components, preferably in `src/lib/`
- Extract when a file starts mixing unrelated responsibilities or grows beyond roughly 300-400 lines, unless there is a clear reason to keep it together
- Prefer explicit view props over passing entire state facades into every component; broad state props are acceptable only as a short-lived migration step
- Keep pure helpers separate from React components so they can be tested or reviewed without rendering UI
- When adding a multi-step feature or refactor, create or update a plan in `plans/` and keep it current as work progresses
- After refactors, run `npm run lint` and `npm run build`; also smoke test auth, action selection, title saving, timeline, analytics, and profile flows when behavior could be affected

## Firestore Rules Deployment

If `firebase/firestore.rules` changes, deploy the updated rules.

Deploy command:

```sh
firebase deploy --only firestore:rules --project endlesstimer-b1f71
```

Expectation:
- After any rules change, re-deploy the rules before considering the task complete
- If deployment fails, report the failure clearly and do not assume the rules are live
