"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, onSnapshot, type DocumentData, type QueryDocumentSnapshot } from "firebase/firestore";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calendar,
  CircleUserRound,
  Clock3,
  House,
  LogOut,
  Pencil,
  Plus,
  Rows3,
  Settings2,
  Trash2
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ACTION_COLORS } from "@/lib/default-actions";
import { auth, db, firebaseConfigured, googleProvider } from "@/lib/firebase";
import {
  actionsQuery,
  bootstrapUser,
  createAction,
  historyQuery,
  removeAction,
  removeHistoryEvent,
  saveCurrentTitle,
  selectAction,
  updateAction
} from "@/lib/firestore";
import { getActionIcon, normalizeActionIconName } from "@/lib/action-icons";
import {
  buildActivitySegments,
  buildAnalyticsRows,
  formatDayHeading,
  formatDayRangeLabel,
  formatInputDate,
  formatTimeOfDay,
  getDefaultRange,
  getTodayKey,
  shiftDateKey
} from "@/lib/history";
import { formatDuration } from "@/lib/format";
import type { ActionItem, CurrentState, HistoryEvent, UserRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

const emptyCurrentState: CurrentState = {
  currentTitle: "",
  currentActionId: null,
  currentActionName: null,
  currentActionColor: null,
  currentActionIcon: null,
  currentStartedAt: null
};

type AppPage = "home" | "timeline" | "analytics" | "profile";
type ActionMode = "select" | "create" | "change" | "remove";
type AnalyticsPreset = "today" | "7d" | "30d" | "custom";

type ActionDraft = {
  id: string | null;
  name: string;
  color: string;
  icon: string;
};

type AnalyticsRange = {
  preset: AnalyticsPreset;
  from: string;
  to: string;
};

const emptyDraft: ActionDraft = {
  id: null,
  name: "",
  color: ACTION_COLORS[0],
  icon: "brain"
};

const navItems: Array<{ page: AppPage; href: string; label: string; icon: typeof House }> = [
  { page: "home", href: "/", label: "Home", icon: House },
  { page: "timeline", href: "/timeline", label: "Timeline", icon: Rows3 },
  { page: "analytics", href: "/analytics", label: "Analytics", icon: BarChart3 },
  { page: "profile", href: "/profile", label: "Profile", icon: CircleUserRound }
];

function mapAction(docSnapshot: QueryDocumentSnapshot<DocumentData>): ActionItem {
  const data = docSnapshot.data();

  return {
    id: docSnapshot.id,
    name: data.name,
    color: data.color,
    icon: normalizeActionIconName(data.icon ?? "brain"),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null
  };
}

function mapHistory(docSnapshot: QueryDocumentSnapshot<DocumentData>): HistoryEvent {
  const data = docSnapshot.data();

  return {
    id: docSnapshot.id,
    actionId: data.actionId,
    actionName: data.actionName,
    actionColor: data.actionColor,
    actionIcon: normalizeActionIconName(data.actionIcon ?? "brain"),
    titleSnapshot: data.titleSnapshot ?? "",
    userId: data.userId,
    startedAt: data.startedAt ?? null
  };
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">
      {children}
    </span>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function Surface({
  className,
  style,
  children
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Card
      className={cn("overflow-hidden rounded-[22px] border-white/8 bg-white/[0.035] shadow-none", className)}
      style={style}
    >
      {children}
    </Card>
  );
}

function formatSegmentDuration(startMs: number, endMs: number) {
  const elapsedSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
  const hours = String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function pageDescription(page: AppPage) {
  switch (page) {
    case "home":
      return "Current timer and action switcher";
    case "timeline":
      return "Daily timer entries and activity flow";
    case "analytics":
      return "Time breakdowns, percentages, and filters";
    case "profile":
      return "Account, app actions, and workspace details";
  }
}

function useEndlessTimerState() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<CurrentState>(emptyCurrentState);
  const [titleDraft, setTitleDraft] = useState("");
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [actionDraft, setActionDraft] = useState<ActionDraft>(emptyDraft);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>("select");
  const [clockNow, setClockNow] = useState(Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionDeleteTarget, setActionDeleteTarget] = useState<ActionItem | null>(null);
  const [historyDeleteTarget, setHistoryDeleteTarget] = useState<HistoryEvent | null>(null);
  const titleSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hydratedTitleRef = useRef(false);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
      setErrorMessage(null);

      if (!nextUser) {
        setActions([]);
        setHistory([]);
        setCurrentState(emptyCurrentState);
        setTitleDraft("");
        hydratedTitleRef.current = false;
        return;
      }

      try {
        await bootstrapUser(nextUser);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to bootstrap user.";
        setErrorMessage(message);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) {
      return;
    }

    const unsubscribeUser = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      const data = snapshot.data() as UserRecord | undefined;

      if (!data) {
        setCurrentState(emptyCurrentState);
        setTitleDraft("");
        return;
      }

      const nextState: CurrentState = {
        currentTitle: data.currentTitle ?? "",
        currentActionId: data.currentActionId ?? null,
        currentActionName: data.currentActionName ?? null,
        currentActionColor: data.currentActionColor ?? null,
        currentActionIcon: data.currentActionIcon ? normalizeActionIconName(data.currentActionIcon) : null,
        currentStartedAt: data.currentStartedAt ?? null
      };

      setCurrentState(nextState);

      if (!hydratedTitleRef.current || busy === "select-action") {
        setTitleDraft(nextState.currentTitle);
        hydratedTitleRef.current = true;
      }
    });

    const unsubscribeActions = onSnapshot(actionsQuery(user.uid), (snapshot) => {
      setActions(snapshot.docs.map(mapAction));
    });

    const unsubscribeHistory = onSnapshot(historyQuery(user.uid), (snapshot) => {
      setHistory(snapshot.docs.map(mapHistory));
    });

    return () => {
      unsubscribeUser();
      unsubscribeActions();
      unsubscribeHistory();
    };
  }, [user, busy]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user || !hydratedTitleRef.current || titleDraft === currentState.currentTitle) {
      return;
    }

    if (titleSaveTimeoutRef.current) {
      clearTimeout(titleSaveTimeoutRef.current);
    }

    titleSaveTimeoutRef.current = setTimeout(() => {
      void saveCurrentTitle(user.uid, titleDraft).catch((error) => {
        const message = error instanceof Error ? error.message : "Failed to save title.";
        setErrorMessage(message);
      });
    }, 450);

    return () => {
      if (titleSaveTimeoutRef.current) {
        clearTimeout(titleSaveTimeoutRef.current);
      }
    };
  }, [currentState.currentTitle, titleDraft, user]);

  function openCreateMode() {
    setActionMode("create");
    setEditingActionId(null);
    setActionDraft(emptyDraft);
  }

  function openChangeMode() {
    setActionMode((current) => (current === "change" ? "select" : "change"));
    setEditingActionId(null);
    setActionDraft(emptyDraft);
  }

  function openRemoveMode() {
    setActionMode((current) => (current === "remove" ? "select" : "remove"));
    setEditingActionId(null);
    setActionDraft(emptyDraft);
  }

  function resetActionEditor() {
    setEditingActionId(null);
    setActionDraft(emptyDraft);
    setActionMode("select");
  }

  async function handleGoogleSignIn() {
    if (!auth || !googleProvider) {
      return;
    }

    try {
      setBusy("sign-in");
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign-in failed.";
      setErrorMessage(message);
    } finally {
      setBusy(null);
    }
  }

  async function handleSignOut() {
    if (!auth) {
      return;
    }

    try {
      setBusy("sign-out");
      await signOut(auth);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign-out failed.";
      setErrorMessage(message);
    } finally {
      setBusy(null);
    }
  }

  async function handleActionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !actionDraft.name.trim()) {
      return;
    }

    try {
      setBusy("save-action");

      if (editingActionId) {
        await updateAction(user.uid, editingActionId, {
          name: actionDraft.name.trim(),
          color: actionDraft.color,
          icon: normalizeActionIconName(actionDraft.icon)
        });
      } else {
        await createAction(user.uid, {
          name: actionDraft.name.trim(),
          color: actionDraft.color,
          icon: normalizeActionIconName(actionDraft.icon)
        });
      }

      resetActionEditor();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save action.";
      setErrorMessage(message);
    } finally {
      setBusy(null);
    }
  }

  function startEditingAction(action: ActionItem) {
    setEditingActionId(action.id);
    setActionDraft({
      id: action.id,
      name: action.name,
      color: action.color,
      icon: normalizeActionIconName(action.icon)
    });
    setActionMode("select");
  }

  function requestDeleteAction(action: ActionItem) {
    if (currentState.currentActionId === action.id) {
      setErrorMessage("Choose another current action before deleting this one.");
      return;
    }

    setActionDeleteTarget(action);
  }

  async function confirmDeleteAction() {
    if (!user || !actionDeleteTarget) {
      return;
    }

    try {
      setBusy(`delete-action-${actionDeleteTarget.id}`);
      await removeAction(user.uid, actionDeleteTarget.id);
      setActionMode("select");
      setActionDeleteTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete action.";
      setErrorMessage(message);
    } finally {
      setBusy(null);
    }
  }

  function requestDeleteHistoryEvent(event: HistoryEvent) {
    const currentStartedAtMs = currentState.currentStartedAt?.toDate().getTime();
    const eventStartedAtMs = event.startedAt?.toDate().getTime();

    if (currentStartedAtMs && eventStartedAtMs && currentStartedAtMs === eventStartedAtMs) {
      setErrorMessage("Switch to another action before deleting the active timer entry.");
      return;
    }

    setHistoryDeleteTarget(event);
  }

  async function confirmDeleteHistoryEvent() {
    if (!user || !historyDeleteTarget) {
      return;
    }

    try {
      setBusy(`delete-history-${historyDeleteTarget.id}`);
      await removeHistoryEvent(user.uid, historyDeleteTarget.id);
      setHistoryDeleteTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete timer entry.";
      setErrorMessage(message);
    } finally {
      setBusy(null);
    }
  }

  async function handleActionSelection(action: ActionItem) {
    if (!user) {
      return;
    }

    if (actionMode === "change") {
      startEditingAction(action);
      return;
    }

    if (actionMode === "remove") {
      requestDeleteAction(action);
      return;
    }

    try {
      setBusy("select-action");
      const snapshotTitle = titleDraft.trim();
      await selectAction({
        userId: user.uid,
        action,
        title: snapshotTitle
      });
      setTitleDraft("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to log action event.";
      setErrorMessage(message);
    } finally {
      setBusy(null);
    }
  }

  return {
    user,
    authLoading,
    busy,
    currentState,
    titleDraft,
    setTitleDraft,
    actions,
    history,
    actionDraft,
    setActionDraft,
    editingActionId,
    actionMode,
    clockNow,
    errorMessage,
    actionDeleteTarget,
    historyDeleteTarget,
    showActionForm: actionMode === "create" || editingActionId !== null,
    interactionHint:
      actionMode === "change"
        ? "Pick an action to edit"
        : actionMode === "remove"
          ? "Pick an action to remove"
          : "Tap an action to log a new event",
    handleGoogleSignIn,
    handleSignOut,
    handleActionSubmit,
    handleActionSelection,
    openCreateMode,
    openChangeMode,
    openRemoveMode,
    resetActionEditor,
    confirmDeleteAction,
    requestDeleteHistoryEvent,
    confirmDeleteHistoryEvent,
    setActionDeleteTarget,
    setHistoryDeleteTarget
  };
}

