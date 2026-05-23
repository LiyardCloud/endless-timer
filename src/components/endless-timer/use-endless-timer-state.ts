"use client";

import { useEffect, useRef, useState, type FormEvent, type MutableRefObject } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import {
  actionsQuery,
  bootstrapUser,
  createAction,
  historyQuery,
  removeAction,
  removeHistoryEvent,
  saveCurrentTitle,
  selectAction,
  updateAction,
  updateHistoryEvent
} from "@/lib/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { normalizeActionIconName } from "@/lib/action-icons";
import { mapAction, mapHistory } from "@/lib/firestore-mappers";
import type { ActionItem, CurrentState, HistoryEvent, UserRecord } from "@/lib/types";
import { emptyCurrentState, emptyDraft, emptyHistoryEditDraft } from "@/components/endless-timer/constants";
import {
  formatDateTimeLocalValue,
  getHistoryNeighbors,
  parseDateTimeLocalValue
} from "@/components/endless-timer/helpers";
import type { ActionDraft, ActionMode, HistoryEditDraft } from "@/components/endless-timer/types";

type SetBusy = (busy: string | null) => void;
type SetError = (message: string | null) => void;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function useAuthSession(setBusy: SetBusy, setErrorMessage: SetError) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
        return;
      }

      try {
        await bootstrapUser(nextUser);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Failed to bootstrap user."));
      }
    });

    return () => unsubscribe();
  }, [setErrorMessage]);

  async function handleGoogleSignIn() {
    if (!auth || !googleProvider) {
      return;
    }

    try {
      setBusy("sign-in");
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Sign-in failed."));
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
      setErrorMessage(getErrorMessage(error, "Sign-out failed."));
    } finally {
      setBusy(null);
    }
  }

  return {
    user,
    authLoading,
    handleGoogleSignIn,
    handleSignOut
  };
}

function useClockNow() {
  const [clockNow, setClockNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return clockNow;
}

function useDebouncedTitleSave(params: {
  user: User | null;
  currentTitle: string;
  hydratedTitleRef: MutableRefObject<boolean>;
  setErrorMessage: SetError;
  titleDraft: string;
}) {
  const { user, currentTitle, hydratedTitleRef, setErrorMessage, titleDraft } = params;
  const titleSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !hydratedTitleRef.current || titleDraft === currentTitle) {
      return;
    }

    if (titleSaveTimeoutRef.current) {
      clearTimeout(titleSaveTimeoutRef.current);
    }

    titleSaveTimeoutRef.current = setTimeout(() => {
      void saveCurrentTitle(user.uid, titleDraft).catch((error) => {
        setErrorMessage(getErrorMessage(error, "Failed to save title."));
      });
    }, 450);

    return () => {
      if (titleSaveTimeoutRef.current) {
        clearTimeout(titleSaveTimeoutRef.current);
      }
    };
  }, [currentTitle, hydratedTitleRef, setErrorMessage, titleDraft, user]);
}

function useTimerLiveData(user: User | null, busy: string | null, setErrorMessage: SetError) {
  const [currentState, setCurrentState] = useState<CurrentState>(emptyCurrentState);
  const [titleDraft, setTitleDraft] = useState("");
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const hydratedTitleRef = useRef(false);

  useEffect(() => {
    if (user) {
      return;
    }

    setActions([]);
    setHistory([]);
    setCurrentState(emptyCurrentState);
    setTitleDraft("");
    hydratedTitleRef.current = false;
  }, [user]);

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

  useDebouncedTitleSave({
    user,
    currentTitle: currentState.currentTitle,
    hydratedTitleRef,
    setErrorMessage,
    titleDraft
  });

  return {
    currentState,
    titleDraft,
    setTitleDraft,
    actions,
    history
  };
}

