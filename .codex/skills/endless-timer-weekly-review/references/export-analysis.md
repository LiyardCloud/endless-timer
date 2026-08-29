# EndlessTimer Export Analysis

Use this reference when analyzing EndlessTimer weekly export JSON files.

## Expected Export Shape

Top-level fields commonly include:

- `exportedAt`: ISO timestamp when the export was generated.
- `period`: object with `from` and `to` dates in `YYYY-MM-DD`.
- `user`: snapshot of the user.
- `currentState`: currently active action at export time.
- `actions`: configured action definitions.
- `historyEvents`: raw action-selection events in or near the period.
- `segments`: computed timeline segments clipped to the selected period.

Each segment usually includes:

- `eventId`
- `actionId`
- `actionName`
- `actionColor`
- `actionIcon`
- `titleSnapshot`
- `startedAt`
- `endedAt`
- `seconds`

Prefer `segments` for duration, daily split, and transition analysis because segments are already clipped to the export period.

## Required Metrics

Calculate these when possible:

- Total tracked hours and whether the period is complete.
- Hours and percentage by `actionName`.
- Hours by day and action.
- Workday/weekend split.
- Average and median segment length.
- Segment count by action.
- Longest segments.
- Top transitions, especially repeated loops such as `RetroStyle Work -> Smoking -> RetroStyle Work`.
- Sleep duration by wake date, approximate bedtime, and wake time.
- Work start/end range, total work hours, and longest uninterrupted work block.
- `Break`/Idle duration and where it appears in the day.
- Title coverage: count and percentage of segments with non-empty `titleSnapshot`.

When previous exports are available, also calculate:

- Week-over-week delta for each major action.
- Delta in work hours, sleep average, idle/Break hours, movement, leisure, and Smoking frequency.
- Change in focus fragmentation: segment count, median segment length, and transitions per work hour.
- Rolling baseline when at least 4 weeks are available.

## Local Semantics

Use these interpretations unless the user overrides them:

- `Break`: Idle / miscellaneous minor activities. It may include rest, chores, browsing, small interruptions, or unclassified time. Do not label it as recovery without evidence.
- `Sleep`: Sleep.
- `RetroStyle Work`: Main work block.
- `Smoking`: Habit interruption. Duration may be small while frequency is behaviorally important.
- `Walking`: Movement / outside time.
- `Games` and `Films`: Leisure.
- `Family`: Family/social time.
- `Own`: Personal/self-directed time.

## Derived Signals

Useful ratios and signals:

- `work_hours / idle_break_hours`: how much tracked work exists relative to unclassified idle time.
- `smoking_segments / work_hours`: interruption density during work-heavy weeks.
- `longest_work_block`: proxy for deep focus.
- `median_segment_minutes`: fragmentation proxy.
- `title_coverage`: specificity of self-observation.
- `sleep_regularness`: bedtime and wake-time spread across the week.
- `recovery_weekend_shift`: weekend sleep, movement, family, leisure, and idle changes relative to weekdays.

Do not overfit a single week. Treat one-week spikes as candidates for observation unless previous exports confirm a trend.

## Data Quality Rules

Call out these issues explicitly:

- Final day is partial because `exportedAt` occurs before the local end of `period.to`.
- All or most `titleSnapshot` values are empty, limiting task-level analysis.
- Very long `Break` segments may represent idle/default tracking rather than intentional activity.
- Repeated same-action transitions may be intentional title snapshots, accidental duplicate clicks, or category resets.
- Segments starting before `period.from` or ending at `exportedAt` are expected when clipped by the export builder.

## Output Guidance

Write in Ukrainian when the user uses Ukrainian. Use compact tables for numbers and short prose for interpretation.

Prefer:

- "Факт: ..."
- "Ймовірна інтерпретація: ..."
- "Експеримент на наступний тиждень: ..."

Avoid:

- Treating productivity as the only goal.
- Shaming language.
- Claiming causation from simple correlations.
- Deep project-level conclusions when titles are missing.
