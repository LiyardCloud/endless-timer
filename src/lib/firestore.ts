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
  updateDoc
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { ActionItem } from "@/lib/types";
import { DEFAULT_ACTIONS } from "@/lib/default-actions";

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
      currentStartedAt: null
    });
  } else {
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

export async function saveCurrentTitle(userId: string, title: string) {
  await updateDoc(userRef(userId), {
    currentTitle: title,
    updatedAt: serverTimestamp()
  });
}

export async function selectAction(params: {
  userId: string;
  action: ActionItem;
  title: string;
}) {
  const { userId, action, title } = params;

  await addDoc(historyRef(userId), {
    actionId: action.id,
    actionName: action.name,
    actionColor: action.color,
    actionIcon: action.icon,
    titleSnapshot: title,
    userId,
    startedAt: serverTimestamp()
  });

  await updateDoc(userRef(userId), {
    currentTitle: "",
    currentActionId: action.id,
    currentActionName: action.name,
    currentActionColor: action.color,
    currentActionIcon: action.icon,
    currentStartedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export function latestHistoryQuery(userId: string) {
  return query(historyRef(userId), orderBy("startedAt", "desc"), limit(50));
}

export function historyQuery(userId: string) {
  return query(historyRef(userId), orderBy("startedAt", "desc"));
}

export function actionsQuery(userId: string) {
  return query(actionsRef(userId), orderBy("createdAt", "asc"));
}
