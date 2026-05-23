import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Calendar, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getActionIcon } from "@/lib/action-icons";
import { buildActivitySegments, formatDayHeading, formatInputDate, formatTimeOfDay, getTodayKey, shiftDateKey } from "@/lib/history";
import type { ActionItem, CurrentState, HistoryEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDateInputLabel, formatSegmentDuration } from "@/components/endless-timer/helpers";
import { Field, Surface } from "@/components/endless-timer/ui-primitives";
import type { HistoryEditDraft } from "@/components/endless-timer/types";

export function TimelineView({
  history,
  actions,
  currentState,
  clockNow,
  busy,
  historyEditTarget,
  historyEditDraft,
  onHistoryEditDraftChange,
  onRequestDeleteHistoryEvent,
  onRequestEditHistoryEvent,
  onCancelHistoryEdit,
  onSubmitHistoryEdit
}: {
  history: HistoryEvent[];
  actions: ActionItem[];
  currentState: CurrentState;
  clockNow: number;
  busy: string | null;
  historyEditTarget: HistoryEvent | null;
  historyEditDraft: HistoryEditDraft;
  onHistoryEditDraftChange: (draft: HistoryEditDraft) => void;
  onRequestDeleteHistoryEvent: (event: HistoryEvent) => void;
  onRequestEditHistoryEvent: (event: HistoryEvent) => void;
  onCancelHistoryEdit: () => void;
  onSubmitHistoryEdit: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState(getTodayKey);
  const selectedDateInputRef = useRef<HTMLInputElement | null>(null);
  const segments = buildActivitySegments(history, currentState, clockNow);
  const dailySegments = segments.filter((segment) => formatInputDate(segment.startMs) === selectedDate);
  const editActionOptions =
    historyEditTarget && !actions.some((action) => action.id === historyEditTarget.actionId)
      ? [
          {
            id: historyEditTarget.actionId,
            name: `${historyEditTarget.actionName} (archived)`,
            color: historyEditTarget.actionColor,
            icon: historyEditTarget.actionIcon
          },
          ...actions
        ]
      : actions;

  function openSelectedDatePicker() {
    const input = selectedDateInputRef.current;

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
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <CardTitle className="text-lg leading-tight">{formatDayHeading(selectedDate)}</CardTitle>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <div className="relative min-w-0 sm:w-[170px]">
                <button
                  aria-label="Selected day"
                  className="flex h-9 w-full min-w-0 items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 text-left text-sm text-white"
                  onClick={openSelectedDatePicker}
                  type="button"
                >
                  <Calendar size={15} className="shrink-0 text-white/75" />
                  <span className="min-w-0 flex-1 truncate text-sm text-white">{formatDateInputLabel(selectedDate)}</span>
                </button>
                <input
                  ref={selectedDateInputRef}
                  className="pointer-events-none absolute inset-0 size-full opacity-0 [color-scheme:dark]"
                  tabIndex={-1}
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-black/18 p-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 border-white/[0.055] bg-black/20 hover:border-white/[0.09] hover:bg-black/30"
                  onClick={() => setSelectedDate((current) => shiftDateKey(current, -1))}
                >
                  <ArrowLeft size={14} />
                  <span className="sr-only">Previous day</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 border-white/[0.055] bg-black/20 hover:border-white/[0.09] hover:bg-black/30"
                  onClick={() => setSelectedDate((current) => shiftDateKey(current, 1))}
                >
                  <ArrowRight size={14} />
                  <span className="sr-only">Next day</span>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {historyEditTarget ? (
        <Surface className="p-4 sm:p-5">
          <CardHeader className="mb-4 gap-1 p-0">
            <CardTitle className="text-base">Edit timer entry</CardTitle>
            <CardDescription>
              Adjust the snapped action, title, or start time without changing how new entries are created.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-0">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Action">
                <select
                  className="flex h-12 w-full rounded-2xl border border-border bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-border-strong focus:bg-white/7 focus:ring-4 focus:ring-ring/40"
                  value={historyEditDraft.actionId}
                  onChange={(event) =>
                    onHistoryEditDraftChange({
                      ...historyEditDraft,
                      actionId: event.target.value
                    })
                  }
                >
                  {editActionOptions.map((action) => (
                    <option key={action.id} value={action.id} className="bg-[#0b1020] text-white">
                      {action.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Started at">
                <Input
                  type="datetime-local"
                  value={historyEditDraft.startedAt}
                  onChange={(event) =>
                    onHistoryEditDraftChange({
                      ...historyEditDraft,
                      startedAt: event.target.value
                    })
                  }
                />
              </Field>
            </div>
            <Field label="Title">
              <textarea
                className="min-h-28 w-full rounded-[22px] border border-border bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-border-strong focus:bg-white/7 focus:ring-4 focus:ring-ring/40"
                value={historyEditDraft.titleSnapshot}
                onChange={(event) =>
                  onHistoryEditDraftChange({
                    ...historyEditDraft,
                    titleSnapshot: event.target.value
                  })
                }
                placeholder="What were you doing?"
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={busy === `update-history-${historyEditTarget.id}`}
                onClick={() => void onSubmitHistoryEdit()}
              >
                Save entry
              </Button>
              <Button
                variant="outline"
                disabled={busy === `update-history-${historyEditTarget.id}`}
                onClick={onCancelHistoryEdit}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Surface>
      ) : null}

      <Surface className="p-4 sm:p-5">
        <CardHeader className="mb-4 gap-1 p-0">
          <CardTitle className="text-base">Timer entries</CardTitle>
          <CardDescription>Each row reflects an action selection event and its tracked span.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative space-y-2.5 before:absolute before:top-4 before:bottom-4 before:left-[6px] before:w-px before:bg-white/10">
            {dailySegments.length ? (
              dailySegments.map((segment) => {
                const Icon = getActionIcon(segment.actionIcon);
                const compact = !segment.titleSnapshot.trim();
                const isActiveEntry =
                  !!currentState.currentStartedAt &&
                  !!segment.startedAt &&
                  currentState.currentStartedAt.toDate().getTime() === segment.startedAt.toDate().getTime();
                const isEditingEntry = historyEditTarget?.id === segment.id;

                return (
                  <div className={cn("grid grid-cols-[12px_1fr] gap-3", compact && "items-center")} key={segment.id}>
                    <div className="relative z-10 flex justify-center pt-1">
                      <span
                        className="block h-2.5 w-2.5 rounded-full ring-4 ring-transparent"
                        style={{
                          backgroundColor: segment.actionColor,
                          boxShadow: `0 0 0 4px ${segment.actionColor}12`
                        }}
                        aria-hidden="true"
                      />
                    </div>
                    <div
                      className={cn(
                        "rounded-[16px] border border-white/5 bg-white/[0.018] px-3.5 py-3",
                        compact && "py-2.5",
                        isEditingEntry && "border-primary/35 bg-primary/[0.06]"
                      )}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div>
                          <strong className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Icon size={14} strokeWidth={2.2} />
                            <span>{segment.actionName}</span>
                          </strong>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                            {formatTimeOfDay(segment.startMs)} to {formatTimeOfDay(segment.endMs)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-start">
                          {isActiveEntry ? (
                            <span className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[0.73rem] uppercase tracking-[0.16em] text-primary">
                              Active
                            </span>
                          ) : null}
                          <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[0.73rem] uppercase tracking-[0.16em] text-muted">
                            {formatSegmentDuration(segment.startMs, segment.endMs)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted hover:text-white"
                            disabled={isActiveEntry || busy === `update-history-${segment.id}`}
                            onClick={() => onRequestEditHistoryEvent(segment)}
                          >
                            <Pencil size={14} />
                            <span className="sr-only">Edit timer entry</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted hover:text-destructive"
                            disabled={
                              isActiveEntry ||
                              busy === `delete-history-${segment.id}` ||
                              busy === `update-history-${segment.id}`
                            }
                            onClick={() => onRequestDeleteHistoryEvent(segment)}
                          >
                            <Trash2 size={14} />
                            <span className="sr-only">Remove timer entry</span>
                          </Button>
                        </div>
                      </div>
                      {compact ? null : <p className="mt-2 text-sm leading-6 text-muted">{segment.titleSnapshot}</p>}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted">No timer entries for this day yet.</p>
            )}
          </div>
        </CardContent>
      </Surface>
    </div>
  );
}