function SignedOutState({
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

function Header({
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

function DesktopSidebar({
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

function MobileBottomNav({ page }: { page: AppPage }) {
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

function HomeView(state: ReturnType<typeof useEndlessTimerState>) {
  const timerPanelStyle = state.currentState.currentActionColor
    ? ({
        "--timer-accent": state.currentState.currentActionColor,
        background: `radial-gradient(circle at top left, ${state.currentState.currentActionColor}30, transparent 34%), linear-gradient(145deg, ${state.currentState.currentActionColor}22, #0d1016 58%, #0d1016 100%)`,
        borderColor: `${state.currentState.currentActionColor}36`
      } as CSSProperties)
    : undefined;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-6">
      <Surface className="p-[16px_18px_18px]" style={timerPanelStyle}>
        <CardHeader className="mb-1 gap-0 p-0">
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                Current action
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="line-clamp-2 max-w-[18ch] font-mono text-[clamp(1.55rem,6vw,2.15rem)] leading-[0.98] tracking-[-0.07em] text-white/95 sm:line-clamp-1 sm:max-w-none">
                {state.currentState.currentActionName ?? "No active action"}
              </CardTitle>
            </div>
            <div
              className="shrink-0 p-0 text-left"
              style={
                state.currentState.currentActionColor
                  ? {
                      color: state.currentState.currentActionColor
                    }
                  : undefined
              }
            >
              <p className="font-mono text-[clamp(2.3rem,11vw,4rem)] leading-none tracking-[-0.09em] text-foreground">
                {formatDuration(state.currentState.currentStartedAt)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="mt-4 p-0">
          <Field label="Current title">
            <Input
              className="h-auto rounded-[18px] border-border bg-white/5 px-4 py-3.5 text-[1.02rem] placeholder:text-muted/75 focus:border-primary/30 focus:bg-white/7 focus:ring-primary/20"
              placeholder="What are you doing?"
              value={state.titleDraft}
              onChange={(event) => state.setTitleDraft(event.target.value)}
            />
          </Field>
          {!state.currentState.currentActionName ? (
            <p className="mt-3 text-sm text-muted">Select an action to start the first tracked block.</p>
          ) : null}
        </CardContent>
      </Surface>

      <Surface className="border-none bg-transparent p-[4px_2px_0]">
        <CardHeader className="mb-[14px] gap-[2px] p-0 px-3 sm:px-4">
          <Eyebrow>Actions</Eyebrow>
          <CardTitle className="text-base font-semibold tracking-normal">{state.interactionHint}</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 gap-2.5 px-3 sm:grid-cols-2 sm:px-4 xl:grid-cols-3">
            {state.actions.map((action) => {
              const active = state.currentState.currentActionId === action.id;
              const Icon = getActionIcon(action.icon);

              return (
                <button
                  key={action.id}
                  className={cn(
                    "inline-flex min-h-[56px] w-full items-center justify-start gap-2 rounded-[18px] border px-4 py-3 text-left text-sm font-medium transition-all duration-150",
                    "hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55",
                    active ? "text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]" : "bg-transparent text-foreground",
                    (state.actionMode === "change" || state.actionMode === "remove") && "animate-pulse"
                  )}
                  onClick={() => void state.handleActionSelection(action)}
                  disabled={state.busy === "select-action" || state.busy === `delete-${action.id}`}
                  style={
                    {
                      borderColor: active ? `${action.color}cc` : `${action.color}59`,
                      backgroundColor: active ? `${action.color}db` : `${action.color}17`
                    } as CSSProperties
                  }
                >
                  {active ? <span className="size-1.5 rounded-full bg-white/90" aria-hidden="true" /> : null}
                  <Icon size={15} strokeWidth={2.2} />
                  <span className="truncate">{action.name}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-white/8 px-3 pt-3.5 sm:px-4">
            <div className="mb-2 flex items-center justify-center">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                Edit modes
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "min-w-[104px] bg-white/6 px-[14px] py-[10px] text-[0.85rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                  state.actionMode === "create" &&
                    "border-primary/35 bg-primary/12 text-primary shadow-[0_0_0_1px_rgba(238,243,255,0.06),inset_0_1px_0_rgba(255,255,255,0.08)]"
                )}
                onClick={state.openCreateMode}
              >
                <Plus size={15} />
                Create
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "min-w-[104px] bg-white/6 px-[14px] py-[10px] text-[0.85rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                  state.actionMode === "change" &&
                    "border-primary/35 bg-primary/12 text-primary shadow-[0_0_0_1px_rgba(238,243,255,0.06),inset_0_1px_0_rgba(255,255,255,0.08)]"
                )}
                onClick={state.openChangeMode}
              >
                <Pencil size={15} />
                Change
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "min-w-[104px] bg-white/6 px-[14px] py-[10px] text-[0.85rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                  state.actionMode === "remove" &&
                    "border-destructive/35 bg-destructive/12 text-destructive-foreground shadow-[0_0_0_1px_rgba(255,244,243,0.05),inset_0_1px_0_rgba(255,255,255,0.06)]"
                )}
                onClick={state.openRemoveMode}
              >
                <Trash2 size={15} />
                Remove
              </Button>
            </div>

            {state.showActionForm ? (
              <>
                <Separator className="mt-3.5" />
                <form className="mt-3.5 space-y-4 px-0.5" onSubmit={state.handleActionSubmit}>
                  <div className="mb-2.5 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-semibold">
                        {state.editingActionId ? "Change action" : "Create action"}
                      </h3>
                    </div>
                    <Button variant="ghost" size="sm" onClick={state.resetActionEditor}>
                      Cancel
                    </Button>
                  </div>

                  <Field label="Name">
                    <Input
                      placeholder="Action name"
                      value={state.actionDraft.name}
                      onChange={(event) =>
                        state.setActionDraft((current) => ({
                          ...current,
                          name: event.target.value
                        }))
                      }
                    />
                  </Field>

                  <div className="grid gap-3 xl:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-[0.82rem] text-muted">Color</p>
                      <div className="flex flex-wrap gap-2">
                        {ACTION_COLORS.map((color) => (
                          <button
                            key={color}
                            className={cn(
                              "size-[26px] rounded-full border-2 transition-transform hover:-translate-y-0.5",
                              state.actionDraft.color === color
                                ? "border-white shadow-[0_0_0_2px_rgba(237,243,255,0.2)]"
                                : "border-transparent"
                            )}
                            type="button"
                            style={{ backgroundColor: color }}
                            onClick={() =>
                              state.setActionDraft((current) => ({
                                ...current,
                                color
                              }))
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[0.82rem] text-muted">Icon</p>
                      <div className="flex flex-wrap gap-2">
                        {["brain", "coffee", "briefcase", "users", "moon", "book", "dumbbell", "home", "pen", "flame"].map(
                          (iconName) => {
                            const Icon = getActionIcon(iconName);

                            return (
                              <button
                                key={iconName}
                                className={cn(
                                  "inline-flex size-[34px] items-center justify-center rounded-[10px] border bg-white/4 transition-all hover:-translate-y-0.5",
                                  state.actionDraft.icon === iconName
                                    ? "shadow-[0_0_0_2px_rgba(237,243,255,0.2)]"
                                    : "border-border text-foreground"
                                )}
                                type="button"
                                onClick={() =>
                                  state.setActionDraft((current) => ({
                                    ...current,
                                    icon: iconName
                                  }))
                                }
                              >
                                <Icon size={16} />
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={state.busy === "save-action"} className="px-3.5 py-2.5 text-[0.92rem]">
                    {state.editingActionId ? "Save action" : "Create action"}
                  </Button>
                </form>
              </>
            ) : null}
          </div>
        </CardContent>
      </Surface>
    </div>
  );
}

function TimelineView({
  history,
  currentState,
  clockNow,
  busy,
  onRequestDeleteHistoryEvent
}: {
  history: HistoryEvent[];
  currentState: CurrentState;
  clockNow: number;
  busy: string | null;
  onRequestDeleteHistoryEvent: (event: HistoryEvent) => void;
}) {
  const [selectedDate, setSelectedDate] = useState(getTodayKey);
  const segments = buildActivitySegments(history, currentState, clockNow);
  const dailySegments = segments.filter((segment) => formatInputDate(segment.startMs) === selectedDate);

  return (
    <div className="space-y-4">
      <Surface className="p-4 sm:p-5">
        <CardHeader className="gap-3 p-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Eyebrow>Timeline</Eyebrow>
              <CardTitle className="mt-1 text-xl">{formatDayHeading(selectedDate)}</CardTitle>
              <CardDescription className="mt-1">
                Browse entries day by day with quick arrows or jump to any date.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button variant="outline" size="sm" onClick={() => setSelectedDate((current) => shiftDateKey(current, -1))}>
                <ArrowLeft size={15} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate((current) => shiftDateKey(current, 1))}>
                <ArrowRight size={15} />
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_1fr]">
            <Field label="Selected day">
              <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </Field>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.035] px-4 py-3">
              <p className="text-sm text-muted">Entries shown for</p>
              <p className="mt-1 text-sm font-medium text-white">{formatDayRangeLabel(selectedDate, selectedDate)}</p>
            </div>
          </div>
        </CardHeader>
      </Surface>

      <Surface className="p-4 sm:p-5">
        <CardHeader className="mb-4 gap-1 p-0">
          <CardTitle className="text-base">Timer entries</CardTitle>
          <CardDescription>Each row reflects an action selection event and its tracked span.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative space-y-2.5 before:absolute before:top-4 before:bottom-4 before:left-[6px] before:w-px before:bg-white/10">
            {dailySegments.length ? (
              dailySegments.map((segment) => {
                const Icon = getActionIcon(segment.actionIcon);
                const compact = !segment.titleSnapshot.trim();
                const isActiveEntry =
                  !!currentState.currentStartedAt &&
                  !!segment.startedAt &&
                  currentState.currentStartedAt.toDate().getTime() === segment.startedAt.toDate().getTime();

                return (
                  <div className={cn("grid grid-cols-[12px_1fr] gap-3", compact && "items-center")} key={segment.id}>
                    <div className="relative z-10 flex justify-center pt-1">
                      <span
                        className="block h-2.5 w-2.5 rounded-full ring-4 ring-transparent"
                        style={{
                          backgroundColor: segment.actionColor,
                          boxShadow: `0 0 0 4px ${segment.actionColor}12`
                        }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className={cn("rounded-[16px] border border-white/5 bg-white/[0.018] px-3.5 py-3", compact && "py-2.5")}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div>
                          <strong className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Icon size={14} strokeWidth={2.2} />
                            <span>{segment.actionName}</span>
                          </strong>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                            {formatTimeOfDay(segment.startMs)} to {formatTimeOfDay(segment.endMs)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-start">
                          {isActiveEntry ? (
                            <span className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[0.73rem] uppercase tracking-[0.16em] text-primary">
                              Active
                            </span>
                          ) : null}
                          <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[0.73rem] uppercase tracking-[0.16em] text-muted">
                            {formatSegmentDuration(segment.startMs, segment.endMs)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted hover:text-destructive"
                            disabled={isActiveEntry || busy === `delete-history-${segment.id}`}
                            onClick={() => onRequestDeleteHistoryEvent(segment)}
                          >
                            <Trash2 size={14} />
                            <span className="sr-only">Remove timer entry</span>
                          </Button>
                        </div>
                      </div>
                      {compact ? null : <p className="mt-2 text-sm leading-6 text-muted">{segment.titleSnapshot}</p>}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted">No timer entries for this day yet.</p>
            )}
          </div>
        </CardContent>
      </Surface>
    </div>
  );
}

function AnalyticsView({
  history,
  currentState,
  clockNow,
  actions
}: {
  history: HistoryEvent[];
  currentState: CurrentState;
  clockNow: number;
  actions: ActionItem[];
}) {
  const [range, setRange] = useState<AnalyticsRange>(() => ({
    preset: "today",
    ...getDefaultRange("today")
  }));
  const [selectedActionId, setSelectedActionId] = useState<string>("all");
  const rows = buildAnalyticsRows(history, currentState, clockNow, range.from, range.to, selectedActionId);
  const totalSeconds = rows.reduce((sum, row) => sum + row.seconds, 0);

  function applyPreset(preset: AnalyticsPreset) {
    setRange({
      preset,
      ...getDefaultRange(preset)
    });
  }

  return (
    <div className="space-y-4">
      <Surface className="p-4 sm:p-5">
        <CardHeader className="gap-3 p-0">
          <div>
            <Eyebrow>Analytics</Eyebrow>
            <CardTitle className="mt-1 text-xl">Activity breakdown</CardTitle>
            <CardDescription className="mt-1">
              Defaulting to today, with quick ranges and action filters for deeper reads.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["today", "7d", "30d", "custom"] as AnalyticsPreset[]).map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                className={cn(range.preset === preset && "border-primary/35 bg-primary/12 text-primary")}
                onClick={() => applyPreset(preset)}
              >
                {preset === "today" ? "Today" : preset === "7d" ? "Last 7 days" : preset === "30d" ? "Last 30 days" : "Custom"}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Field label="From">
              <Input
                type="date"
                value={range.from}
                onChange={(event) =>
                  setRange((current) => ({
                    ...current,
                    preset: "custom",
                    from: event.target.value
                  }))
                }
              />
            </Field>
            <Field label="To">
              <Input
                type="date"
                value={range.to}
                onChange={(event) =>
                  setRange((current) => ({
                    ...current,
                    preset: "custom",
                    to: event.target.value
                  }))
                }
              />
            </Field>
            <Field label="Activity filter">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={selectedActionId}
                onChange={(event) => setSelectedActionId(event.target.value)}
              >
                <option value="all">All activities</option>
                {actions.map((action) => (
                  <option key={action.id} value={action.id}>
                    {action.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </CardHeader>
      </Surface>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1.32fr)]">
        <Surface className="p-4 sm:p-5">
          <CardHeader className="gap-1 p-0">
            <CardTitle className="text-base">Range summary</CardTitle>
            <CardDescription>{formatDayRangeLabel(range.from, range.to)}</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 grid gap-3 p-0">
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-sm text-muted">Tracked time</p>
              <p className="mt-1 font-mono text-2xl tracking-[-0.06em] text-white">
                {formatSegmentDuration(0, totalSeconds * 1000)}
              </p>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-sm text-muted">Activities shown</p>
              <p className="mt-1 text-2xl font-semibold text-white">{rows.length}</p>
            </div>
          </CardContent>
        </Surface>

        <Surface className="p-4 sm:p-5">
          <CardHeader className="mb-4 gap-1 p-0">
            <CardTitle className="text-base">Activities stats</CardTitle>
            <CardDescription>Time and percentage for each activity in the selected range.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            {rows.length ? (
              rows.map((row) => {
                const Icon = getActionIcon(row.actionIcon);

                return (
                  <div key={row.actionId} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="grid size-10 shrink-0 place-items-center rounded-[14px]"
                          style={{ backgroundColor: `${row.actionColor}25`, color: row.actionColor }}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{row.actionName}</p>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted">{row.percentage}% of tracked time</p>
                        </div>
                      </div>
                      <p className="font-mono text-sm text-white">{formatSegmentDuration(0, row.seconds * 1000)}</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/6">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${row.percentage}%`, backgroundColor: row.actionColor }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted">No tracked time for the selected filters yet.</p>
            )}
          </CardContent>
        </Surface>
      </div>
    </div>
  );
}

function ProfileView({
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
          <Button className="w-full justify-center sm:w-auto" onClick={onSignOut} disabled={busy === "sign-out"}>
            <LogOut size={15} />
            Sign out
          </Button>
        </CardContent>
      </Surface>
    </div>
  );
}

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
                    {page === "home"
                      ? "Today at a glance"
                      : page === "timeline"
                        ? "Daily timeline"
                        : page === "analytics"
                          ? "Activity analytics"
                          : "Profile and workspace"}
                  </h1>
                </div>
                <p className="max-w-md text-sm leading-6 text-muted">{pageDescription(page)}</p>
              </div>

              {page === "home" ? <HomeView {...state} /> : null}
              {page === "timeline" ? (
                <TimelineView
                  history={state.history}
                  currentState={state.currentState}
                  clockNow={state.clockNow}
                  busy={state.busy}
                  onRequestDeleteHistoryEvent={state.requestDeleteHistoryEvent}
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

      <AlertDialog
        open={state.actionDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            state.setActionDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove action?</AlertDialogTitle>
            <AlertDialogDescription>
              {state.actionDeleteTarget
                ? `Remove "${state.actionDeleteTarget.name}"? History records will stay saved with their snapped action data.`
                : "History records will stay saved with their snapped action data."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={state.busy === `delete-action-${state.actionDeleteTarget?.id ?? ""}`}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={state.busy === `delete-action-${state.actionDeleteTarget?.id ?? ""}`}
              onClick={() => void state.confirmDeleteAction()}
            >
              Remove action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={state.historyDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            state.setHistoryDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove timer entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {state.historyDeleteTarget
                ? `Remove the "${state.historyDeleteTarget.actionName}" timer entry from the timeline? This cannot be undone.`
                : "This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={state.busy === `delete-history-${state.historyDeleteTarget?.id ?? ""}`}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={state.busy === `delete-history-${state.historyDeleteTarget?.id ?? ""}`}
              onClick={() => void state.confirmDeleteHistoryEvent()}
            >
              Remove entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
