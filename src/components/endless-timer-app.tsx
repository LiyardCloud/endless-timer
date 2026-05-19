"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, onSnapshot, type DocumentData, type QueryDocumentSnapshot, query } from "firebase/firestore";

import { ACTION_COLORS, ACTION_ICONS } from "@/lib/default-actions";
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

const emptyDraft: ActionDraft = {
  id: null,
  name: "",
  color: ACTION_COLORS[0],
  icon: ACTION_ICONS[0]
};

function mapAction(docSnapshot: QueryDocumentSnapshot<DocumentData>): ActionItem {
  const data = docSnapshot.data();

  return {
    id: docSnapshot.id,
    name: data.name,
    color: data.color,
    icon: data.icon,
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
    actionIcon: data.actionIcon,
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
        currentActionIcon: data.currentActionIcon ?? null,
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
          icon: actionDraft.icon
        });
      } else {
        await createAction(user.uid, {
          name: actionDraft.name.trim(),
          color: actionDraft.color,
          icon: actionDraft.icon
        });
      }

      setActionDraft(emptyDraft);
      setEditingActionId(null);
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
      icon: action.icon
    });
  }

  async function handleDeleteAction(action: ActionItem) {
    if (!user) {
      return;
    }

    if (currentState.currentActionId === action.id) {
      setErrorMessage("Choose another current action before deleting this one.");
      return;
    }

    try {
      setBusy(`delete-${action.id}`);
      await removeAction(user.uid, action.id);
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

    try {
      setBusy("select-action");
      await selectAction({
        userId: user.uid,
        action,
        title: titleDraft.trim()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to log action event.";
      setErrorMessage(message);
    } finally {
      setBusy(null);
    }
  }

  const timerLabel = formatDuration(currentState.currentStartedAt);

  return (
    <main className="page-shell">
      <div className="page-backdrop" />
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">EndlessTimer</span>
          <h1>One timer. Continuous context. Clean history.</h1>
          <p>
            Switch actions instead of stopping the clock. Every click snapshots the title and
            adds a new timeline entry.
          </p>
        </div>
        <div className="hero-actions">
          {user ? (
            <>
              <div className="user-chip">
                {user.photoURL ? (
                  <Image
                    alt={user.displayName ?? "User"}
                    src={user.photoURL}
                    width={42}
                    height={42}
                    unoptimized
                  />
                ) : null}
                <div>
                  <strong>{user.displayName ?? "Signed in"}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
              <button className="secondary-button" onClick={handleSignOut} disabled={busy === "sign-out"}>
                Sign out
              </button>
            </>
          ) : (
            <button
              className="primary-button"
              onClick={handleGoogleSignIn}
              disabled={!firebaseConfigured || authLoading || busy === "sign-in"}
            >
              Sign in with Google
            </button>
          )}
        </div>
      </section>

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
        <article className="panel timer-panel">
          <div className="panel-header">
            <span className="panel-kicker">Timer</span>
            <strong>{currentState.currentActionName ?? "No active action"}</strong>
          </div>
          <div className="timer-face">
            <span className="timer-figure">{timerLabel}</span>
            <p>
              {currentState.currentActionName
                ? `Running since ${formatDateTime(currentState.currentStartedAt)}`
                : "Select an action to start the first tracked block."}
            </p>
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
          <div className="current-action-card">
            {currentState.currentActionName ? (
              <>
                <span
                  className="action-dot"
                  style={{ backgroundColor: currentState.currentActionColor ?? "#111111" }}
                />
                <div>
                  <strong>
                    {currentState.currentActionIcon} {currentState.currentActionName}
                  </strong>
                  <p>{currentState.currentTitle || "No title yet"}</p>
                </div>
              </>
            ) : (
              <p className="muted">Your current action state will appear here.</p>
            )}
          </div>
        </article>

        <article className="panel actions-panel">
          <div className="panel-header">
            <span className="panel-kicker">Actions</span>
            <strong>Click any action to log a new event</strong>
          </div>
          <div className="action-list">
            {actions.map((action) => {
              const active = currentState.currentActionId === action.id;

              return (
                <div className="action-row" key={action.id}>
                  <button
                    className={`action-button ${active ? "is-active" : ""}`}
                    onClick={() => void handleActionSelection(action)}
                    disabled={!user || busy === "select-action"}
                    style={
                      {
                        "--action-color": action.color
                      } as React.CSSProperties
                    }
                  >
                    <span className="action-visual">
                      <span className="action-icon">{action.icon}</span>
                      <span>{action.name}</span>
                    </span>
                    <span className="action-meta">{active ? "Current" : "Select"}</span>
                  </button>
                  <div className="action-tools">
                    <button className="ghost-button" onClick={() => startEditingAction(action)}>
                      Edit
                    </button>
                    <button
                      className="ghost-button danger-button"
                      onClick={() => void handleDeleteAction(action)}
                      disabled={busy === `delete-${action.id}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <form className="action-form" onSubmit={handleActionSubmit}>
            <div className="form-title">
              <strong>{editingActionId ? "Edit action" : "New action"}</strong>
              {editingActionId ? (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    setEditingActionId(null);
                    setActionDraft(emptyDraft);
                  }}
                >
                  Cancel
                </button>
              ) : null}
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
                disabled={!user}
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
                  {ACTION_ICONS.map((icon) => (
                    <button
                      key={icon}
                      className={`icon-choice ${actionDraft.icon === icon ? "is-selected" : ""}`}
                      type="button"
                      onClick={() =>
                        setActionDraft((current) => ({
                          ...current,
                          icon
                        }))
                      }
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button className="primary-button" type="submit" disabled={!user || busy === "save-action"}>
              {editingActionId ? "Save action" : "Add action"}
            </button>
          </form>
        </article>

        <article className="panel timeline-panel">
          <div className="panel-header">
            <span className="panel-kicker">Timeline</span>
            <strong>Latest action switches</strong>
          </div>
          <div className="timeline-list">
            {history.length ? (
              history.map((event) => (
                <div className="timeline-item" key={event.id}>
                  <span
                    className="timeline-line"
                    style={{ backgroundColor: event.actionColor }}
                    aria-hidden="true"
                  />
                  <div className="timeline-body">
                    <div className="timeline-head">
                      <strong>
                        {event.actionIcon} {event.actionName}
                      </strong>
                      <span>{formatDateTime(event.startedAt)}</span>
                    </div>
                    <p>{event.titleSnapshot || "No title"}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">Your action history will appear here after the first click.</p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
