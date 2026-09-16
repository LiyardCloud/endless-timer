import type { Timestamp } from "firebase/firestore";

export type ActionItem = {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type ExternalSource = {
  provider: "linear";
  issueId: string;
  identifier: string;
  url?: string;
};

export type CurrentState = {
  currentTitle: string;
  currentActionId: string | null;
  currentActionName: string | null;
  currentActionColor: string | null;
  currentActionIcon: string | null;
  currentHistoryEventId?: string | null;
  currentStartedAt?: Timestamp | null;
  currentExternalSource?: ExternalSource | null;
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
  externalSource?: ExternalSource | null;
  startedAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type ApiKeyRecord = {
  id: string;
  name: string;
  prefix: string;
  secretHash: string;
  createdAt?: Timestamp | null;
  lastUsedAt?: Timestamp | null;
  revokedAt?: Timestamp | null;
};
