import type { Timestamp } from "firebase/firestore";

export function formatDuration(startedAt?: Timestamp | null): string {
  if (!startedAt) {
    return "00:00:00";
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - startedAt.toDate().getTime()) / 1000)
  );

  const hours = String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

export function formatDateTime(timestamp?: Timestamp | null): string {
  if (!timestamp) {
    return "Pending sync";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp.toDate());
}