function useActionManagement(params: {
  user: User | null;
  currentState: CurrentState;
  setBusy: SetBusy;
  setErrorMessage: SetError;
  setTitleDraft: (title: string) => void;
  titleDraft: string;
}) {
  const { user, currentState, setBusy, setErrorMessage, setTitleDraft, titleDraft } = params;
  const [actionDraft, setActionDraft] = useState<ActionDraft>(emptyDraft);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>("select");
  const [actionDeleteTarget, setActionDeleteTarget] = useState<ActionItem | null>(null);

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
      setErrorMessage(getErrorMessage(error, "Failed to save action."));
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
      setErrorMessage(getErrorMessage(error, "Failed to delete action."));
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
      setErrorMessage(getErrorMessage(error, "Failed to log action event."));
    } finally {
      setBusy(null);
    }
  }

  return {
    actionDraft,
    setActionDraft,
    editingActionId,
    actionMode,
    actionDeleteTarget,
    setActionDeleteTarget,
    showActionForm: actionMode === "create" || editingActionId !== null,
    interactionHint:
      actionMode === "change"
        ? "Pick an action to edit"
        : actionMode === "remove"
          ? "Pick an action to remove"
          : "Tap an action to log a new event",
    handleActionSubmit,
    handleActionSelection,
    openCreateMode,
    openChangeMode,
    openRemoveMode,
    resetActionEditor,
    confirmDeleteAction
  };
}

function useHistoryEventManagement(params: {
  actions: ActionItem[];
  currentState: CurrentState;
  history: HistoryEvent[];
  setBusy: SetBusy;
  setErrorMessage: SetError;
  user: User | null;
}) {
  const { actions, currentState, history, setBusy, setErrorMessage, user } = params;
  const [historyDeleteTarget, setHistoryDeleteTarget] = useState<HistoryEvent | null>(null);
  const [historyEditTarget, setHistoryEditTarget] = useState<HistoryEvent | null>(null);
  const [historyEditDraft, setHistoryEditDraft] = useState<HistoryEditDraft>(emptyHistoryEditDraft);

  useEffect(() => {
    if (user) {
      return;
    }

    setHistoryEditTarget(null);
    setHistoryEditDraft(emptyHistoryEditDraft);
  }, [user]);

  function requestDeleteHistoryEvent(event: HistoryEvent) {
    const currentStartedAtMs = currentState.currentStartedAt?.toDate().getTime();
    const eventStartedAtMs = event.startedAt?.toDate().getTime();

    if (currentStartedAtMs && eventStartedAtMs && currentStartedAtMs === eventStartedAtMs) {
      setErrorMessage("Switch to another action before deleting the active timer entry.");
      return;
    }

    setHistoryDeleteTarget(event);
  }

  function requestEditHistoryEvent(event: HistoryEvent) {
    const currentStartedAtMs = currentState.currentStartedAt?.toDate().getTime();
    const eventStartedAtMs = event.startedAt?.toDate().getTime();

    if (!eventStartedAtMs) {
      setErrorMessage("This timer entry is missing a start time and cannot be edited.");
      return;
    }

    if (currentStartedAtMs && currentStartedAtMs === eventStartedAtMs) {
      setErrorMessage("Switch to another action before editing the active timer entry.");
      return;
    }

    setHistoryEditTarget(event);
    setHistoryEditDraft({
      actionId: event.actionId,
      titleSnapshot: event.titleSnapshot,
      startedAt: formatDateTimeLocalValue(event.startedAt!.toDate())
    });
  }

  function cancelHistoryEdit() {
    setHistoryEditTarget(null);
    setHistoryEditDraft(emptyHistoryEditDraft);
  }

  async function submitHistoryEdit() {
    if (!user || !historyEditTarget) {
      return;
    }

    const currentStartedAtMs = currentState.currentStartedAt?.toDate().getTime();
    const targetStartedAtMs = historyEditTarget.startedAt?.toDate().getTime();

    if (currentStartedAtMs && targetStartedAtMs && currentStartedAtMs === targetStartedAtMs) {
      setErrorMessage("The active timer entry cannot be edited right now.");
      return;
    }

    const parsedStartedAt = parseDateTimeLocalValue(historyEditDraft.startedAt);

    if (!parsedStartedAt) {
      setErrorMessage("Choose a valid start date and time.");
      return;
    }

    const { previousEvent, nextEvent } = getHistoryNeighbors(history, historyEditTarget.id);
    const editedStartedAtMs = parsedStartedAt.getTime();
    const previousStartedAtMs = previousEvent?.startedAt?.toDate().getTime();
    const nextStartedAtMs = nextEvent?.startedAt?.toDate().getTime();

    if (previousStartedAtMs && editedStartedAtMs <= previousStartedAtMs) {
      setErrorMessage("Move this entry after the previous timer entry to keep the timeline in order.");
      return;
    }

    if (nextStartedAtMs && editedStartedAtMs >= nextStartedAtMs) {
      setErrorMessage("Move this entry before the next timer entry to keep the timeline in order.");
      return;
    }

    const selectedAction = actions.find((action) => action.id === historyEditDraft.actionId);
    const fallbackAction =
      historyEditDraft.actionId === historyEditTarget.actionId
        ? {
            id: historyEditTarget.actionId,
            name: historyEditTarget.actionName,
            color: historyEditTarget.actionColor,
            icon: historyEditTarget.actionIcon
          }
        : null;
    const resolvedAction = selectedAction ?? fallbackAction;

    if (!resolvedAction) {
      setErrorMessage("Pick a valid action before saving this timer entry.");
      return;
    }

    try {
      setBusy(`update-history-${historyEditTarget.id}`);
      await updateHistoryEvent(user.uid, historyEditTarget.id, {
        actionId: resolvedAction.id,
        actionName: resolvedAction.name,
        actionColor: resolvedAction.color,
        actionIcon: resolvedAction.icon,
        titleSnapshot: historyEditDraft.titleSnapshot.trim(),
        startedAt: parsedStartedAt
      });
      setErrorMessage(null);
      cancelHistoryEdit();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to update timer entry."));
    } finally {
      setBusy(null);
    }
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
      setErrorMessage(getErrorMessage(error, "Failed to delete timer entry."));
    } finally {
      setBusy(null);
    }
  }

  return {
    historyDeleteTarget,
    historyEditTarget,
    historyEditDraft,
    requestDeleteHistoryEvent,
    confirmDeleteHistoryEvent,
    requestEditHistoryEvent,
    cancelHistoryEdit,
    submitHistoryEdit,
    setHistoryDeleteTarget,
    setHistoryEditDraft
  };
}

