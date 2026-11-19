import { NextResponse } from "next/server";
import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import { timingSafeEqual } from "node:crypto";

import { hashApiKeySecret, parseApiKey } from "@/lib/api-keys";

export type ParsedApiKey = NonNullable<ReturnType<typeof parseApiKey>>;

function isSafePathSegment(value: string) {
  return value.length > 0 && !value.includes("/") && value !== "." && value !== "..";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

/** Parses the `Authorization: Bearer <key>` header without touching Firestore. */
export function getApiKeyFromRequest(request: Request): ParsedApiKey | null {
  const token = getBearerToken(request);
  const parsedKey = token ? parseApiKey(token) : null;

  if (!parsedKey || !isSafePathSegment(parsedKey.userId) || !isSafePathSegment(parsedKey.keyId)) {
    return null;
  }

  return parsedKey;
}

/** Returns the API key document reference when the key exists, is not revoked and the secret matches. */
export async function verifyApiKey(db: Firestore, parsedKey: ParsedApiKey): Promise<DocumentReference | null> {
  const apiKeyRef = db.doc(`users/${parsedKey.userId}/api_keys/${parsedKey.keyId}`);
  const [apiKeySnapshot, incomingHash] = await Promise.all([apiKeyRef.get(), hashApiKeySecret(parsedKey.secret)]);
  const apiKeyData = apiKeySnapshot.data();

  if (!apiKeyData?.secretHash || apiKeyData.revokedAt || !safeEqual(incomingHash, apiKeyData.secretHash)) {
    return null;
  }

  return apiKeyRef;
}

export function missingApiKeyResponse() {
  return NextResponse.json({ error: "Missing or invalid API key." }, { status: 401 });
}

export function inactiveApiKeyResponse() {
  return NextResponse.json({ error: "API key is not active." }, { status: 401 });
}

export function apiErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;

  if (message.includes("Firebase Admin credentials")) {
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
