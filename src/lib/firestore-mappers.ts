import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import { normalizeActionIconName } from "@/lib/action-icons";
import type { ActionItem, HistoryEvent } from "@/lib/types";

export function mapAction(docSnapshot: QueryDocumentSnapshot<DocumentData>): ActionItem {
  const data = docSnapshot.data();

  return {
    id: docSnapshot.id,
    name: data.name,
    color: data.color,
    icon: normalizeActionIconName(data.icon ?? "brain"),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null
  };
}

export function mapHistory(docSnapshot: QueryDocumentSnapshot<DocumentData>): HistoryEvent {
  const data = docSnapshot.data();

  return {
    id: docSnapshot.id,
    actionId: data.actionId,
    actionName: data.actionName,
    actionColor: data.actionColor,
    actionIcon: normalizeActionIconName(data.actionIcon ?? "brain"),
    titleSnapshot: data.titleSnapshot ?? "",
    userId: data.userId,
    startedAt: data.startedAt ?? null,
    updatedAt: data.updatedAt ?? null
  };
}
