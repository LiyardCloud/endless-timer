import Image from "next/image";
import { useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { Calendar, CircleUserRound, Copy, Download, FileDown, KeyRound, LogOut, Settings2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePwaInstall } from "@/components/pwa-provider";
import { buildDataExport } from "@/lib/export-data";
import { downloadClientLogs } from "@/lib/client-logs";
import { formatDayRangeLabel, getDefaultRange } from "@/lib/history";
import type { ActionItem, ApiKeyRecord, CurrentState, HistoryEvent } from "@/lib/types";
import { Eyebrow, Surface } from "@/components/endless-timer/ui-primitives";
import type { AnalyticsPreset, AnalyticsRange } from "@/components/endless-timer/types";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatTimestamp(value: ApiKeyRecord["createdAt"]) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(value.toDate());
}

export function ProfileView({
  user,
  currentState,
  actions,
  history,
  clockNow,
  actionsCount,
  historyCount,
  onSignOut,
  busy,
  apiKeys,
  apiKeyName,
  newApiKey,
  onApiKeyNameChange,
  onApiKeySubmit,
  onNewApiKeyDismiss,
  onRevokeApiKey
}: {
  user: User;
  currentState: CurrentState;
  actions: ActionItem[];
  history: HistoryEvent[];
  clockNow: number;
  actionsCount: number;
  historyCount: number;
  onSignOut: () => void;
  busy: string | null;
  apiKeys: ApiKeyRecord[];
  apiKeyName: string;
  newApiKey: string | null;
  onApiKeyNameChange: (name: string) => void;
  onApiKeySubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onNewApiKeyDismiss: () => void;
  onRevokeApiKey: (keyId: string) => Promise<void>;
}) {
  const { canInstall, isInstalled, isIos, installApp } = usePwaInstall();
  const [exportRange, setExportRange] = useState<AnalyticsRange>(() => ({
    preset: "today",
    ...getDefaultRange("today")
  }));

  function applyExportPreset(preset: AnalyticsPreset) {
    setExportRange({
      preset,
      ...getDefaultRange(preset)
    });
  }

  function handleExportDownload() {
    const data = buildDataExport({
      user: {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      },
      currentState,
      actions,
      history,
      from: exportRange.from,
      to: exportRange.to,
      nowMs: clockNow
    });

    downloadJson(`endless-timer-${exportRange.from}-to-${exportRange.to}.json`, data);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Surface className="p-4 sm:p-5">
        <CardHeader className="gap-3 p-0">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center overflow-hidden rounded-full border border-white/8 bg-white/4">
              {user.photoURL ? (
                <Image alt={user.displayName ?? "User"} src={user.photoURL} width={64} height={64} unoptimized />
              ) : (
                <CircleUserRound className="size-7 text-muted" />
              )}
            </div>
            <div className="min-w-0">
              <Eyebrow>Profile</Eyebrow>
              <CardTitle className="mt-1 truncate text-xl">{user.displayName ?? "Anonymous"}</CardTitle>
              <CardDescription className="mt-1 truncate">{user.email ?? "No email connected"}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="mt-5 space-y-3 p-0">
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
            <p className="text-sm text-muted">Current live action</p>
            <p className="mt-1 text-sm font-semibold text-white">{currentState.currentActionName ?? "No active action"}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-sm text-muted">Saved actions</p>
              <p className="mt-1 text-2xl font-semibold text-white">{actionsCount}</p>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-sm text-muted">History events</p>
              <p className="mt-1 text-2xl font-semibold text-white">{historyCount}</p>
            </div>
          </div>
        </CardContent>
      </Surface>

      <div className="space-y-4">
        <Surface className="p-4 sm:p-5">
          <CardHeader className="gap-1 p-0">
            <CardTitle className="text-base">Export data</CardTitle>
            <CardDescription>{formatDayRangeLabel(exportRange.from, exportRange.to)}</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 space-y-3 p-0">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="min-w-0">
                <span className="mb-1.5 block text-[0.78rem] text-muted">Range</span>
                <select
                  className="flex h-12 w-full rounded-2xl border border-border bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-border-strong focus:bg-white/7 focus:ring-4 focus:ring-ring/40"
                  value={exportRange.preset}
                  onChange={(event) => applyExportPreset(event.target.value as AnalyticsPreset)}
                >
                  <option value="today" className="bg-[#0b1020] text-white">
                    Today
                  </option>
                  <option value="7d" className="bg-[#0b1020] text-white">
                    Last 7 days
                  </option>
                  <option value="30d" className="bg-[#0b1020] text-white">
                    Last 30 days
                  </option>
                  <option value="custom" className="bg-[#0b1020] text-white">
                    Custom
                  </option>
                </select>
              </label>
              <label className="min-w-0">
                <span className="mb-1.5 block text-[0.78rem] text-muted">From</span>
                <Input
                  type="date"
                  value={exportRange.from}
                  onChange={(event) =>
                    setExportRange((current) => ({
                      ...current,
                      preset: "custom",
                      from: event.target.value
                    }))
                  }
                />
              </label>
              <label className="min-w-0">
                <span className="mb-1.5 block text-[0.78rem] text-muted">To</span>
                <Input
                  type="date"
                  value={exportRange.to}
                  onChange={(event) =>
                    setExportRange((current) => ({
                      ...current,
                      preset: "custom",
                      to: event.target.value
                    }))
                  }
                />
              </label>
            </div>
            <Button className="w-full justify-center sm:w-auto" onClick={handleExportDownload}>
              <FileDown size={15} />
              Download JSON
            </Button>
          </CardContent>
        </Surface>

        <Surface className="p-4 sm:p-5">
          <CardHeader className="gap-1 p-0">
            <CardTitle className="text-base">API access</CardTitle>
            <CardDescription>External services can export data with a personal API key.</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 space-y-4 p-0">
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={onApiKeySubmit}>
              <Input
                aria-label="API key name"
                value={apiKeyName}
                onChange={(event) => onApiKeyNameChange(event.target.value)}
                placeholder="Key name"
              />
              <Button type="submit" disabled={busy === "create-api-key"} className="shrink-0">
                <KeyRound size={15} />
                Create key
              </Button>
            </form>

            {newApiKey ? (
              <div className="rounded-[18px] border border-primary/20 bg-primary/8 p-4">
                <p className="text-sm font-semibold text-white">Copy this key now</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  It will not be shown again. Use it as a Bearer token for `GET /api/export?from=YYYY-MM-DD&to=YYYY-MM-DD`.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <code className="min-w-0 flex-1 overflow-x-auto rounded-2xl border border-white/8 bg-black/24 px-3 py-2 text-xs text-white">
                    {newApiKey}
                  </code>
                  <Button
                    variant="outline"
                    onClick={() => void navigator.clipboard.writeText(newApiKey)}
                    className="shrink-0"
                  >
                    <Copy size={15} />
                    Copy
                  </Button>
                  <Button variant="ghost" onClick={onNewApiKeyDismiss} className="shrink-0">
                    Done
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              {apiKeys.length ? (
                apiKeys.map((apiKey) => {
                  const revoked = !!apiKey.revokedAt;

                  return (
                    <div
                      key={apiKey.id}
                      className="flex flex-col gap-3 rounded-[18px] border border-white/8 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{apiKey.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
                          {revoked ? "Revoked" : "Active"} · Created {formatTimestamp(apiKey.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={revoked || busy === `revoke-api-key-${apiKey.id}`}
                        onClick={() => void onRevokeApiKey(apiKey.id)}
                      >
                        <Trash2 size={14} />
                        Revoke
                      </Button>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted">No API keys yet.</p>
              )}
            </div>
          </CardContent>
        </Surface>

        <Surface className="p-4 sm:p-5">
          <CardHeader className="gap-1 p-0">
            <CardTitle className="text-base">Diagnostics</CardTitle>
            <CardDescription>Save local loading and activity events to share during troubleshooting.</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 p-0">
            <Button className="w-full justify-center sm:w-auto" onClick={downloadClientLogs}>
              <FileDown size={15} />
              Save Logs
            </Button>
          </CardContent>
        </Surface>

        <Surface className="p-4 sm:p-5">
        <CardHeader className="gap-1 p-0">
          <CardTitle className="text-base">Account actions and layout</CardTitle>
          <CardDescription>Quick controls for this account and the current workspace shape.</CardDescription>
        </CardHeader>
        <CardContent className="mt-4 space-y-3 p-0">
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 size-4 text-muted" />
              <div>
                <p className="text-sm font-semibold text-white">Mobile-first navigation</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Home focuses on timer plus actions, while timeline, analytics, and profile each live on their own screen.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-start gap-3">
              <Settings2 className="mt-0.5 size-4 text-muted" />
              <div>
                <p className="text-sm font-semibold text-white">Google-only account</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Authentication stays Google-only, matching the current MVP product rules.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-start gap-3">
              <Download className="mt-0.5 size-4 text-muted" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Install app</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {isInstalled
                    ? "EndlessTimer is already installed on this device."
                    : canInstall
                      ? "Add EndlessTimer to your home screen for quicker access and a standalone app feel."
                      : isIos
                        ? "On iPhone or iPad, use Share and then Add to Home Screen to install this app."
                        : "The install button appears once your browser says this page is eligible for app install."}
                </p>
                {canInstall ? (
                  <Button className="mt-3" onClick={() => void installApp()}>
                    <Download size={15} />
                    Install app
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
          <Button className="w-full justify-center sm:w-auto" onClick={onSignOut} disabled={busy === "sign-out"}>
            <LogOut size={15} />
            Sign out
          </Button>
        </CardContent>
        </Surface>
      </div>
    </div>
  );
}
