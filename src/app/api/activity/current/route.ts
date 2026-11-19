import { NextResponse, type NextRequest } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

import { mapCurrentState, toApiCurrentActivity } from "@/lib/api-activity";
import { apiErrorResponse, getApiKeyFromRequest, inactiveApiKeyResponse, missingApiKeyResponse, verifyApiKey } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import type { UserRecord } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const parsedKey = getApiKeyFromRequest(request);

  if (!parsedKey) {
    return missingApiKeyResponse();
  }

  try {
    const db = getAdminDb();
    // Key verification and data read run in parallel; data is returned only for a verified key.
    const [apiKeyRef, userSnapshot] = await Promise.all([
      verifyApiKey(db, parsedKey),
      db.doc(`users/${parsedKey.userId}`).get()
    ]);

    if (!apiKeyRef) {
      return inactiveApiKeyResponse();
    }

    const userData = userSnapshot.data() as UserRecord | undefined;

    if (!userData) {
      return NextResponse.json({ error: "User was not found." }, { status: 404 });
    }

    await apiKeyRef.update({ lastUsedAt: Timestamp.now() });

    return NextResponse.json(toApiCurrentActivity(mapCurrentState(userData)));
  } catch (error) {
    return apiErrorResponse(error, "Failed to load current activity.");
  }
}
