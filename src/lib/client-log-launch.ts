// Per-launch diagnostics: launch context, Navigation/Resource Timing, visibility and global errors.

import {
  appendEntry,
  getBuildInfo,
  getErrorCode,
  isBrowser,
  logClientEvent,
  truncate,
  type ClientLogDetails
} from "@/lib/client-log-store";

const MAX_ERROR_LOGS_PER_LAUNCH = 20;

const round = (value: number) => Math.round(value);
const span = (start: number, end: number) => (start > 0 && end >= start ? round(end - start) : null);

export function isDisplayModeStandalone() {
  if (!isBrowser()) return false;

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    navigatorWithStandalone.standalone === true
  );
}

function getNavigationEntry(): PerformanceNavigationTiming | null {
  try {
    const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    return entry ?? null;
  } catch {
    return null;
  }
}

function getLaunchContext(): ClientLogDetails {
  const connection = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; downlink?: number; rtt?: number };
    }
  ).connection;
  const build = getBuildInfo();

  return {
    buildVersion: build.version,
    vercelEnv: build.vercelEnv,
    displayModeStandalone: isDisplayModeStandalone(),
    online: navigator.onLine,
    connectionEffectiveType: connection?.effectiveType,
    connectionDownlinkMbps: connection?.downlink,
    connectionRttMs: connection?.rtt,
    visibilityState: document.visibilityState,
    serviceWorkerControlled: Boolean(navigator.serviceWorker?.controller),
    navigationType: getNavigationEntry()?.type ?? null
  };
}

function recordPageLoadStart() {
  appendEntry({
    event: "page-load-start",
    timestamp: new Date(performance.timeOrigin).toISOString(),
    navigationElapsedMs: 0,
    page: window.location.pathname,
    details: getLaunchContext()
  });
}

function getNavigationTimingDetails(): ClientLogDetails {
  const nav = getNavigationEntry();
  if (!nav) return { available: false };

  const extended = nav as PerformanceNavigationTiming & { deliveryType?: string };

  return {
    available: true,
    navigationType: nav.type,
    redirectMs: span(nav.redirectStart, nav.redirectEnd),
    // Time from the service worker starting up until it handed the request to fetch.
    serviceWorkerStartupMs: nav.workerStart > 0 ? span(nav.workerStart, nav.fetchStart) : null,
    dnsMs: span(nav.domainLookupStart, nav.domainLookupEnd),
    connectMs: span(nav.connectStart, nav.connectEnd),
    tlsMs: span(nav.secureConnectionStart, nav.connectEnd),
    requestToTtfbMs: span(nav.requestStart, nav.responseStart),
    responseDownloadMs: span(nav.responseStart, nav.responseEnd),
    fetchStartMs: round(nav.fetchStart),
    responseEndMs: round(nav.responseEnd),
    domInteractiveMs: round(nav.domInteractive),
    domContentLoadedMs: round(nav.domContentLoadedEventEnd),
    loadMs: round(nav.loadEventEnd),
    transferSize: nav.transferSize,
    encodedBodySize: nav.encodedBodySize,
    deliveryType: extended.deliveryType ?? null,
    nextHopProtocol: nav.nextHopProtocol || null
  };
}

function getChunkSummary(): ClientLogDetails {
  let resources: PerformanceResourceTiming[] = [];
  try {
    resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  } catch {
    return {};
  }

  const chunks = resources
    .map((entry) => {
      try {
        return { entry, path: new URL(entry.name).pathname };
      } catch {
        return null;
      }
    })
    .filter((item): item is { entry: PerformanceResourceTiming; path: string } =>
      Boolean(item?.path.startsWith("/_next/static/"))
    );

  const slowest = [...chunks]
    .sort((a, b) => b.entry.duration - a.entry.duration)
    .slice(0, 3)
    .map(({ entry, path }) => ({
      name: path.replace("/_next/static/", ""),
      startTime: round(entry.startTime),
      duration: round(entry.duration),
      transferSize: entry.transferSize
    }));

  return {
    chunkCount: chunks.length,
    chunkTotalDurationMs: round(chunks.reduce((sum, { entry }) => sum + entry.duration, 0)),
    chunkLastResponseEndMs: round(chunks.reduce((max, { entry }) => Math.max(max, entry.responseEnd), 0)),
    chunkTransferBytes: chunks.reduce((sum, { entry }) => sum + entry.transferSize, 0),
    chunksFromCache: chunks.filter(({ entry }) => entry.transferSize === 0).length,
    slowestChunks: slowest
  };
}

function scheduleLoadTiming() {
  // loadEventEnd is only set after the load handlers have returned, hence the extra tick.
  const logTiming = () =>
    window.setTimeout(() => {
      logClientEvent("page-load-timing", { ...getNavigationTimingDetails(), ...getChunkSummary() });
    }, 0);

  if (document.readyState === "complete") {
    logTiming();
  } else {
    window.addEventListener("load", logTiming, { once: true });
  }
}

function describeSource(filename: string | undefined, line?: number, column?: number) {
  if (!filename) return null;
  let location = filename;
  try {
    const url = new URL(filename);
    location = `${url.host}${url.pathname}`;
  } catch {
    // Keep the raw filename.
  }
  return truncate(`${location}:${line ?? 0}:${column ?? 0}`);
}

function installListeners() {
  let hiddenAt: number | null = document.visibilityState === "hidden" ? performance.now() : null;

  document.addEventListener("visibilitychange", () => {
    const state = document.visibilityState;
    if (state === "hidden") {
      hiddenAt = performance.now();
      logClientEvent("visibility-hidden");
    } else {
      logClientEvent("visibility-visible", {
        hiddenForMs: hiddenAt === null ? null : round(performance.now() - hiddenAt)
      });
      hiddenAt = null;
    }
  });

  // The initial load is never a bfcache restore (modules do not re-run on one), so a
  // `persisted: true` pageshow marks a later restore of this same launch.
  window.addEventListener("pageshow", (event) => {
    logClientEvent("pageshow", { persisted: event.persisted });
  });

  let errorCount = 0;
  const canLogError = () => ++errorCount <= MAX_ERROR_LOGS_PER_LAUNCH;

  window.addEventListener("error", (event) => {
    if (!canLogError()) return;
    logClientEvent("window-error", {
      message: truncate(event.message || String(event.error ?? "unknown")),
      source: describeSource(event.filename, event.lineno, event.colno)
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (!canLogError()) return;
    const reason: unknown = event.reason;
    logClientEvent("unhandled-rejection", {
      message: truncate(reason instanceof Error ? reason.message : String(reason)),
      source: reason instanceof Error ? reason.name : typeof reason,
      code: getErrorCode(reason)
    });
  });
}

let started = false;

/** Records page-load-start with launch context and installs launch listeners (once per page load). */
export function startLaunchDiagnostics() {
  if (!isBrowser() || started) return;
  started = true;

  try {
    recordPageLoadStart();
    installListeners();
    scheduleLoadTiming();
  } catch {
    // Diagnostics must never break the app.
  }
}
