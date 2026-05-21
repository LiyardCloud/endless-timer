# Plan: Mobile First Navigation Pages

**Status:** 🔄 in-progress
**Created:** 2026-05-19

---

## ✅ Phase 1: Information Architecture And Shared App Shell

- [x] Confirm the page split preserves the existing MVP behavior and Firestore rules
- [x] Define the navigation model for `Home`, `Timeline`, `Analytics`, and `Profile`
- [x] Decide the responsive shell pattern for mobile-first bottom navigation and desktop navigation/layout treatment
- [x] Extract or reorganize shared timer/auth/user state so multiple pages can reuse it without duplicating subscriptions
- [x] Identify which current single-page sections move into page-specific components

### Verify
- [x] The new structure keeps timer/action-selection behavior unchanged
- [x] Mobile navigation and desktop navigation patterns are both defined before UI implementation starts
- [x] Shared state boundaries are clear enough to avoid duplicated Firestore listeners

---

## ✅ Phase 2: Home And Navigation Foundation

- [x] Build the app shell with navbar and route/page entry points for `Home`, `Timeline`, `Analytics`, and `Profile`
- [x] Implement the mobile-first navigation UI with simple, thumb-friendly access to all primary pages
- [x] Add desktop-specific navigation/layout adjustments without breaking the mobile-first hierarchy
- [x] Move the timer block and actions block into the `Home` page only
- [x] Keep auth gating and empty/loading/error states coherent across the new shell

### Verify
- [x] On mobile, the user can move between all four pages with a clear primary nav
- [x] On desktop, the layout feels intentionally adapted rather than just stretched mobile UI
- [x] The `Home` page shows only timer and actions content

---

## ✅ Phase 3: Timeline And Analytics Pages

- [x] Create the `Timeline` page with a day header block above entries
- [x] Default the `Timeline` page to the current day and support switching days with arrows and direct date selection
- [x] Filter and render timer history entries for the selected day while preserving existing event semantics
- [x] Create the `Analytics` page with current-day stats as the default view
- [x] Show activity duration and percentage breakdowns for the selected range
- [x] Add range selection and first-pass filtering controls for analytics exploration

### Verify
- [x] `Timeline` opens on the current day and day switching updates the list correctly
- [x] Re-selecting the same action still produces distinct history entries that appear correctly in timeline views
- [x] `Analytics` shows sensible duration and percentage values for the active date range

---

## 🔄 Phase 4: Profile Page, Responsive Polish, And Regression Coverage

- [x] Create the `Profile` page with account details, sign-in state surfaces, and product-relevant actions
- [x] Polish page spacing, hierarchy, and component behavior separately for mobile and desktop
- [x] Add timer-entry deletion from the timeline with protection for the currently active entry
- [-] Regression-test auth flow, action selection, title saving, timeline browsing, and analytics calculations
- [x] Run lint/build verification and document any follow-up gaps

### Verify
- [x] `Profile` gives access to account info and expected account/app actions
- [-] Mobile remains the strongest experience while desktop has a clean adapted layout
- [x] `npm run lint` passes
- [x] `npm run build` passes

---

## ✅ Phase 5: Timeline Header Compact Polish

- [x] Replace the oversized Timeline day selector panel with the selected compact glass design
- [x] Verify responsive behavior and production build/lint checks

### Verify
- [x] Timeline date picker and previous/next day controls still update the selected day
- [x] `npm run lint` passes
- [x] `npm run build` passes

---

## ✅ Phase 6: Analytics Control Panel Compact Polish

- [x] Replace the oversized Analytics control panel with selected Variant 1
- [x] Verify preset, date range, and activity filter controls

### Verify
- [x] Analytics preset buttons update the range
- [x] Date inputs switch the range to custom
- [x] Activity filter still updates visible analytics rows
- [x] `npm run lint` passes
- [x] `npm run build` passes

---

## ✅ Phase 7: Analytics Control Panel Text Reduction

- [x] Remove visible Analytics header text from the compact control panel
- [x] Replace quick range buttons with a dropdown menu

### Verify
- [x] Range dropdown updates the selected preset and dates
- [x] Date inputs still switch the range to custom
- [x] Activity filter still updates visible analytics rows
- [x] `npm run lint` passes
- [x] `npm run build` passes

---

## ✅ Phase 8: Timeline Control Panel Text And Date Input Cleanup

- [x] Remove visible Timeline eyebrow text from the compact panel
- [x] Hide duplicate secondary date text when the heading already names the selected day
- [x] Replace the native visible date input with a single-icon clickable date pill

### Verify
- [x] Timeline date picker still opens from the date pill
- [x] Previous/next buttons still update the selected day
- [x] `npm run lint` passes
- [x] `npm run build` passes

---

## ✅ Phase 9: Analytics Date Input Click Target Cleanup

- [x] Convert Analytics date controls to full-click date pills

### Verify
- [x] From date picker opens from the whole field
- [x] To date picker opens from the whole field
- [x] Date changes still switch the range to custom
- [x] `npm run lint` passes
- [x] `npm run build` passes

---
