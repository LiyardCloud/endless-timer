import { NextResponse, type NextRequest } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { timingSafeEqual } from "node:crypto";

import { hashApiKeySecret, parseApiKey } from "@/lib/api-keys";
import { buildDataExport, validateExportRange } from "@/lib/export-data";
import { getAdminDb } from "@/lib/firebase-admin";
import type { ActionItem, CurrentState, HistoryEvent, UserRecord } from "@/lib/types";

export const runtime = "nodejs";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function mapServerAction(id: string, data: FirebaseFirestore.DocumentData): ActionItem {
  return {
    id,
    name: data.name,
    color: data.color,
    icon: data.icon,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null
  };
}

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

function mapCurrentState(data: UserRecord): CurrentState {
  return {
    currentTitle: data.currentTitle ?? "",
    currentActionId: data.currentActionId ?? null,
    currentActionName: data.currentActionName ?? null,
    currentActionColor: data.currentActionColor ?? null,
    currentActionIcon: data.currentActionIcon ?? null,
    currentStartedAt: data.currentStartedAt ?? null
  };
}

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const range = from && to ? validateExportRange(from, to) : null;

  if (!range) {
    return NextResponse.json({ error: "Provide a valid from/to period as YYYY-MM-DD." }, { status: 400 });
  }

  const token = getBearerToken(request);
  const parsedKey = token ? parseApiKey(token) : null;

  if (!parsedKey) {
    return NextResponse.json({ error: "Missing or invalid API key." }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const apiKeyRef = db.doc(`users/${parsedKey.userId}/api_keys/${parsedKey.keyId}`);
    const apiKeySnapshot = await apiKeyRef.get();
    const apiKeyData = apiKeySnapshot.data();

    if (!apiKeyData?.secretHash || apiKeyData.revokedAt) {
      return NextResponse.json({ error: "API key is not active." }, { status: 401 });
    }

    const incomingHash = await hashApiKeySecret(parsedKey.secret);

    if (!safeEqual(incomingHash, apiKeyData.secretHash)) {
      return NextResponse.json({ error: "API key is not active." }, { status: 401 });
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
    const message = error instanceof Error ? error.message : "Export failed.";

    if (message.includes("Firebase Admin credentials")) {
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}