export function useEndlessTimerState() {
  const [busy, setBusy] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const authSession = useAuthSession(setBusy, setErrorMessage);
  const timerData = useTimerLiveData(authSession.user, busy, setErrorMessage);
  const clockNow = useClockNow();
  const actionManagement = useActionManagement({
    user: authSession.user,
    currentState: timerData.currentState,
    setBusy,
    setErrorMessage,
    setTitleDraft: timerData.setTitleDraft,
    titleDraft: timerData.titleDraft
  });
  const historyEventManagement = useHistoryEventManagement({
    actions: timerData.actions,
    currentState: timerData.currentState,
    history: timerData.history,
    setBusy,
    setErrorMessage,
    user: authSession.user
  });

  return {
    user: authSession.user,
    authLoading: authSession.authLoading,
    busy,
    currentState: timerData.currentState,
    titleDraft: timerData.titleDraft,
    setTitleDraft: timerData.setTitleDraft,
    actions: timerData.actions,
    history: timerData.history,
    clockNow,
    errorMessage,
    handleGoogleSignIn: authSession.handleGoogleSignIn,
    handleSignOut: authSession.handleSignOut,
    ...actionManagement,
    ...historyEventManagement
  };
}

export type EndlessTimerState = ReturnType<typeof useEndlessTimerState>;
