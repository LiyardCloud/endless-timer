import type { ActionItem, CurrentState, HistoryEvent, UserRecord } from "@/lib/types";

type TimestampLike = {
  toDate: () => Date;
};

type ExportUser = Pick<UserRecord, "displayName" | "email" | "photoURL"> & {
  uid: string;
};

type ExportSegment = {
  eventId: string;
  actionId: string;
  actionName: string;
  actionColor: string;
  actionIcon: string;
  titleSnapshot: string;
  startedAt: string;
  endedAt: string;
  seconds: number;
};

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (!year || !month || !day || Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function startOfDayMs(dateKey: string) {
  return parseDateKey(dateKey)?.getTime() ?? null;
}

function endOfDayMs(dateKey: string) {
  const date = parseDateKey(dateKey);

  if (!date) {
    return null;
  }

  date.setDate(date.getDate() + 1);

  return date.getTime();
}

function timestampToIso(value?: TimestampLike | null) {
  return value ? value.toDate().toISOString() : null;
}

function serializeCurrentState(currentState: CurrentState) {
  return {
    currentTitle: currentState.currentTitle,
    currentActionId: currentState.currentActionId,
    currentActionName: currentState.currentActionName,
    currentActionColor: currentState.currentActionColor,
    currentActionIcon: currentState.currentActionIcon,
    currentHistoryEventId: currentState.currentHistoryEventId ?? null,
    currentStartedAt: timestampToIso(currentState.currentStartedAt)
  };
}

function serializeAction(action: ActionItem) {
  return {
    id: action.id,
    name: action.name,
    color: action.color,
    icon: action.icon,
    createdAt: timestampToIso(action.createdAt),
    updatedAt: timestampToIso(action.updatedAt)
  };
}

function serializeHistoryEvent(event: HistoryEvent) {
  return {
    id: event.id,
    actionId: event.actionId,
    actionName: event.actionName,
    actionColor: event.actionColor,
    actionIcon: event.actionIcon,
    titleSnapshot: event.titleSnapshot,
    userId: event.userId,
    startedAt: timestampToIso(event.startedAt),
    updatedAt: timestampToIso(event.updatedAt)
  };
}

function buildExportSegments(history: HistoryEvent[], nowMs: number, fromMs: number, toMs: number): ExportSegment[] {
  const sorted = [...history]
    .filter((event) => event.startedAt)
    .sort((left, right) => left.startedAt!.toDate().getTime() - right.startedAt!.toDate().getTime());
  const segments: ExportSegment[] = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    const startedAtMs = current.startedAt!.toDate().getTime();
    const endedAtMs = next?.startedAt?.toDate().getTime() ?? nowMs;
    const overlapStartMs = Math.max(startedAtMs, fromMs);
    const overlapEndMs = Math.min(endedAtMs, toMs);

    if (overlapEndMs <= overlapStartMs) {
      continue;
    }

    segments.push({
      eventId: current.id,
      actionId: current.actionId,
      actionName: current.actionName,
      actionColor: current.actionColor,
      actionIcon: current.actionIcon,
      titleSnapshot: current.titleSnapshot,
      startedAt: new Date(overlapStartMs).toISOString(),
      endedAt: new Date(overlapEndMs).toISOString(),
      seconds: Math.floor((overlapEndMs - overlapStartMs) / 1000)
    });
  }

  return segments;
}

export function validateExportRange(from: string, to: string) {
  const fromMs = startOfDayMs(from);
  const toMs = endOfDayMs(to);

  if (fromMs === null || toMs === null || fromMs >= toMs) {
    return null;
  }

  return {
    from,
    to,
    fromMs,
    toMs
  };
}

export function buildDataExport(params: {
  user: ExportUser;
  actions: ActionItem[];
  currentState: CurrentState;
  history: HistoryEvent[];
  from: string;
  to: string;
  nowMs?: number;
}) {
  const range = validateExportRange(params.from, params.to);

  if (!range) {
    throw new Error("Invalid export range.");
  }

  const nowMs = params.nowMs ?? Date.now();

  return {
    exportedAt: new Date(nowMs).toISOString(),
    period: {
      from: range.from,
      to: range.to
    },
    user: params.user,
    currentState: serializeCurrentState(params.currentState),
    actions: params.actions.map(serializeAction),
    historyEvents: params.history
      .filter((event) => {
        const startedAtMs = event.startedAt?.toDate().getTime();

        return !!startedAtMs && startedAtMs >= range.fromMs && startedAtMs < range.toMs;
      })
      .map(serializeHistoryEvent),
    segments: buildExportSegments(params.history, nowMs, range.fromMs, range.toMs)
  };
}
