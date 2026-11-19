import { NextResponse, type NextRequest } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

import { mapServerAction, toApiActivity } from "@/lib/api-activity";
import { apiErrorResponse, getApiKeyFromRequest, inactiveApiKeyResponse, missingApiKeyResponse, verifyApiKey } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const parsedKey = getApiKeyFromRequest(request);

  if (!parsedKey) {
    return missingApiKeyResponse();
  }

  try {
    const db = getAdminDb();
    // Key verification and data read run in parallel; data is returned only for a verified key.
    const [apiKeyRef, actionsSnapshot] = await Promise.all([
      verifyApiKey(db, parsedKey),
      db.collection(`users/${parsedKey.userId}/actions`).orderBy("createdAt", "asc").get()
    ]);

    if (!apiKeyRef) {
      return inactiveApiKeyResponse();
    }

    await apiKeyRef.update({ lastUsedAt: Timestamp.now() });

    return NextResponse.json(
      actionsSnapshot.docs.map((docSnapshot) => toApiActivity(mapServerAction(docSnapshot.id, docSnapshot.data())))
    );
  } catch (error) {
    return apiErrorResponse(error, "Failed to load activities.");
  }
}
