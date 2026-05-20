# Context: Navigation, History Delete, And Vercel Fix

**Date:** 2026-05-20 13:10
**Session focus:** Expand EndlessTimer from a single-page screen into a mobile-first multi-page app shell, add timer-entry deletion, and fix Vercel deployment configuration.

---

## Done this session

- Created a new implementation plan at `plans/mobile-first-navigation-pages.md` and executed it.
- Refactored the app into a mobile-first multi-page shell with separate `Home`, `Timeline`, `Analytics`, and `Profile` routes.
- Kept the core timer/history product behavior intact: action selection still appends history events, including when the same action is selected again.
- Added shared timeline/analytics date-range helpers in `src/lib/history.ts`.
- Added full-history querying support in `src/lib/firestore.ts` so timeline and analytics are not limited to the previous 50-event slice.
- Added timer-entry deletion from the timeline UI with confirmation and a guard that blocks deleting the currently active timer entry.
- Updated Firestore rules to allow owners to delete `history_events` while still forbidding updates.
- Deployed the updated Firestore rules successfully to Firebase project `endlesstimer-b1f71`.
- Added `vercel.json` with `"framework": "nextjs"` after a Vercel build failure complaining about missing `public` output.
- Verified code changes with `npm run build` and `npm run lint`.

## Decisions made

- **Mobile-first shell:** Use bottom navigation on mobile and a sidebar on desktop instead of keeping everything on one page.
- **Home scope:** Keep only the timer block and actions block on `Home`.
- **Timeline behavior:** Default timeline to the current day and let the user move by arrows or direct date selection.
- **Analytics scope:** Default analytics to the current day, then support range presets, custom dates, and activity filtering.
- **History deletion safety:** Allow deleting past timer entries, but do not allow deleting the currently active entry because it would orphan live timer state.
- **Firestore permissions:** Keep `history_events` append-only except for owned deletes; updates remain forbidden.
- **Vercel config:** Treat the repo explicitly as a Next.js app and do not use `public` as a deployment output directory.

## Key files

- `plans/mobile-first-navigation-pages.md` — execution plan for navigation/pages and follow-up status tracking.
- `src/components/endless-timer-app.tsx` — main app shell, route-aware page rendering, timeline deletion UI, and confirmation flows.
- `src/app/page.tsx` — `Home` route entry.
- `src/app/timeline/page.tsx` — `Timeline` route entry.
- `src/app/analytics/page.tsx` — `Analytics` route entry.
- `src/app/profile/page.tsx` — `Profile` route entry.
- `src/lib/history.ts` — timeline segmentation, date helpers, and analytics aggregation.
- `src/lib/firestore.ts` — shared Firestore queries plus `removeHistoryEvent()`.
- `firebase/firestore.rules` — owner delete permission for `history_events`, still no updates.
- `vercel.json` — explicit Vercel framework config for Next.js.

## Next steps

- [ ] Manually test the live mobile UI in the browser, especially bottom navigation, spacing, and tap targets.
- [ ] Manually verify timeline-entry deletion against the real Firebase app, including the active-entry guard.
- [ ] In Vercel project settings, confirm `Framework Preset` is `Next.js` and `Output Directory` is empty/unset before redeploying.
- [ ] Decide whether Phase 4 in `plans/mobile-first-navigation-pages.md` can be marked done after manual QA.
