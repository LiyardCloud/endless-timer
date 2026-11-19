// Persistent client log storage: a localStorage ring buffer that survives PWA cold starts.
// Every entry carries the launchId of the page load that wrote it.

const STORAGE_KEY = "endless-timer-client-logs-v2";
const MAX_ENTRIES = 500;
const MAX_LAUNCHES = 10;

export type ClientLogPrimitive = boolean | number | string | null | undefined;
export type ClientLogDetails = Record<
  string,
  ClientLogPrimitive | Array<Record<string, ClientLogPrimitive>>
>;

export type ClientLogEntry = {
  launchId: string;
  event: string;
  timestamp: string;
  navigationElapsedMs: number;
  page: string;
  details: ClientLogDetails;
};

export function isBrowser() {
  return typeof window !== "undefined";
}

function createLaunchId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID().slice(0, 8);
    }
  } catch {
    // Fall through to Math.random.
  }
  return Math.random().toString(36).slice(2, 10);
}

/** Random id generated once per page load (module evaluation). */
export const launchId = createLaunchId();

/** Build identity: short commit SHA on Vercel, otherwise "local". */
export function getBuildInfo() {
  const sha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
  return {
    version: sha ? sha.slice(0, 7) : "local",
    vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV ?? null
  };
}

export function readEntries(): ClientLogEntry[] {
  if (!isBrowser()) return [];

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Keeps the last MAX_LAUNCHES launches and at most MAX_ENTRIES entries, dropping oldest first. */
function trimEntries(entries: ClientLogEntry[]) {
  const launchOrder: string[] = [];
  for (const entry of entries) {
    if (!launchOrder.includes(entry.launchId)) launchOrder.push(entry.launchId);
  }

  const keptLaunches = new Set(launchOrder.slice(-MAX_LAUNCHES));
  return entries.filter((entry) => keptLaunches.has(entry.launchId)).slice(-MAX_ENTRIES);
}

function saveEntries(entries: ClientLogEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimEntries(entries)));
  } catch {
    // Logging must not affect the application if browser storage is unavailable or full.
  }
}

export function appendEntry(entry: Omit<ClientLogEntry, "launchId">) {
  if (!isBrowser()) return;

  const fullEntry: ClientLogEntry = { launchId, ...entry };
  const entries = readEntries();
  entries.push(fullEntry);
  saveEntries(entries);
  console.info("[client-log]", fullEntry);
}

export function logClientEvent(event: string, details: ClientLogDetails = {}) {
  if (!isBrowser()) return;

  appendEntry({
    event,
    timestamp: new Date().toISOString(),
    navigationElapsedMs: Math.round(performance.now()),
    page: window.location.pathname,
    details
  });
}

const loggedOnce = new Set<string>();

/** Logs an event at most once per launch (e.g. a milestone reached from a component that can remount). */
export function logClientEventOnce(event: string, details: ClientLogDetails = {}) {
  if (loggedOnce.has(event)) return;
  loggedOnce.add(event);
  logClientEvent(event, details);
}

export function truncate(value: string, maxLength = 200) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

/** Firebase-style error code (e.g. "auth/popup-blocked"), or null. */
export function getErrorCode(error: unknown): string | null {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : null;
}
