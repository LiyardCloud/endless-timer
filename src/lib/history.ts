import type { CurrentState, HistoryEvent } from "@/lib/types";

type ActivitySegment = HistoryEvent & {
  startMs: number;
  endMs: number;
};

type AnalyticsRow = {
  actionId: string;
  actionName: string;
  actionColor: string;
  actionIcon: string;
  seconds: number;
  percentage: number;
};

function parseDateInput(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDayMs(dateKey: string) {
  return parseDateInput(dateKey).getTime();
}

function endOfDayMs(dateKey: string) {
  const nextDay = parseDateInput(dateKey);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.getTime();
}

export function getTodayKey() {
  return formatInputDate(Date.now());
}

export function formatInputDate(value: number | Date) {
  const date = typeof value === "number" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shiftDateKey(dateKey: string, offsetDays: number) {
  const nextDate = parseDateInput(dateKey);
  nextDate.setDate(nextDate.getDate() + offsetDays);
  return formatInputDate(nextDate);
}

export function formatDayHeading(dateKey: string) {
  const todayKey = getTodayKey();
  const tomorrowKey = shiftDateKey(todayKey, 1);
  const yesterdayKey = shiftDateKey(todayKey, -1);

  if (dateKey === todayKey) {
    return "Today";
  }

  if (dateKey === yesterdayKey) {
    return "Yesterday";
  }

  if (dateKey === tomorrowKey) {
    return "Tomorrow";
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(parseDateInput(dateKey));
}

export function formatDayRangeLabel(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  if (from === to) {
    return formatter.format(parseDateInput(from));
  }

  return `${formatter.format(parseDateInput(from))} to ${formatter.format(parseDateInput(to))}`;
}

export function formatTimeOfDay(timestampMs: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestampMs));
}

export function getDefaultRange(preset: "today" | "7d" | "30d" | "custom") {
  const today = new Date();
  const to = formatInputDate(today);
  const fromDate = new Date(today);

  if (preset === "7d") {
    fromDate.setDate(today.getDate() - 6);
  } else if (preset === "30d") {
    fromDate.setDate(today.getDate() - 29);
  }

  const from = preset === "today" ? to : formatInputDate(fromDate);

  return {
    from,
    to
  };
}

export function buildActivitySegments(history: HistoryEvent[], currentState: CurrentState, nowMs: number): ActivitySegment[] {
  const sorted = [...history]
    .filter((event) => event.startedAt)
    .sort((left, right) => left.startedAt!.toDate().getTime() - right.startedAt!.toDate().getTime());

  const segments: ActivitySegment[] = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    const startMs = current.startedAt!.toDate().getTime();
    const isLastSegment = index === sorted.length - 1;
    const endMs = next?.startedAt
      ? next.startedAt.toDate().getTime()
      : isLastSegment && currentState.currentStartedAt
        ? nowMs
        : startMs;

    segments.push({
      ...current,
      startMs,
      endMs
    });
  }

  return segments.reverse();
}

export function buildAnalyticsRows(
  history: HistoryEvent[],
  currentState: CurrentState,
  nowMs: number,
  from: string,
  to: string,
  selectedActionId: string
): AnalyticsRow[] {
  const fromMs = startOfDayMs(from);
  const toMs = endOfDayMs(to);
  const segments = buildActivitySegments(history, currentState, nowMs);
  const totals = new Map<string, Omit<AnalyticsRow, "percentage">>();

  for (const segment of segments) {
    if (selectedActionId !== "all" && segment.actionId !== selectedActionId) {
      continue;
    }

    const overlapMs = Math.max(0, Math.min(segment.endMs, toMs) - Math.max(segment.startMs, fromMs));

    if (overlapMs <= 0) {
      continue;
    }

    const seconds = Math.floor(overlapMs / 1000);
    const previous = totals.get(segment.actionId);

    totals.set(segment.actionId, {
      actionId: segment.actionId,
      actionName: segment.actionName,
      actionColor: segment.actionColor,
      actionIcon: segment.actionIcon,
      seconds: (previous?.seconds ?? 0) + seconds
    });
  }

  const rows = [...totals.values()].sort((left, right) => right.seconds - left.seconds);
  const totalSeconds = rows.reduce((sum, row) => sum + row.seconds, 0);

  return rows.map((row) => ({
    ...row,
    percentage: totalSeconds ? Math.round((row.seconds / totalSeconds) * 100) : 0
  }));
}
