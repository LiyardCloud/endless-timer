import { createHash } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";

import { externalSourcesMatch } from "@/lib/external-source";
import { getAdminDb } from "@/lib/firebase-admin";
import type { ExternalSource } from "@/lib/types";

type StartExternalActivityParams = {
  userId: string;
  actionId: string;
  title: string;
  source: ExternalSource;
  transitionKey: string;
};

type ExternalActivityResult = {
  applied: boolean;
  historyEventId: string | null;
};

function getTransitionReceiptId(transitionKey: string) {
  return createHash("sha256").update(transitionKey).digest("hex");
}

function serializeExternalSource(source: ExternalSource) {
  return {
    provider: source.provider,
    issueId: source.issueId,
    identifier: source.identifier,
    ...(source.url ? { url: source.url } : {})
  };
}

function assertStartExternalActivityParams(params: StartExternalActivityParams) {
  if (!params.userId || !params.actionId || !params.title || !params.transitionKey) {
    throw new Error("External activity requires a user, action, title, and transition key.");
  }

  if (!params.source.issueId || !params.source.identifier) {
    throw new Error("External activity requires a valid source issue.");
  }
}

/**
 * Starts a timer activity from an external event and records an idempotency receipt.
 * The receipt prevents a retried Linear poll from producing another history event.
 */
export async function startExternalActivity(params: StartExternalActivityParams): Promise<ExternalActivityResult> {
  assertStartExternalActivityParams(params);

  const db = getAdminDb();
  const userRef = db.doc(`users/${params.userId}`);
  const actionRef = userRef.collection("actions").doc(params.actionId);
  const receiptRef = db.doc(
    `integrations_private/${params.userId}/processed_transitions/${getTransitionReceiptId(params.transitionKey)}`
  );

  return db.runTransaction(async (transaction) => {
    const [receiptSnapshot, userSnapshot, actionSnapshot] = await Promise.all([
      transaction.get(receiptRef),
      transaction.get(userRef),
      transaction.get(actionRef)
    ]);

    if (receiptSnapshot.exists) {
      return {
        applied: false,
        historyEventId: (receiptSnapshot.data()?.historyEventId as string | undefined) ?? null
      };
    }

    if (!userSnapshot.exists) {
      throw new Error("Cannot start an external activity for a missing user.");
    }

    if (!actionSnapshot.exists) {
      throw new Error("The configured external activity no longer exists.");
    }

    const user = userSnapshot.data()!;
    const action = actionSnapshot.data()!;

    if (typeof action.name !== "string" || typeof action.color !== "string" || typeof action.icon !== "string") {
      throw new Error("The configured external activity is invalid.");
    }

    const now = FieldValue.serverTimestamp();
    const nextHistoryEventRef = userRef.collection("history_events").doc();
    const previousHistoryEventId = typeof user.currentHistoryEventId === "string" ? user.currentHistoryEventId : null;

    if (previousHistoryEventId) {
      transaction.update(userRef.collection("history_events").doc(previousHistoryEventId), {
        titleSnapshot: typeof user.currentTitle === "string" ? user.currentTitle : "",
        updatedAt: now
      });
    }

    transaction.create(nextHistoryEventRef, {
      actionId: actionRef.id,
      actionName: action.name,
      actionColor: action.color,
      actionIcon: action.icon,
      titleSnapshot: "",
      userId: params.userId,
      externalSource: serializeExternalSource(params.source),
      startedAt: now,
      updatedAt: now
    });

    transaction.update(userRef, {
      currentTitle: params.title,
      currentActionId: actionRef.id,
      currentActionName: action.name,
      currentActionColor: action.color,
      currentActionIcon: action.icon,
      currentHistoryEventId: nextHistoryEventRef.id,
      currentStartedAt: now,
      currentExternalSource: serializeExternalSource(params.source),
      updatedAt: now
    });

    transaction.create(receiptRef, {
      transitionKey: params.transitionKey,
      historyEventId: nextHistoryEventRef.id,
      source: serializeExternalSource(params.source),
      processedAt: now
    });

    return { applied: true, historyEventId: nextHistoryEventRef.id };
  });
}

/** Updates the title only when the requested Linear issue is still the active external source. */
export async function updateExternalTitle(params: {
  userId: string;
  source: ExternalSource;
  title: string;
}): Promise<boolean> {
  if (!params.userId || !params.title) {
    throw new Error("External title updates require a user and title.");
  }

  const db = getAdminDb();
  const userRef = db.doc(`users/${params.userId}`);

  return db.runTransaction(async (transaction) => {
    const userSnapshot = await transaction.get(userRef);

    if (!userSnapshot.exists || !externalSourcesMatch(userSnapshot.data()?.currentExternalSource, params.source)) {
      return false;
    }

    if (userSnapshot.data()?.currentTitle === params.title) {
      return false;
    }

    transaction.update(userRef, {
      currentTitle: params.title,
      updatedAt: FieldValue.serverTimestamp()
    });

    return true;
  });
}

/** Detaches a Linear issue without altering the current EndlessTimer activity. */
export async function detachExternalActivity(params: {
  userId: string;
  source: ExternalSource;
}): Promise<boolean> {
  if (!params.userId) {
    throw new Error("External activity detachment requires a user.");
  }

  const db = getAdminDb();
  const userRef = db.doc(`users/${params.userId}`);

  return db.runTransaction(async (transaction) => {
    const userSnapshot = await transaction.get(userRef);

    if (!userSnapshot.exists || !externalSourcesMatch(userSnapshot.data()?.currentExternalSource, params.source)) {
      return false;
    }

    transaction.update(userRef, {
      currentExternalSource: null,
      updatedAt: FieldValue.serverTimestamp()
    });

    return true;
  });
}
