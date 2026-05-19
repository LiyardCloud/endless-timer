# Plan: EndlessTimer MVP

**Status:** 🔄 in-progress
**Created:** 2026-05-19

---

## 🔄 Phase 1: Product Decisions And App Foundation

- [x] Confirm v1 auth method: Google-only
- [x] Choose initial app stack: Next.js single-page MVP
- [x] Scaffold the Next.js app structure for the single-page flow
- [-] Connect the existing Firebase project configuration for local development and deployment
- [x] Set up Vercel deployment target and environment variable handling
- [x] Define the one-page layout sections: timer, actions, timeline

### Verify
- [ ] App runs locally with Firebase config loaded
- [x] Local production build succeeds
- [ ] The main page renders the three MVP sections in a usable desktop and mobile layout

---

## 🔄 Phase 2: Data Model And Auth

- [x] Define Firestore collections and document shape for `users`, `actions`, and `history_events`
- [x] Store timer title in both current state and `history_events`
- [x] Record history events only on action selection, including re-selecting the same action to capture a new title snapshot
- [x] Implement Firebase Auth flow with Google Sign-In only
- [x] Create user bootstrap logic after first sign-in, including default actions
- [x] Add Firestore security rules for user-scoped actions and history data

### Verify
- [ ] A new user can sign in and get an initialized user record
- [ ] Authenticated users can read and write only their own actions and history events
- [ ] The chosen title storage model is reflected consistently in Firestore writes

---

## 🔄 Phase 3: Actions And Endless Timer Flow

- [x] Build action CRUD: add, edit, delete, and list actions
- [x] Support selecting color and icon for each action
- [x] Implement the endless timer display that remains continuously active
- [x] Add editable current entry title in the timer block
- [x] Implement action selection so each click creates a new `history_events` record with action, title, timestamp, and user id, even when the selected action matches the current one

### Verify
- [ ] Users can manage their personal action set without page reload issues
- [ ] Switching actions updates the current state immediately
- [ ] Clicking the same action again creates a new history event with the latest title
- [ ] Each action switch writes a correctly structured history event
- [-] Timer continues running while titles and actions change

---

## 🔄 Phase 4: Timeline, Polish, And MVP Release

- [x] Build the vertical timeline from `history_events`
- [x] Render action colors and icons clearly in the history view
- [x] Handle empty states, loading states, and basic error states for the single-page flow
- [x] Apply the minimal Vercel/shadcn/Notion-like visual pass while keeping action colors as the main vivid element
- [ ] Smoke test the complete MVP flow in production configuration

### Verify
- [ ] Timeline shows history events in the correct order with readable timestamps
- [ ] A full user flow works: sign in, create actions, switch actions, edit title, reload, and see persisted history
- [ ] The deployed MVP is usable from a single page on desktop and mobile

---
