const STORAGE_KEY = "endless-timer-client-logs-v1";
const MAX_ENTRIES = 200;

type ClientLogDetails = Record<string, boolean | number | string | null | undefined>;

export type ClientLogEntry = {
  event: string;
  timestamp: string;
  navigationElapsedMs: number;
  page: string;
  details: ClientLogDetails;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function readEntries(): ClientLogEntry[] {
  if (!isBrowser()) return [];

  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: ClientLogEntry[]) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // Logging must not affect the application if browser storage is unavailable.
  }
}

export function logClientEvent(event: string, details: ClientLogDetails = {}) {
  if (!isBrowser()) return;

  const entry: ClientLogEntry = {
    event,
    timestamp: new Date().toISOString(),
    navigationElapsedMs: Math.round(performance.now()),
    page: window.location.pathname,
    details
  };

  const entries = readEntries();
  entries.push(entry);
  saveEntries(entries);
  console.info("[client-log]", entry);
}

export function recordPageLoadStart() {
  if (!isBrowser()) return;

  const entry: ClientLogEntry = {
    event: "page-load-start",
    timestamp: new Date(performance.timeOrigin).toISOString(),
    navigationElapsedMs: 0,
    page: window.location.pathname,
    details: {}
  };

  const entries = readEntries();
  entries.push(entry);
  saveEntries(entries);
  console.info("[client-log]", entry);
}

export function downloadClientLogs() {
  if (!isBrowser()) return;

  logClientEvent("logs-exported");
  const data = { exportedAt: new Date().toISOString(), entries: readEntries() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `endless-timer-client-logs-${new Date().toISOString().replaceAll(":", "-")}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

recordPageLoadStart();
logClientEvent("client-logger-ready");
