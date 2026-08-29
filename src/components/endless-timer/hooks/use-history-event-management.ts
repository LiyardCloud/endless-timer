"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

import { removeHistoryEvent, updateHistoryEvent } from "@/lib/firestore";
import type { ActionItem, CurrentState, HistoryEvent } from "@/lib/types";
import { emptyHistoryEditDraft } from "@/components/endless-timer/constants";
import {
  formatDateTimeLocalValue,
  getHistoryNeighbors,
  parseDateTimeLocalValue
} from "@/components/endless-timer/helpers";
import type { HistoryEditDraft } from "@/components/endless-timer/types";
import { getErrorMessage, type SetBusy, type SetError } from "@/components/endless-timer/hooks/shared";

export function useHistoryEventManagement(params: {
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
