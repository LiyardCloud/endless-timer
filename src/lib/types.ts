import type { Timestamp } from "firebase/firestore";

export type ActionItem = {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type CurrentState = {
  currentTitle: string;
  currentActionId: string | null;
  currentActionName: string | null;
  currentActionColor: string | null;
  currentActionIcon: string | null;
  currentStartedAt?: Timestamp | null;
};

export type UserRecord = CurrentState & {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type HistoryEvent = {
  id: string;
  actionId: string;
  actionName: string;
  actionColor: string;
  actionIcon: string;
  titleSnapshot: string;
  userId: string;
  startedAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};
