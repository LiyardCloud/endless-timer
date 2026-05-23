import Image from "next/image";
import Link from "next/link";
import type { User } from "firebase/auth";
import { CircleUserRound, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { firebaseConfigured } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { navItems, pageDescription } from "@/components/endless-timer/constants";
import type { AppPage } from "@/components/endless-timer/types";
import { Eyebrow } from "@/components/endless-timer/ui-primitives";

export function SignedOutState({
  authLoading,
  busy,
  errorMessage,
  onGoogleSignIn
}: {
  authLoading: boolean;
  busy: string | null;
  errorMessage: string | null;
  onGoogleSignIn: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-6 sm:px-6">
      <Card className="grid w-full gap-6 rounded-[28px] border-white/8 bg-[#0b0f17]/90 p-5 shadow-none sm:p-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-4">
          <Eyebrow>EndlessTimer</Eyebrow>
          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-5xl">
              Track one live timer with a calmer, mobile-first workspace.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Sign in with Google to access your actions, daily timeline, analytics, and profile.
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-3">
          {!firebaseConfigured ? (
            <Card className="rounded-[1.4rem] border-amber-200/15 bg-amber-300/8 p-5 shadow-none">
              <CardHeader className="gap-1 p-0">
                <CardTitle>Firebase config required</CardTitle>
                <CardDescription>
                  Fill in `.env.local` from `.env.example` with your Firebase web app values.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}
          {errorMessage ? (
            <Card className="rounded-[1.4rem] border-destructive/25 bg-destructive/8 p-5 shadow-none">
              <CardHeader className="gap-1 p-0">
                <CardTitle>Something failed</CardTitle>
                <CardDescription>{errorMessage}</CardDescription>
              </CardHeader>
            </Card>
          ) : null}
          <Card className="rounded-[1.4rem] border-white/8 bg-white/4 p-5 shadow-none">
            <CardContent className="space-y-3 p-0">
              <Button
                className="w-full"
                onClick={onGoogleSignIn}
                disabled={!firebaseConfigured || authLoading || busy === "sign-in"}
              >
                {authLoading ? "Checking session..." : "Sign in with Google"}
              </Button>
              <p className="text-sm text-muted">Authentication is required to use the app.</p>
            </CardContent>
          </Card>
        </div>
      </Card>
    </main>
  );
}

export function Header({
  page,
  user
}: {
  page: AppPage;
  user: User;
}) {
  return (
    <header className="flex items-center justify-between gap-4 rounded-[24px] border border-white/8 bg-black/15 px-4 py-3.5 backdrop-blur sm:px-5 lg:hidden">
      <div className="min-w-0">
        <Eyebrow>EndlessTimer</Eyebrow>
        <p className="mt-1 text-sm text-muted">{pageDescription(page)}</p>
      </div>
      <div className="grid size-11 place-items-center overflow-hidden rounded-full border border-border bg-white/4">
        {user.photoURL ? (
          <Image alt={user.displayName ?? "User"} src={user.photoURL} width={44} height={44} unoptimized />
        ) : (
          <CircleUserRound className="size-5 text-muted" />
        )}
      </div>
    </header>
  );
}

export function DesktopSidebar({
  page,
  user
}: {
  page: AppPage;
  user: User;
}) {
  return (
    <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] min-h-[720px] rounded-[28px] border border-white/8 bg-[#090d15]/82 p-5 backdrop-blur lg:flex lg:w-[260px] lg:flex-col">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-white/6">
          <Clock3 className="size-5 text-white/90" />
        </div>
        <div>
          <Eyebrow>EndlessTimer</Eyebrow>
          <p className="mt-1 text-sm text-muted">Personal activity tracking</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.page === page;

          return (
            <Link
              key={item.page}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[18px] px-3.5 py-3 text-sm font-medium transition-colors",
                active ? "bg-white/9 text-white" : "text-muted hover:bg-white/5 hover:text-white/92"
              )}
            >
              <Icon className="size-4.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center overflow-hidden rounded-full border border-border bg-white/4">
            {user.photoURL ? (
              <Image alt={user.displayName ?? "User"} src={user.photoURL} width={44} height={44} unoptimized />
            ) : (
              <CircleUserRound className="size-5 text-muted" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.displayName ?? "Anonymous"}</p>
            <p className="truncate text-xs text-muted">{user.email ?? "No email"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileBottomNav({ page }: { page: AppPage }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-[#080b12]/94 px-2 pb-[calc(0.6rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.page === page;

          return (
            <Link
              key={item.page}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[11px] font-medium transition-colors",
                active ? "bg-white/10 text-white" : "text-muted"
              )}
            >
              <Icon className="size-4.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
