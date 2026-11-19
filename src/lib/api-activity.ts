import { FieldValue, Timestamp, type DocumentReference, type Firestore } from "firebase-admin/firestore";

import { normalizeActionIconName } from "@/lib/action-icons";
import type { ActionItem, CurrentState, UserRecord } from "@/lib/types";

export type ApiActivity = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

export type ApiCurrentActivity = {
  actionId: string | null;
  name: string | null;
  color: string | null;
  icon: string | null;
  title: string;
  startedAt: string | null;
};

type TimestampLike = { toDate(): Date } | null | undefined;

export function mapServerAction(id: string, data: FirebaseFirestore.DocumentData): ActionItem {
  return {
    id,
    name: data.name,
    color: data.color,
    icon: data.icon,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null
  };
}

export function mapCurrentState(data: UserRecord): CurrentState {
  return {
    currentTitle: data.currentTitle ?? "",
    currentActionId: data.currentActionId ?? null,
    currentActionName: data.currentActionName ?? null,
    currentActionColor: data.currentActionColor ?? null,
    currentActionIcon: data.currentActionIcon ?? null,
    currentHistoryEventId: data.currentHistoryEventId ?? null,
    currentStartedAt: data.currentStartedAt ?? null
  };
}

function toIsoString(value: TimestampLike) {
  return value && typeof value.toDate === "function" ? value.toDate().toISOString() : null;
}

export function toApiActivity(action: ActionItem): ApiActivity {
  return {
    id: action.id,
    name: action.name,
    color: action.color,
    icon: normalizeActionIconName(action.icon ?? "brain")
  };
}

export function toApiCurrentActivity(state: CurrentState): ApiCurrentActivity {
  if (!state.currentActionId) {
    return { actionId: null, name: null, color: null, icon: null, title: state.currentTitle, startedAt: null };
  }

  return {
    actionId: state.currentActionId,
    name: state.currentActionName,
    color: state.currentActionColor,
    icon: state.currentActionIcon ? normalizeActionIconName(state.currentActionIcon) : null,
    title: state.currentTitle,
    startedAt: toIsoString(state.currentStartedAt as TimestampLike)
  };
}

/** Accepts only values usable as a single Firestore document id. */
export function isValidDocumentId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 1500 &&
    !value.includes("/") &&
    value !== "." &&
    value !== ".." &&
    !/^__.*__$/.test(value)
  );
}

async function resolvePreviousHistoryEventId(userRef: DocumentReference, state: CurrentState) {
  if (state.currentHistoryEventId) {
    return state.currentHistoryEventId;
  }

  // Legacy users without currentHistoryEventId: same fallback as the app (findHistoryEventIdAtStart).
  if (!state.currentStartedAt) {
    return null;
  }

  const snapshot = await userRef
    .collection("history_events")
    .where("startedAt", "==", state.currentStartedAt)
    .limit(1)
    .get();

  return snapshot.docs[0]?.id ?? null;
}

/**
 * Server-side equivalent of `selectAction` in `src/lib/firestore.ts`: one batch that snapshots the
 * current title into the previous history event, appends a new history event and moves the user's
 * current state to the selected action. Selecting the current action again still appends an event.
 */
export async function switchUserActivity(params: {
  db: Firestore;
  userRef: DocumentReference;
  userId: string;
  state: CurrentState;
  action: ActionItem;
  apiKeyRef?: DocumentReference;
}): Promise<ApiCurrentActivity> {
  const { db, userRef, userId, state, apiKeyRef } = params;
  const action = { ...params.action, icon: normalizeActionIconName(params.action.icon ?? "brain") };
  const history = userRef.collection("history_events");
  const previousHistoryEventId = await resolvePreviousHistoryEventId(userRef, state);
  const selectedAt = FieldValue.serverTimestamp();
  const nextHistoryEventRef = history.doc();
  const batch = db.batch();

  if (previousHistoryEventId) {
    batch.update(history.doc(previousHistoryEventId), {
      titleSnapshot: state.currentTitle,
      updatedAt: selectedAt
    });
  }

  batch.set(nextHistoryEventRef, {
    actionId: action.id,
    actionName: action.name,
    actionColor: action.color,
    actionIcon: action.icon,
    titleSnapshot: "",
    userId,
    startedAt: selectedAt
  });

  batch.update(userRef, {
    currentTitle: "",
    currentActionId: action.id,
    currentActionName: action.name,
    currentActionColor: action.color,
    currentActionIcon: action.icon,
    currentHistoryEventId: nextHistoryEventRef.id,
    currentStartedAt: selectedAt,
    updatedAt: selectedAt
  });

  if (apiKeyRef) {
    batch.update(apiKeyRef, { lastUsedAt: Timestamp.now() });
  }

  const writeResults = await batch.commit();
  // Server timestamps resolve to the commit time, so no extra read is needed for startedAt.
  const committedAt = writeResults[0]?.writeTime;

  return {
    actionId: action.id,
    name: action.name,
    color: action.color,
    icon: action.icon,
    title: "",
    startedAt: toIsoString(committedAt)
  };
}
