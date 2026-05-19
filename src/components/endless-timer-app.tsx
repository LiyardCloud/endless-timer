"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { onAuthStateChanged, signInWithPopup, type User } from "firebase/auth";
import { doc, onSnapshot, type DocumentData, type QueryDocumentSnapshot } from "firebase/firestore";
import { CircleUserRound, Pencil, Plus, Trash2 } from "lucide-react";

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
  latestHistoryQuery,
  removeAction,
  saveCurrentTitle,
  selectAction,
  updateAction
} from "@/lib/firestore";
import { formatDateTime, formatDuration } from "@/lib/format";
import { ACTION_ICON_NAMES, getActionIcon, normalizeActionIconName } from "@/lib/action-icons";
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

type ActionDraft = {
  id: string | null;
  name: string;
  color: string;
  icon: string;
};

type ActionMode = "select" | "create" | "change" | "remove";

const emptyDraft: ActionDraft = {
  id: null,
  name: "",
  color: ACTION_COLORS[0],
  icon: ACTION_ICON_NAMES[0]
};

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

function Eyebrow({ children }: { children: React.ReactNode }) {
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
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export function EndlessTimerApp() {
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
  const [deleteTarget, setDeleteTarget] = useState<ActionItem | null>(null);
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

    const unsubscribeHistory = onSnapshot(latestHistoryQuery(user.uid), (snapshot) => {
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
    void clockNow;
  }, [clockNow]);

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

    setDeleteTarget(action);
  }

  async function confirmDeleteAction() {
    if (!user || !deleteTarget) {
      return;
    }

    try {
      setBusy(`delete-${deleteTarget.id}`);
      await removeAction(user.uid, deleteTarget.id);
      setActionMode("select");
      setDeleteTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete action.";
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

  const timerLabel = formatDuration(currentState.currentStartedAt);
  const timerPanelStyle = currentState.currentActionColor
    ? ({
        "--timer-accent": currentState.currentActionColor,
        background: `radial-gradient(circle at top left, ${currentState.currentActionColor}30, transparent 34%), linear-gradient(145deg, ${currentState.currentActionColor}22, #0d1016 58%, #0d1016 100%)`,
        borderColor: `${currentState.currentActionColor}36`
      } as CSSProperties)
    : undefined;
  const showActionForm = actionMode === "create" || editingActionId !== null;
  const interactionHint =
    actionMode === "change"
      ? "Pick a badge to edit"
      : actionMode === "remove"
        ? "Pick a badge to remove"
        : "Click a badge to log a new event";

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-4 sm:px-6">
        <Card className="grid w-full gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.8fr)]">
          <div className="space-y-4">
            <Eyebrow>EndlessTimer</Eyebrow>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-5xl lg:text-6xl">
                Continuous tracking for one person, one page, one clock.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                Sign in with Google to access your timer, action set, and private history.
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
                  onClick={handleGoogleSignIn}
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

  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-[1320px] flex-col px-4 py-[18px] sm:px-4 sm:py-[18px]">
        <header className="flex items-center justify-between gap-3 pb-2">
          <div className="flex items-center">
            <Eyebrow>EndlessTimer</Eyebrow>
          </div>

          <div className="grid size-[42px] place-items-center overflow-hidden rounded-full border border-border bg-white/4">
            <div className="grid size-full place-items-center overflow-hidden rounded-full">
              {user.photoURL ? (
                <Image
                  alt={user.displayName ?? "User"}
                  src={user.photoURL}
                  width={44}
                  height={44}
                  unoptimized
                />
              ) : (
                <CircleUserRound className="size-5 text-muted" />
              )}
            </div>
          </div>
        </header>

        <div className="space-y-4">
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

          {errorMessage ? (
            <Card className="rounded-[1.35rem] border-destructive/25 bg-destructive/8 p-5 shadow-none">
              <CardHeader className="gap-1 p-0">
                <CardTitle>Something failed</CardTitle>
                <CardDescription>{errorMessage}</CardDescription>
              </CardHeader>
            </Card>
          ) : null}
        </div>

        <section className="mt-2.5 grid items-start gap-7 lg:grid-cols-[minmax(460px,0.98fr)_1px_minmax(360px,1fr)] lg:gap-x-[40px]">
          <div className="grid min-w-0 gap-7 lg:grid-rows-[minmax(188px,auto)_auto]">
            <Card
              className="min-w-0 overflow-hidden rounded-[20px] p-[16px_18px_18px]"
              style={timerPanelStyle}
            >
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
                    <CardTitle className="line-clamp-2 max-w-[18ch] font-mono text-[clamp(1.4rem,2.35vw,1.85rem)] leading-[0.98] tracking-[-0.07em] text-white/95 sm:line-clamp-1 sm:max-w-none">
                      {currentState.currentActionName ?? "No active action"}
                    </CardTitle>
                  </div>
                  <div
                    className="shrink-0 p-0 text-left"
                    style={
                      currentState.currentActionColor
                        ? {
                            color: currentState.currentActionColor
                          }
                        : undefined
                    }
                  >
                    <p className="font-mono text-[clamp(2.15rem,4.7vw,3.5rem)] leading-none tracking-[-0.09em] text-foreground">
                      {timerLabel}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="mt-3.5 p-0">
                <Field label="Current title">
                  <Input
                    className="h-auto rounded-[18px] border-border bg-white/5 px-4 py-3.5 text-[1.02rem] placeholder:text-muted/75 focus:border-primary/30 focus:bg-white/7 focus:ring-primary/20"
                    placeholder="What are you doing?"
                    value={titleDraft}
                    onChange={(event) => setTitleDraft(event.target.value)}
                    disabled={!user}
                  />
                </Field>
                {!currentState.currentActionName ? (
                  <p className="mt-3 text-sm text-muted">
                    Select an action to start the first tracked block.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-none bg-transparent p-[4px_18px_0] shadow-none">
              <CardHeader className="mb-[14px] gap-[2px] p-0">
                <Eyebrow>Actions</Eyebrow>
                <CardTitle className="text-base font-semibold tracking-normal">{interactionHint}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-0 p-0">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {actions.map((action) => {
                    const active = currentState.currentActionId === action.id;
                    const Icon = getActionIcon(action.icon);

                    return (
                      <button
                        key={action.id}
                        className={cn(
                          "inline-flex min-h-[52px] w-full items-center justify-start gap-2 rounded-[18px] border px-4 py-3 text-left text-sm font-medium transition-all duration-150",
                          "hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55",
                          active ? "text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]" : "bg-transparent text-foreground",
                          (actionMode === "change" || actionMode === "remove") && "animate-pulse"
                        )}
                        onClick={() => void handleActionSelection(action)}
                        disabled={busy === "select-action" || busy === `delete-${action.id}`}
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

                <div className="mt-4 border-t border-white/8 pt-3.5">
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
                      actionMode === "create" && "border-primary/35 bg-primary/12 text-primary shadow-[0_0_0_1px_rgba(238,243,255,0.06),inset_0_1px_0_rgba(255,255,255,0.08)]"
                    )}
                    onClick={openCreateMode}
                  >
                    <Plus size={15} />
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "min-w-[104px] bg-white/6 px-[14px] py-[10px] text-[0.85rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                      actionMode === "change" && "border-primary/35 bg-primary/12 text-primary shadow-[0_0_0_1px_rgba(238,243,255,0.06),inset_0_1px_0_rgba(255,255,255,0.08)]"
                    )}
                    onClick={openChangeMode}
                  >
                    <Pencil size={15} />
                    Change
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "min-w-[104px] bg-white/6 px-[14px] py-[10px] text-[0.85rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                      actionMode === "remove" && "border-destructive/35 bg-destructive/12 text-destructive-foreground shadow-[0_0_0_1px_rgba(255,244,243,0.05),inset_0_1px_0_rgba(255,255,255,0.06)]"
                    )}
                    onClick={openRemoveMode}
                  >
                    <Trash2 size={15} />
                    Remove
                  </Button>
                </div>
                </div>

                {showActionForm ? (
                  <>
                    <Separator className="mt-3.5" />
                    <form className="mt-3.5 space-y-4 px-0.5" onSubmit={handleActionSubmit}>
                      <div className="mb-2.5 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <h3 className="text-base font-semibold">
                            {editingActionId ? "Change action" : "Create action"}
                          </h3>
                        </div>
                        <Button variant="ghost" size="sm" onClick={resetActionEditor}>
                          Cancel
                        </Button>
                      </div>

                      <Field label="Name">
                        <Input
                          placeholder="Action name"
                          value={actionDraft.name}
                          onChange={(event) =>
                            setActionDraft((current) => ({
                              ...current,
                              name: event.target.value
                            }))
                          }
                        />
                      </Field>

                      <div className="grid gap-3 lg:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-[0.82rem] text-muted">Color</p>
                          <div className="flex flex-wrap gap-2">
                            {ACTION_COLORS.map((color) => (
                              <button
                                key={color}
                                className={cn(
                                  "size-[26px] rounded-full border-2 transition-transform hover:-translate-y-0.5",
                                  actionDraft.color === color ? "border-white shadow-[0_0_0_2px_rgba(237,243,255,0.2)]" : "border-transparent"
                                )}
                                type="button"
                                style={{ backgroundColor: color }}
                                onClick={() =>
                                  setActionDraft((current) => ({
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
                            {ACTION_ICON_NAMES.map((iconName) => {
                              const Icon = getActionIcon(iconName);

                              return (
                                <button
                                  key={iconName}
                                  className={cn(
                                    "inline-flex size-[34px] items-center justify-center rounded-[10px] border bg-white/4 transition-all hover:-translate-y-0.5",
                                    actionDraft.icon === iconName
                                      ? "shadow-[0_0_0_2px_rgba(237,243,255,0.2)]"
                                      : "border-border text-foreground"
                                  )}
                                  type="button"
                                  onClick={() =>
                                    setActionDraft((current) => ({
                                      ...current,
                                      icon: iconName
                                    }))
                                  }
                                >
                                  <Icon size={16} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <Button type="submit" disabled={busy === "save-action"} className="px-3.5 py-2.5 text-[0.92rem]">
                        {editingActionId ? "Save action" : "Create action"}
                      </Button>
                    </form>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Separator
            orientation="vertical"
            className="hidden min-h-full bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.14)_10%,rgba(255,255,255,0.14)_90%,transparent_100%)] lg:block"
          />

          <Card className="border-none bg-transparent p-[4px_18px_0] shadow-none">
            <CardHeader className="mb-[14px] gap-[2px] p-0">
              <Eyebrow>Timeline</Eyebrow>
              <CardTitle className="text-base font-semibold tracking-normal">Latest action switches</CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="relative space-y-2.5 px-0.5 before:absolute before:top-4 before:bottom-4 before:left-[6px] before:w-px before:bg-white/10">
                {history.length ? (
                  history.map((event) => {
                    const Icon = getActionIcon(event.actionIcon);
                    const compact = !event.titleSnapshot.trim();

                    return (
                      <div
                        className={cn("grid grid-cols-[12px_1fr] gap-3", compact && "items-center")}
                        key={event.id}
                      >
                        <div className="relative z-10 flex justify-center pt-1">
                          <span
                            className="block h-2.5 w-2.5 rounded-full ring-4 ring-transparent"
                            style={{
                              backgroundColor: event.actionColor,
                              boxShadow: `0 0 0 4px ${event.actionColor}12`
                            }}
                            aria-hidden="true"
                          />
                        </div>
                        <div className={cn("rounded-[14px] border border-white/5 bg-white/[0.018] px-3.5 py-3", compact && "py-2.5")}>
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                            <strong className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                              <Icon size={14} strokeWidth={2.2} />
                              <span>{event.actionName}</span>
                            </strong>
                            <span className="text-[0.76rem] uppercase tracking-[0.16em] text-muted">
                              {formatDateTime(event.startedAt)}
                            </span>
                          </div>
                          {compact ? null : (
                            <p className="mt-2 text-sm leading-6 text-muted">{event.titleSnapshot}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted">
                    Your action history will appear here after the first click.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove action?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Remove "${deleteTarget.name}"? History records will stay saved with their snapped action data.`
                : "History records will stay saved with their snapped action data."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === `delete-${deleteTarget?.id ?? ""}`}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy === `delete-${deleteTarget?.id ?? ""}`}
              onClick={() => void confirmDeleteAction()}
            >
              Remove action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
