import { useRef, useState } from "react";
import { Calendar, Filter } from "lucide-react";

import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActionIcon } from "@/lib/action-icons";
import { buildAnalyticsRows, formatDayRangeLabel, getDefaultRange } from "@/lib/history";
import type { ActionItem, CurrentState, HistoryEvent } from "@/lib/types";
import { formatDateInputLabel, formatSegmentDuration } from "@/components/endless-timer/helpers";
import { Surface } from "@/components/endless-timer/ui-primitives";
import type { AnalyticsPreset, AnalyticsRange } from "@/components/endless-timer/types";

export function AnalyticsView({
  history,
  currentState,
  clockNow,
  actions
}: {
  history: HistoryEvent[];
  currentState: CurrentState;
  clockNow: number;
  actions: ActionItem[];
}) {
  const [range, setRange] = useState<AnalyticsRange>(() => ({
    preset: "today",
    ...getDefaultRange("today")
  }));
  const [selectedActionId, setSelectedActionId] = useState<string>("all");
  const analyticsFromInputRef = useRef<HTMLInputElement | null>(null);
  const analyticsToInputRef = useRef<HTMLInputElement | null>(null);
  const rows = buildAnalyticsRows(history, currentState, clockNow, range.from, range.to, selectedActionId);
  const totalSeconds = rows.reduce((sum, row) => sum + row.seconds, 0);

  function applyPreset(preset: AnalyticsPreset) {
    setRange({
      preset,
      ...getDefaultRange(preset)
    });
  }

  function openAnalyticsDatePicker(input: HTMLInputElement | null) {
    if (!input) {
      return;
    }

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.045)_0px,rgba(255,255,255,0.045)_1px,transparent_1px,transparent_9px),linear-gradient(135deg,rgba(38,92,255,0.26),rgba(7,9,16,0.9))] p-px">
        <section className="rounded-[21px] border border-white/[0.08] bg-white/[0.06] px-3.5 py-3 shadow-panel backdrop-blur-xl">
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_1.2fr]">
            <label className="min-w-0">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Range</span>
              <span className="flex h-9 min-w-0 items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 text-sm text-white">
                <select
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
                  value={range.preset}
                  onChange={(event) => applyPreset(event.target.value as AnalyticsPreset)}
                >
                  <option value="today" className="bg-[#0b1020] text-white">
                    Today
                  </option>
                  <option value="7d" className="bg-[#0b1020] text-white">
                    Last 7 days
                  </option>
                  <option value="30d" className="bg-[#0b1020] text-white">
                    Last 30 days
                  </option>
                  <option value="custom" className="bg-[#0b1020] text-white">
                    Custom
                  </option>
                </select>
              </span>
            </label>
            <label className="min-w-0">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">From</span>
              <span className="relative block min-w-0">
                <button
                  className="flex h-9 w-full min-w-0 items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 text-left text-sm text-white"
                  onClick={() => openAnalyticsDatePicker(analyticsFromInputRef.current)}
                  type="button"
                >
                  <Calendar size={15} className="shrink-0 text-white/75" />
                  <span className="min-w-0 flex-1 truncate text-sm text-white">{formatDateInputLabel(range.from)}</span>
                </button>
                <input
                  ref={analyticsFromInputRef}
                  className="pointer-events-none absolute inset-0 size-full opacity-0 [color-scheme:dark]"
                  tabIndex={-1}
                  type="date"
                  value={range.from}
                  onChange={(event) =>
                    setRange((current) => ({
                      ...current,
                      preset: "custom",
                      from: event.target.value
                    }))
                  }
                />
              </span>
            </label>
            <label className="min-w-0">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">To</span>
              <span className="relative block min-w-0">
                <button
                  className="flex h-9 w-full min-w-0 items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 text-left text-sm text-white"
                  onClick={() => openAnalyticsDatePicker(analyticsToInputRef.current)}
                  type="button"
                >
                  <Calendar size={15} className="shrink-0 text-white/75" />
                  <span className="min-w-0 flex-1 truncate text-sm text-white">{formatDateInputLabel(range.to)}</span>
                </button>
                <input
                  ref={analyticsToInputRef}
                  className="pointer-events-none absolute inset-0 size-full opacity-0 [color-scheme:dark]"
                  tabIndex={-1}
                  type="date"
                  value={range.to}
                  onChange={(event) =>
                    setRange((current) => ({
                      ...current,
                      preset: "custom",
                      to: event.target.value
                    }))
                  }
                />
              </span>
            </label>
            <label className="min-w-0">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Activity filter</span>
              <span className="flex h-9 min-w-0 items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 text-sm text-white">
                <Filter size={15} className="shrink-0 text-white/75" />
                <select
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
                  value={selectedActionId}
                  onChange={(event) => setSelectedActionId(event.target.value)}
                >
                  <option value="all" className="bg-[#0b1020] text-white">
                    All activities
                  </option>
                  {actions.map((action) => (
                    <option key={action.id} value={action.id} className="bg-[#0b1020] text-white">
                      {action.name}
                    </option>
                  ))}
                </select>
              </span>
            </label>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1.32fr)]">
        <Surface className="p-4 sm:p-5">
          <CardHeader className="gap-1 p-0">
            <CardTitle className="text-base">Range summary</CardTitle>
            <CardDescription>{formatDayRangeLabel(range.from, range.to)}</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 grid gap-3 p-0">
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-sm text-muted">Tracked time</p>
              <p className="mt-1 font-mono text-2xl tracking-[-0.06em] text-white">
                {formatSegmentDuration(0, totalSeconds * 1000)}
              </p>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-sm text-muted">Activities shown</p>
              <p className="mt-1 text-2xl font-semibold text-white">{rows.length}</p>
            </div>
          </CardContent>
        </Surface>

        <Surface className="p-4 sm:p-5">
          <CardHeader className="mb-4 gap-1 p-0">
            <CardTitle className="text-base">Activities stats</CardTitle>
            <CardDescription>Time and percentage for each activity in the selected range.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            {rows.length ? (
              rows.map((row) => {
                const Icon = getActionIcon(row.actionIcon);

                return (
                  <div key={row.actionId} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="grid size-10 shrink-0 place-items-center rounded-[14px]"
                          style={{ backgroundColor: `${row.actionColor}25`, color: row.actionColor }}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{row.actionName}</p>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted">{row.percentage}% of tracked time</p>
                        </div>
                      </div>
                      <p className="font-mono text-sm text-white">{formatSegmentDuration(0, row.seconds * 1000)}</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/6">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${row.percentage}%`, backgroundColor: row.actionColor }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted">No tracked time for the selected filters yet.</p>
            )}
          </CardContent>
        </Surface>
      </div>
    </div>
  );
}
