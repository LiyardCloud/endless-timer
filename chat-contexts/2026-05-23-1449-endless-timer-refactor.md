# Context: Endless Timer Refactor

**Date:** 2026-05-23 14:49
**Session focus:** Refactor the large `endless-timer-app.tsx` component, document architecture rules, and preserve product behavior.

---

## Done this session

- Analyzed `src/components/endless-timer-app.tsx`, which had grown to 1,941 lines and mixed app shell, state, Firestore subscriptions, views, dialogs, and helpers.
- Created and executed `plans/endless-timer-app-refactor.md` using the project-planner workflow.
- Reduced `src/components/endless-timer-app.tsx` to a thin 132-line app composer and route/page resolver.
- Extracted feature support files under `src/components/endless-timer/`: `types.ts`, `constants.ts`, `helpers.ts`, `ui-primitives.tsx`, `shell.tsx`, `dialogs.tsx`, and `use-endless-timer-state.ts`.
- Extracted page views into `src/components/endless-timer/views/`: `home-view.tsx`, `timeline-view.tsx`, `analytics-view.tsx`, and `profile-view.tsx`.
- Moved Firestore snapshot mappers into `src/lib/firestore-mappers.ts`.
- Updated `AGENTS.md` with architecture rules to prevent future god scripts and keep the app composer thin.
- Ran `npm run lint` and `npm run build`; both passed after refactor.
- Started dev server during the session on `http://localhost:3001` because port 3000 was occupied.

## Decisions made

- **App entry:** Keep `src/components/endless-timer-app.tsx` as the public route/page resolver and high-level composer.
- **Feature layout:** Put EndlessTimer-specific shared code under `src/components/endless-timer/`.
- **State boundary:** Keep one composed `useEndlessTimerState` facade, internally split into auth, live data/title saving, action management, history event management, and clock hooks.
- **View boundary:** Keep page-level views in `views/*.tsx`; avoid splitting deeper unless it reduces real prop noise.
- **Product invariants:** Preserve Google-only auth, one active endless timer, current title in user state, title snapshot in history, history events only on action selection, and same-action selection still appending history.
- **Firestore rules:** No rules were changed, so no Firestore rules deploy was needed.
- **Architecture guardrail:** Future work should extract files around 300-400 lines or when unrelated responsibilities mix.

## Key files

- `AGENTS.md` — project rules plus new refactor/architecture guardrails.
- `plans/endless-timer-app-refactor.md` — plan and current checklist status.
- `src/components/endless-timer-app.tsx` — thin app composer.
- `src/components/endless-timer/use-endless-timer-state.ts` — composed app state facade and smaller hooks.
- `src/components/endless-timer/shell.tsx` — signed-out state, responsive shell, and navigation.
- `src/components/endless-timer/dialogs.tsx` — action/history delete dialogs.
- `src/components/endless-timer/views/home-view.tsx` — home timer/actions view.
- `src/components/endless-timer/views/timeline-view.tsx` — timeline view and history edit UI.
- `src/components/endless-timer/views/analytics-view.tsx` — analytics view.
- `src/components/endless-timer/views/profile-view.tsx` — profile/PWA install view.
- `src/lib/firestore-mappers.ts` — Firestore document mappers.

## Next steps

- [ ] Manually smoke test Firebase/browser behavior: sign in, edit title, select action, select same action again, confirm two history events.
- [ ] Manually smoke test Home, Timeline date browsing/edit/delete, Analytics range/filter, Profile sign-out/install state.
- [ ] Consider adding focused tests or assertions for history segment ordering, analytics overlap, and history edit neighbor validation.
- [ ] If dev server is still running on `http://localhost:3001`, stop it when no longer needed.
