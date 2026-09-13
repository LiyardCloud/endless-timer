"use client";

import { useState, type FormEvent } from "react";
import type { User } from "firebase/auth";

import { createAction, findHistoryEventIdAtStart, removeAction, selectAction, updateAction } from "@/lib/firestore";
import { logClientEvent } from "@/lib/client-logs";
import { normalizeActionIconName } from "@/lib/action-icons";
import type { ActionItem, CurrentState, HistoryEvent } from "@/lib/types";
import { emptyDraft } from "@/components/endless-timer/constants";
import type { ActionDraft, ActionMode } from "@/components/endless-timer/types";
import { getErrorMessage, type SetBusy, type SetError } from "@/components/endless-timer/hooks/shared";

export function useActionManagement(params: {
  user: User | null;
  currentState: CurrentState;
  history: HistoryEvent[];
  setBusy: SetBusy;
  setErrorMessage: SetError;
  setTitleDraft: (title: string) => void;
  titleDraft: string;
  prepareTitleForActionSelection: () => Promise<void>;
}) {
  const { user, currentState, history, setBusy, setErrorMessage, setTitleDraft, titleDraft, prepareTitleForActionSelection } =
    params;
  const [actionDraft, setActionDraft] = useState<ActionDraft>(emptyDraft);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>("select");
  const [actionDeleteTarget, setActionDeleteTarget] = useState<ActionItem | null>(null);

  async function resolveCurrentHistoryEventId() {
    if (currentState.currentHistoryEventId) {
      return currentState.currentHistoryEventId;
    }

    if (!user || !currentState.currentStartedAt) {
      return null;
    }

    return findHistoryEventIdAtStart(user.uid, currentState.currentStartedAt);
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
      await prepareTitleForActionSelection();
      await selectAction({
        userId: user.uid,
        action,
        previousHistoryEventId: await resolveCurrentHistoryEventId(),
        previousTitle: snapshotTitle
      });
      setTitleDraft("");
      logClientEvent("activity-changed", { actionName: action.name });
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
