"use client";

import { useEffect, useState } from "react";

import { useActionManagement } from "@/components/endless-timer/hooks/use-action-management";
import { useApiKeyManagement } from "@/components/endless-timer/hooks/use-api-key-management";
import { useAuthSession } from "@/components/endless-timer/hooks/use-auth-session";
import { useHistoryEventManagement } from "@/components/endless-timer/hooks/use-history-event-management";
import { useTimerLiveData } from "@/components/endless-timer/hooks/use-timer-live-data";

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

export function useEndlessTimerState() {
  const [busy, setBusy] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const authSession = useAuthSession(setBusy, setErrorMessage);
  const timerData = useTimerLiveData(authSession.user, busy, setErrorMessage);
  const clockNow = useClockNow();
  const apiKeyManagement = useApiKeyManagement({
    user: authSession.user,
    setBusy,
    setErrorMessage
  });
  const actionManagement = useActionManagement({
    user: authSession.user,
    currentState: timerData.currentState,
    history: timerData.history,
    setBusy,
    setErrorMessage,
    setTitleDraft: timerData.setTitleDraft,
    titleDraft: timerData.titleDraft,
    prepareTitleForActionSelection: timerData.prepareTitleForActionSelection
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
    ...apiKeyManagement,
    ...actionManagement,
    ...historyEventManagement
  };
}

export type EndlessTimerState = ReturnType<typeof useEndlessTimerState>;
