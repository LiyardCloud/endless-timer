"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signInWithPopup, type User } from "firebase/auth";
import { doc, onSnapshot, type DocumentData, type QueryDocumentSnapshot } from "firebase/firestore";
import {
  CircleUserRound,
  Pencil,
  Plus,
  Trash2
} from "lucide-react";

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

  async function handleActionSubmit(event: React.FormEvent<HTMLFormElement>) {
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

      setActionDraft(emptyDraft);
      setEditingActionId(null);
      setActionMode("select");
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

  async function handleDeleteAction(action: ActionItem) {
    if (!user) {
      return;
    }

    if (currentState.currentActionId === action.id) {
      setErrorMessage("Choose another current action before deleting this one.");
      return;
    }

    const confirmed = window.confirm(
      `Remove "${action.name}"?\n\nHistory records will stay сохранені with their snapped action data.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusy(`delete-${action.id}`);
      await removeAction(user.uid, action.id);
      setActionMode("select");
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
      setActionMode("select");
      await handleDeleteAction(action);
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
        "--timer-accent": currentState.currentActionColor
      } as React.CSSProperties)
    : undefined;
  const showActionForm = actionMode === "create" || editingActionId !== null;

  if (!user) {
    return (
      <main className="page-shell page-shell-auth">
        <section className="hero-card auth-card">
          <div className="hero-copy">
            <span className="eyebrow">EndlessTimer</span>
            <h1>Continuous tracking for one person, one page, one clock.</h1>
            <p>Sign in with Google to access your timer, action set, and private history.</p>
          </div>
          <div className="auth-gate">
            {!firebaseConfigured ? (
              <div className="notice-card">
                <h2>Firebase config required</h2>
                <p>Fill in `.env.local` from `.env.example` with your Firebase web app values.</p>
              </div>
            ) : null}
            {errorMessage ? (
              <div className="notice-card error-card">
                <h2>Something failed</h2>
                <p>{errorMessage}</p>
              </div>
            ) : null}
            <button
              className="primary-button"
              onClick={handleGoogleSignIn}
              disabled={!firebaseConfigured || authLoading || busy === "sign-in"}
            >
              {authLoading ? "Checking session..." : "Sign in with Google"}
            </button>
            <p className="muted auth-footnote">Authentication is required to use the app.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="app-header">
        <div className="app-brand">
          <span className="eyebrow">EndlessTimer</span>
        </div>
        <div className="hero-actions">
          <div className="user-chip">
            {user.photoURL ? (
              <Image
                alt={user.displayName ?? "User"}
                src={user.photoURL}
                width={34}
                height={34}
                unoptimized
              />
            ) : (
              <CircleUserRound className="user-avatar-fallback" size={22} />
            )}
          </div>
        </div>
      </header>

      {!firebaseConfigured ? (
        <section className="notice-card">
          <h2>Firebase config required</h2>
          <p>Fill in `.env.local` from `.env.example` with your existing Firebase web app values.</p>
        </section>
      ) : null}

      {errorMessage ? (
        <section className="notice-card error-card">
          <h2>Something failed</h2>
          <p>{errorMessage}</p>
        </section>
      ) : null}

      <section className="main-grid">
        <div className="left-column">
          <article className="panel timer-panel" style={timerPanelStyle}>
            <div className="panel-header timer-header">
              <div className="timer-heading">
                <strong>{currentState.currentActionName ?? "No active action"}</strong>
              </div>
              <div className="timer-readout">
                <span className="timer-figure">{timerLabel}</span>
              </div>
            </div>
            <label className="field">
              <span>Current title</span>
              <input
                placeholder="What are you doing?"
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                disabled={!user}
              />
            </label>
            {!currentState.currentActionName ? (
              <p className="muted">Select an action to start the first tracked block.</p>
            ) : null}
          </article>

          <article className="panel panel-minimal actions-panel">
            <div className="panel-header">
              <span className="panel-kicker">Actions</span>
              <strong>
                {actionMode === "change"
                  ? "Pick a badge to edit"
                  : actionMode === "remove"
                    ? "Pick a badge to remove"
                    : "Click a badge to log a new event"}
              </strong>
            </div>

            <div className={`action-badges ${actionMode === "change" || actionMode === "remove" ? "is-picking" : ""}`}>
              {actions.map((action) => {
                const active = currentState.currentActionId === action.id;
                const Icon = getActionIcon(action.icon);

                return (
                  <button
                    key={action.id}
                    className={`action-badge ${active ? "is-active" : ""} ${
                      actionMode === "change" || actionMode === "remove" ? "is-shaking" : ""
                    }`}
                    onClick={() => void handleActionSelection(action)}
                    disabled={busy === "select-action" || busy === `delete-${action.id}`}
                    style={
                      {
                        "--action-color": action.color
                      } as React.CSSProperties
                    }
                  >
                    <Icon size={15} strokeWidth={2.2} />
                    <span>{action.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="action-mode-row">
              <button
                className={`ghost-button mode-button ${actionMode === "create" ? "is-selected" : ""}`}
                onClick={openCreateMode}
                type="button"
              >
                <Plus size={15} />
                <span>Create</span>
              </button>
              <button
                className={`ghost-button mode-button ${actionMode === "change" ? "is-selected" : ""}`}
                onClick={openChangeMode}
                type="button"
              >
                <Pencil size={15} />
                <span>Change</span>
              </button>
              <button
                className={`ghost-button mode-button ${actionMode === "remove" ? "is-selected" : ""}`}
                onClick={openRemoveMode}
                type="button"
              >
                <Trash2 size={15} />
                <span>Remove</span>
              </button>
            </div>

            {showActionForm ? (
              <form className="action-form" onSubmit={handleActionSubmit}>
                <div className="form-title">
                  <strong>{editingActionId ? "Change action" : "Create action"}</strong>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      setEditingActionId(null);
                      setActionDraft(emptyDraft);
                      setActionMode("select");
                    }}
                  >
                    Cancel
                  </button>
                </div>
                <label className="field">
                  <span>Name</span>
                  <input
                    placeholder="Action name"
                    value={actionDraft.name}
                    onChange={(event) =>
                      setActionDraft((current) => ({
                        ...current,
                        name: event.target.value
                      }))
                    }
                  />
                </label>
                <div className="picker-row">
                  <div className="picker-block">
                    <span>Color</span>
                    <div className="swatch-grid">
                      {ACTION_COLORS.map((color) => (
                        <button
                          key={color}
                          className={`swatch ${actionDraft.color === color ? "is-selected" : ""}`}
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
                  <div className="picker-block">
                    <span>Icon</span>
                    <div className="icon-grid">
                      {ACTION_ICON_NAMES.map((iconName) => {
                        const Icon = getActionIcon(iconName);

                        return (
                          <button
                            key={iconName}
                            className={`icon-choice ${actionDraft.icon === iconName ? "is-selected" : ""}`}
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
                <button className="primary-button" type="submit" disabled={busy === "save-action"}>
                  {editingActionId ? "Save action" : "Create action"}
                </button>
              </form>
            ) : null}
          </article>
        </div>

        <div className="timeline-divider" aria-hidden="true" />
        <article className="panel panel-minimal timeline-panel">
          <div className="panel-header">
            <span className="panel-kicker">Timeline</span>
            <strong>Latest action switches</strong>
          </div>
          <div className="timeline-list">
            {history.length ? (
              history.map((event) => {
                const Icon = getActionIcon(event.actionIcon);
                const compact = !event.titleSnapshot.trim();

                return (
                  <div className={`timeline-item ${compact ? "is-compact" : ""}`} key={event.id}>
                    <span
                      className="timeline-line"
                      style={{ backgroundColor: event.actionColor }}
                      aria-hidden="true"
                    />
                    <div className="timeline-body">
                      <div className="timeline-head">
                        <strong className="timeline-action">
                          <Icon size={14} strokeWidth={2.2} />
                          <span>{event.actionName}</span>
                        </strong>
                        <span>{formatDateTime(event.startedAt)}</span>
                      </div>
                      {compact ? null : <p>{event.titleSnapshot}</p>}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="muted">Your action history will appear here after the first click.</p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
