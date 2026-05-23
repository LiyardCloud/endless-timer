import type { HistoryEvent } from "@/lib/types";

export function formatSegmentDuration(startMs: number, endMs: number) {
  const elapsedSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
  const hours = String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

export function formatDateTimeLocalValue(value: number | Date) {
  const date = typeof value === "number" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function parseDateTimeLocalValue(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function formatDateInputLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-");

  if (!year || !month || !day) {
    return dateKey;
  }

  return `${month}/${day}/${year}`;
}

export function getHistoryNeighbors(history: HistoryEvent[], eventId: string) {
  const sorted = [...history]
    .filter((event) => event.startedAt)
    .sort((left, right) => left.startedAt!.toDate().getTime() - right.startedAt!.toDate().getTime());
  const index = sorted.findIndex((event) => event.id === eventId);

  if (index === -1) {
    return {
      previousEvent: null,
      nextEvent: null
    };
  }

  return {
    previousEvent: sorted[index - 1] ?? null,
    nextEvent: sorted[index + 1] ?? null
  };
}
