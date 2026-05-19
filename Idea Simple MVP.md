---
type: idea
status: draft
created: 2026-05-18
updated: 2026-05-19
summary: Simple MVP note for EndlessTimer, a minimalist activity timer app with Firebase Auth, Firestore, actions, and tracked history.
canonical: true
tags:
  - idea
  - timer
  - firebase
related:
  - "[[02 - Projects/EndlessTimer/EndlessTimer]]"
  - "[[02 - Projects/Projects]]"
---

# EndlessTimer MVP

## Summary

EndlessTimer is a simple personal activity tracker where one timer runs endlessly and the user changes the current action instead of stopping the timer.

## Problem

Typical timers are too rigid for day-long tracking. The MVP should make it easy to keep one continuous timer and switch actions with low friction while preserving a clean history.

## Concept

- One endless timer is always active.
- User can write a title for the current timer entry.
- User manages actions: add, edit, update, remove, choose color, choose icon.
- Every action change is stored in history and shown as a vertical timeline.
- MVP is personal-first and optimized for fast daily use.

## MVP Scope

### Stack

- Firebase Auth
- Firebase Firestore
- Vercel for deployment

### Core features

- Endless timer with editable title
- Action management
- Action selection with color and icon
- Tracked history of action changes

### Data idea

- `users`
- `actions`
- `history_events`

Each history event stores the selected action, title, timestamp, and user id.

## Layout

The app can be a single-page layout with three main blocks:

1. Timer block with title
2. Actions block
3. Vertical timeline block with tracked history

## UI Direction

- Minimalistic style
- Vercel / shadcn / Notion-like feel
- Clean surfaces, soft spacing, simple typography
- Actions should be the only vivid visual area, using color chips and icons for quick recognition

## Constraints

- Keep it to one page for MVP
- Prioritize fast action switching over analytics
- Keep the first version simple and easy to deploy

## Open Questions

- Should auth be Google-only for v1, or also email/password?
- Should title belong to the current timer state or only to history events?
- Should actions be global defaults or fully user-created from the start?

## Related

- [[02 - Projects/EndlessTimer/EndlessTimer]]
- [[02 - Projects/Projects]]
