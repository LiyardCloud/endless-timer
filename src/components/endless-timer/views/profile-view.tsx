import Image from "next/image";
import type { User } from "firebase/auth";
import { Calendar, CircleUserRound, Download, LogOut, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePwaInstall } from "@/components/pwa-provider";
import type { CurrentState } from "@/lib/types";
import { Eyebrow, Surface } from "@/components/endless-timer/ui-primitives";

export function ProfileView({
  user,
  currentState,
  actionsCount,
  historyCount,
  onSignOut,
  busy
}: {
  user: User;
  currentState: CurrentState;
  actionsCount: number;
  historyCount: number;
  onSignOut: () => void;
  busy: string | null;
}) {
  const { canInstall, isInstalled, isIos, installApp } = usePwaInstall();

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
  );
}
