"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import type { User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { actionsQuery, historyQuery, saveCurrentTitle } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { normalizeActionIconName } from "@/lib/action-icons";
import { mapAction, mapHistory } from "@/lib/firestore-mappers";
import type { ActionItem, CurrentState, HistoryEvent, UserRecord } from "@/lib/types";
import { emptyCurrentState } from "@/components/endless-timer/constants";
import { getErrorMessage, type SetError } from "@/components/endless-timer/hooks/shared";

function useDebouncedTitleSave(params: {
  user: User | null;
  currentTitle: string;
  hydratedTitleRef: MutableRefObject<boolean>;
  pendingTitleSaveRef: MutableRefObject<Promise<void>>;
  setErrorMessage: SetError;
  titleDraft: string;
  titleSaveTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}) {
  const { user, currentTitle, hydratedTitleRef, pendingTitleSaveRef, setErrorMessage, titleDraft, titleSaveTimeoutRef } =
    params;

  useEffect(() => {
    if (!user || !hydratedTitleRef.current || titleDraft === currentTitle) {
      return;
    }

    if (titleSaveTimeoutRef.current) {
      clearTimeout(titleSaveTimeoutRef.current);
    }

    titleSaveTimeoutRef.current = setTimeout(() => {
      titleSaveTimeoutRef.current = null;
      pendingTitleSaveRef.current = saveCurrentTitle(user.uid, titleDraft).catch((error) => {
        setErrorMessage(getErrorMessage(error, "Failed to save title."));
      });
    }, 450);

    return () => {
      if (titleSaveTimeoutRef.current) {
        clearTimeout(titleSaveTimeoutRef.current);
        titleSaveTimeoutRef.current = null;
      }
    };
  }, [currentTitle, hydratedTitleRef, pendingTitleSaveRef, setErrorMessage, titleDraft, titleSaveTimeoutRef, user]);
}

export function useTimerLiveData(user: User | null, busy: string | null, setErrorMessage: SetError) {
  const [currentState, setCurrentState] = useState<CurrentState>(emptyCurrentState);
  const [titleDraft, setTitleDraft] = useState("");
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const hydratedTitleRef = useRef(false);
  const titleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTitleSaveRef = useRef<Promise<void>>(Promise.resolve());

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
        currentHistoryEventId: data.currentHistoryEventId ?? null,
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
    pendingTitleSaveRef,
    setErrorMessage,
    titleDraft,
    titleSaveTimeoutRef
  });

  const prepareTitleForActionSelection = useCallback(async () => {
    if (titleSaveTimeoutRef.current) {
      clearTimeout(titleSaveTimeoutRef.current);
      titleSaveTimeoutRef.current = null;
    }

    await pendingTitleSaveRef.current;
  }, []);

  return {
    currentState,
    titleDraft,
    setTitleDraft,
    actions,
    history,
    prepareTitleForActionSelection
  };
}
