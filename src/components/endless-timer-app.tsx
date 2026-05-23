"use client";

import { usePathname } from "next/navigation";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { firebaseConfigured } from "@/lib/firebase";
import { navItems, pageDescription, pageTitle } from "@/components/endless-timer/constants";
import type { AppPage } from "@/components/endless-timer/types";
import { Eyebrow } from "@/components/endless-timer/ui-primitives";
import { EndlessTimerDialogs } from "@/components/endless-timer/dialogs";
import { DesktopSidebar, Header, MobileBottomNav, SignedOutState } from "@/components/endless-timer/shell";
import { useEndlessTimerState } from "@/components/endless-timer/use-endless-timer-state";
import { AnalyticsView } from "@/components/endless-timer/views/analytics-view";
import { HomeView } from "@/components/endless-timer/views/home-view";
import { ProfileView } from "@/components/endless-timer/views/profile-view";
import { TimelineView } from "@/components/endless-timer/views/timeline-view";

function AppContent({ page }: { page: AppPage }) {
  const state = useEndlessTimerState();

  if (!state.user) {
    return (
      <SignedOutState
        authLoading={state.authLoading}
        busy={state.busy}
        errorMessage={state.errorMessage}
        onGoogleSignIn={() => void state.handleGoogleSignIn()}
      />
    );
  }

  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-[1380px] gap-5 px-4 py-5 sm:px-5 lg:px-6">
        <DesktopSidebar page={page} user={state.user} />

        <div className="min-w-0 flex-1 pb-24 lg:pb-6">
          <Header page={page} user={state.user} />

          <div className="mt-4 space-y-4 lg:mt-0">
            {!firebaseConfigured ? (
              <Card className="rounded-[1.35rem] border-amber-200/15 bg-amber-300/8 p-5 shadow-none">
                <CardHeader className="gap-1 p-0">
                  <CardTitle>Firebase config required</CardTitle>
                  <CardDescription>
                    Fill in `.env.local` from `.env.example` with your existing Firebase web app values.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {state.errorMessage ? (
              <Card className="rounded-[1.35rem] border-destructive/25 bg-destructive/8 p-5 shadow-none">
                <CardHeader className="gap-1 p-0">
                  <CardTitle>Something failed</CardTitle>
                  <CardDescription>{state.errorMessage}</CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            <section className="space-y-4 rounded-[28px] border border-white/8 bg-[#080c14]/76 p-3.5 backdrop-blur sm:p-4 lg:min-h-[calc(100vh-3rem)] lg:p-5">
              <div className="hidden items-start justify-between gap-4 lg:flex">
                <div>
                  <Eyebrow>{navItems.find((item) => item.page === page)?.label ?? "Page"}</Eyebrow>
                  <h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                    {pageTitle(page)}
                  </h1>
                </div>
                <p className="max-w-md text-sm leading-6 text-muted">{pageDescription(page)}</p>
              </div>

              {page === "home" ? <HomeView {...state} /> : null}
              {page === "timeline" ? (
                <TimelineView
                  history={state.history}
                  actions={state.actions}
                  currentState={state.currentState}
                  clockNow={state.clockNow}
                  busy={state.busy}
                  historyEditTarget={state.historyEditTarget}
                  historyEditDraft={state.historyEditDraft}
                  onHistoryEditDraftChange={state.setHistoryEditDraft}
                  onRequestDeleteHistoryEvent={state.requestDeleteHistoryEvent}
                  onRequestEditHistoryEvent={state.requestEditHistoryEvent}
                  onCancelHistoryEdit={state.cancelHistoryEdit}
                  onSubmitHistoryEdit={state.submitHistoryEdit}
                />
              ) : null}
              {page === "analytics" ? (
                <AnalyticsView
                  history={state.history}
                  currentState={state.currentState}
                  clockNow={state.clockNow}
                  actions={state.actions}
                />
              ) : null}
              {page === "profile" ? (
                <ProfileView
                  user={state.user}
                  currentState={state.currentState}
                  actionsCount={state.actions.length}
                  historyCount={state.history.length}
                  onSignOut={() => void state.handleSignOut()}
                  busy={state.busy}
                />
              ) : null}
            </section>
          </div>
        </div>
      </main>

      <MobileBottomNav page={page} />
      <EndlessTimerDialogs state={state} />
    </>
  );
}

export function EndlessTimerApp({ page }: { page?: AppPage }) {
  const pathname = usePathname();

  const resolvedPage =
    page ??
    (pathname === "/timeline"
      ? "timeline"
      : pathname === "/analytics"
        ? "analytics"
        : pathname === "/profile"
          ? "profile"
          : "home");

  return <AppContent page={resolvedPage} />;
}
