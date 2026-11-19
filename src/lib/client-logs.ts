const STORAGE_KEY = "endless-timer-client-logs-v1";
const MAX_ENTRIES = 200;

type ClientLogPrimitive = boolean | number | string | null | undefined;
type ClientLogDetails = Record<string, ClientLogPrimitive | Array<Record<string, ClientLogPrimitive>>>;

export type ResourceTimingLog = {
  name: string;
  startTime: number;
  duration: number;
};

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

const AUTH_RESOURCE_HOSTS = [
  "apis.google.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com"
];

/** Resource Timing entries for Firebase Auth network requests (gapi, authDomain, token APIs). */
export function getAuthResourceTimings(authDomain?: string): ResourceTimingLog[] {
  if (!isBrowser() || typeof performance.getEntriesByType !== "function") return [];

  const timings: ResourceTimingLog[] = [];

  for (const entry of performance.getEntriesByType("resource")) {
    let url: URL;
    try {
      url = new URL(entry.name);
    } catch {
      continue;
    }

    const isAuthHost = AUTH_RESOURCE_HOSTS.includes(url.host);
    const isAuthDomainHandler =
      url.pathname.startsWith("/__/auth/") && (!authDomain || url.host === authDomain);

    if (!isAuthHost && !isAuthDomainHandler) continue;

    timings.push({
      name: `${url.host}${url.pathname}`,
      startTime: Math.round(entry.startTime),
      duration: Math.round(entry.duration)
    });
  }

  return timings;
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
