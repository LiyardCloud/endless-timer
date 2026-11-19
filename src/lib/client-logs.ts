// Client diagnostics entry point. Importing this module starts launch logging.

import { startLaunchDiagnostics } from "@/lib/client-log-launch";
import {
  getBuildInfo,
  isBrowser,
  launchId,
  logClientEvent,
  readEntries,
  type ClientLogEntry
} from "@/lib/client-log-store";

export { isDisplayModeStandalone } from "@/lib/client-log-launch";
export {
  getErrorCode,
  logClientEvent,
  logClientEventOnce,
  type ClientLogEntry
} from "@/lib/client-log-store";

export type ResourceTimingLog = {
  name: string;
  startTime: number;
  duration: number;
};

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

/** Firestore snapshot metadata for logs: whether data came from the local cache / unsynced writes. */
export function getSnapshotMetaDetails(snapshot: {
  metadata: { fromCache: boolean; hasPendingWrites: boolean };
}) {
  return {
    fromCache: snapshot.metadata.fromCache,
    hasPendingWrites: snapshot.metadata.hasPendingWrites
  };
}

function groupByLaunch(entries: ClientLogEntry[]) {
  const launches = new Map<string, ClientLogEntry[]>();
  for (const entry of entries) {
    const key = entry.launchId ?? "unknown";
    const group = launches.get(key);
    if (group) group.push(entry);
    else launches.set(key, [entry]);
  }

  return [...launches.entries()].map(([id, launchEntries]) => {
    const start = launchEntries.find((entry) => entry.event === "page-load-start");
    return {
      launchId: id,
      startedAt: (start ?? launchEntries[0]).timestamp,
      buildVersion: start?.details.buildVersion ?? null,
      entries: launchEntries
    };
  });
}

export function downloadClientLogs() {
  if (!isBrowser()) return;

  logClientEvent("logs-exported");
  const data = {
    exportedAt: new Date().toISOString(),
    build: getBuildInfo(),
    currentLaunchId: launchId,
    launches: groupByLaunch(readEntries())
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `endless-timer-client-logs-${new Date().toISOString().replaceAll(":", "-")}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

startLaunchDiagnostics();
logClientEvent("client-logger-ready");
