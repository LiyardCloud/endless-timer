import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { ActionItem } from "@/lib/types";
import { DEFAULT_ACTIONS } from "@/lib/default-actions";
import { getApiKeyPrefix } from "@/lib/api-keys";

function requireDb() {
  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  return db;
}

export function userRef(userId: string) {
  return doc(requireDb(), "users", userId);
}

export function actionsRef(userId: string) {
  return collection(requireDb(), "users", userId, "actions");
}

export function historyRef(userId: string) {
  return collection(requireDb(), "users", userId, "history_events");
}

export function apiKeysRef(userId: string) {
  return collection(requireDb(), "users", userId, "api_keys");
}

export async function bootstrapUser(user: User) {
  const userDoc = userRef(user.uid);
  const existingUser = await getDoc(userDoc);

  if (!existingUser.exists()) {
    await setDoc(userDoc, {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      currentTitle: "",
      currentActionId: null,
      currentActionName: null,
      currentActionColor: null,
      currentActionIcon: null,
      currentHistoryEventId: null,
      currentStartedAt: null
    });
  } else {
    const existingData = existingUser.data();
    const profileChanged =
      existingData.displayName !== user.displayName ||
      existingData.email !== user.email ||
      existingData.photoURL !== user.photoURL;

    if (profileChanged) {
      await setDoc(
        userDoc,
        {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    }
  }

  const existingActions = await getDocs(query(actionsRef(user.uid), limit(1)));

  if (!existingActions.empty) {
    return;
  }

  await Promise.all(
    DEFAULT_ACTIONS.map((action) =>
      addDoc(actionsRef(user.uid), {
        ...action,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    )
  );
}

export async function createAction(userId: string, action: Omit<ActionItem, "id">) {
  await addDoc(actionsRef(userId), {
    ...action,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateAction(userId: string, actionId: string, action: Partial<ActionItem>) {
  await updateDoc(doc(actionsRef(userId), actionId), {
    ...action,
    updatedAt: serverTimestamp()
  });
}

export async function removeAction(userId: string, actionId: string) {
  await deleteDoc(doc(actionsRef(userId), actionId));
}

export async function removeHistoryEvent(userId: string, eventId: string) {
  await deleteDoc(doc(historyRef(userId), eventId));
}

export async function createApiKey(userId: string, key: { name: string; secretHash: string }) {
  const keyRef = doc(apiKeysRef(userId));

  await setDoc(keyRef, {
    name: key.name,
    secretHash: key.secretHash,
    prefix: getApiKeyPrefix(),
    createdAt: serverTimestamp(),
    lastUsedAt: null,
    revokedAt: null
  });

  return keyRef.id;
}

export async function revokeApiKey(userId: string, keyId: string) {
  await updateDoc(doc(apiKeysRef(userId), keyId), {
    revokedAt: serverTimestamp()
  });
}

export async function updateHistoryEvent(
  userId: string,
  eventId: string,
  event: {
    actionId: string;
    actionName: string;
    actionColor: string;
    actionIcon: string;
    titleSnapshot: string;
    startedAt: Date;
  }
) {
  await updateDoc(doc(historyRef(userId), eventId), {
    ...event,
    updatedAt: serverTimestamp()
  });
}

export async function saveCurrentTitle(userId: string, title: string) {
  await updateDoc(userRef(userId), {
    currentTitle: title,
    updatedAt: serverTimestamp()
  });
}

export async function selectAction(params: {
  userId: string;
  action: ActionItem;
  previousHistoryEventId: string | null;
  previousTitle: string;
}) {
  const { userId, action, previousHistoryEventId, previousTitle } = params;
  const database = requireDb();
  const selectedAt = serverTimestamp();
  const nextHistoryEventRef = doc(historyRef(userId));
  const batch = writeBatch(database);

  if (previousHistoryEventId) {
    batch.update(doc(historyRef(userId), previousHistoryEventId), {
      titleSnapshot: previousTitle,
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

  batch.update(userRef(userId), {
    currentTitle: "",
    currentActionId: action.id,
    currentActionName: action.name,
    currentActionColor: action.color,
    currentActionIcon: action.icon,
    currentHistoryEventId: nextHistoryEventRef.id,
    currentStartedAt: selectedAt,
    updatedAt: selectedAt
  });

  await batch.commit();
}

export function historyQuery(userId: string) {
  return query(historyRef(userId), orderBy("startedAt", "desc"));
}

export function actionsQuery(userId: string) {
  return query(actionsRef(userId), orderBy("createdAt", "asc"));
}

export function apiKeysQuery(userId: string) {
  return query(apiKeysRef(userId), orderBy("createdAt", "desc"));
}
