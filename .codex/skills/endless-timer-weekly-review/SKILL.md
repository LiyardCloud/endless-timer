---
name: endless-timer-weekly-review
description: Analyze EndlessTimer weekly JSON exports, compare them with previous exports when available, and produce a Ukrainian weekly review with trends, data-quality notes, and practical next-week experiments.
---

# Endless Timer Weekly Review

Use this skill when the user provides or points to one or more EndlessTimer JSON exports and wants a weekly analysis, trend review, behavioral insight, or ideas for improving how they spend or track time.

## Core Context

EndlessTimer is the user's personal activity tracker. It records one active action at a time and creates history events when the user selects an action. Export JSON normally contains actions, raw history events, and computed `segments` clipped to the requested period.

Interpret the user's action names with their local meaning:

- `Break` means idle time with various minor activities. Do not treat it as deliberate rest by default.
- `Sleep` is sleep.
- `RetroStyle Work` is work.
- `Smoking` is a short interruption or habit loop, especially when it alternates with work.
- `Own` is personal/self-directed time unless the user gives a more specific meaning.

If action semantics are unclear, state the uncertainty instead of over-interpreting.

## Workflow

1. Read the current weekly export and inspect its top-level shape.
2. Look for previous EndlessTimer exports near the provided file, especially names like `endless-timer-YYYY-MM-DD-to-YYYY-MM-DD.json`.
3. If previous exports exist, compare the current week against the previous week and, when enough data exists, a 4-week rolling baseline.
4. If previous exports are missing, say that trend analysis is not yet factual and frame trend-related output as proposed metrics for future weeks.
5. Use computed `segments` for duration analysis when present. Use `historyEvents` only for checks, event counts, and diagnosing data issues.
6. Account for incomplete periods. If `exportedAt` falls before the local end of the `period.to` day, mark the final day/week as partial.
7. Convert timestamps to the user's local timezone when discussing daily routines. In this project context, default to `Europe/Kyiv` unless the user specifies another timezone.
8. Produce a concise Ukrainian report focused on facts, interpretation, and one or a few actionable experiments.

Read [references/export-analysis.md](references/export-analysis.md) when calculating metrics or preparing the review.

## Report Shape

Prefer this structure, adapting as needed:

- **Коротко:** 3-5 sentence summary of the week.
- **Метрики:** compact table of action hours, percentages, and deltas when available.
- **Патерни:** sleep, work, idle/Break, focus fragmentation, movement, leisure, repeated transitions.
- **Тренди:** week-over-week and rolling-baseline changes when previous exports exist.
- **Якість даних:** missing titles, partial days, suspicious long idle blocks, duplicate same-action events, gaps or clipping.
- **Ідеї:** one concrete experiment for next week plus optional tracking improvements.

Keep the tone reflective and practical. Avoid moralizing. Separate observed facts from hypotheses.
