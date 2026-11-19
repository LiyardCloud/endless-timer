import { NextResponse, type NextRequest } from "next/server";

import { isValidDocumentId, mapCurrentState, mapServerAction, switchUserActivity } from "@/lib/api-activity";
import { apiErrorResponse, getApiKeyFromRequest, inactiveApiKeyResponse, missingApiKeyResponse, verifyApiKey } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import type { UserRecord } from "@/lib/types";

export const runtime = "nodejs";

async function readActionId(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const actionId = body && typeof body === "object" ? (body as { actionId?: unknown }).actionId : undefined;

    return isValidDocumentId(actionId) ? actionId : null;
  } catch {
    return null;
  }
}

function invalidActionResponse() {
  return NextResponse.json({ error: "Provide a valid actionId of one of your activities." }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const parsedKey = getApiKeyFromRequest(request);

  if (!parsedKey) {
    return missingApiKeyResponse();
  }

  const actionId = await readActionId(request);

  try {
    const db = getAdminDb();

    if (!actionId) {
      // An invalid key must still be reported as 401, even with a malformed body.
      return (await verifyApiKey(db, parsedKey)) ? invalidActionResponse() : inactiveApiKeyResponse();
    }

    const userRef = db.doc(`users/${parsedKey.userId}`);
    // Key verification and the reads needed for the switch run in parallel; nothing is written
    // or returned unless the key is verified.
    const [apiKeyRef, userSnapshot, actionSnapshot] = await Promise.all([
      verifyApiKey(db, parsedKey),
      userRef.get(),
      userRef.collection("actions").doc(actionId).get()
    ]);

    if (!apiKeyRef) {
      return inactiveApiKeyResponse();
    }

    const userData = userSnapshot.data() as UserRecord | undefined;

    if (!userData) {
      return NextResponse.json({ error: "User was not found." }, { status: 404 });
    }

    const actionData = actionSnapshot.data();

    if (!actionData) {
      return invalidActionResponse();
    }

    const current = await switchUserActivity({
      db,
      userRef,
      userId: parsedKey.userId,
      state: mapCurrentState(userData),
      action: mapServerAction(actionSnapshot.id, actionData),
      apiKeyRef
    });

    return NextResponse.json(current);
  } catch (error) {
    return apiErrorResponse(error, "Failed to switch activity.");
  }
}
