import { NextResponse, type NextRequest } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

import { mapCurrentState, mapServerAction } from "@/lib/api-activity";
import { apiErrorResponse, getApiKeyFromRequest, inactiveApiKeyResponse, missingApiKeyResponse, verifyApiKey } from "@/lib/api-auth";
import { buildDataExport, validateExportRange } from "@/lib/export-data";
import { getAdminDb } from "@/lib/firebase-admin";
import type { HistoryEvent, UserRecord } from "@/lib/types";

export const runtime = "nodejs";

function mapServerHistory(id: string, data: FirebaseFirestore.DocumentData): HistoryEvent {
  return {
    id,
    actionId: data.actionId,
    actionName: data.actionName,
    actionColor: data.actionColor,
    actionIcon: data.actionIcon,
    titleSnapshot: data.titleSnapshot ?? "",
    userId: data.userId,
    startedAt: data.startedAt ?? null,
    updatedAt: data.updatedAt ?? null
  };
}

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const range = from && to ? validateExportRange(from, to) : null;

  if (!range) {
    return NextResponse.json({ error: "Provide a valid from/to period as YYYY-MM-DD." }, { status: 400 });
  }

  const parsedKey = getApiKeyFromRequest(request);

  if (!parsedKey) {
    return missingApiKeyResponse();
  }

  try {
    const db = getAdminDb();
    const apiKeyRef = await verifyApiKey(db, parsedKey);

    if (!apiKeyRef) {
      return inactiveApiKeyResponse();
    }

    const userRef = db.doc(`users/${parsedKey.userId}`);
    const [userSnapshot, actionsSnapshot, historySnapshot] = await Promise.all([
      userRef.get(),
      userRef.collection("actions").orderBy("createdAt", "asc").get(),
      userRef
        .collection("history_events")
        .where("startedAt", "<", Timestamp.fromDate(new Date(range.toMs)))
        .orderBy("startedAt", "asc")
        .get()
    ]);
    const userData = userSnapshot.data() as UserRecord | undefined;

    if (!userSnapshot.exists || !userData) {
      return NextResponse.json({ error: "User was not found." }, { status: 404 });
    }

    await apiKeyRef.update({
      lastUsedAt: Timestamp.now()
    });

    return NextResponse.json(
      buildDataExport({
        user: {
          uid: parsedKey.userId,
          displayName: userData.displayName ?? null,
          email: userData.email ?? null,
          photoURL: userData.photoURL ?? null
        },
        currentState: mapCurrentState(userData),
        actions: actionsSnapshot.docs.map((docSnapshot) => mapServerAction(docSnapshot.id, docSnapshot.data())),
        history: historySnapshot.docs.map((docSnapshot) => mapServerHistory(docSnapshot.id, docSnapshot.data())),
        from: range.from,
        to: range.to
      })
    );
  } catch (error) {
    return apiErrorResponse(error, "Export failed.");
  }
}
