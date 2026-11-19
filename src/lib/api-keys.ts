const API_KEY_PREFIX = "et";
const API_KEY_SECRET_BYTES = 32;

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToString(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");

  return atob(padded);
}

function stringToBase64Url(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function digestSha256(value: string) {
  const cryptoApi = globalThis.crypto;

  if (cryptoApi?.subtle) {
    const encoded = new TextEncoder().encode(value);
    const digest = await cryptoApi.subtle.digest("SHA-256", encoded);

    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  throw new Error("Web Crypto is not available.");
}

export function getApiKeyPrefix() {
  return API_KEY_PREFIX;
}

export function createApiKeySecret() {
  const bytes = new Uint8Array(API_KEY_SECRET_BYTES);
  globalThis.crypto.getRandomValues(bytes);

  return bytesToBase64Url(bytes);
}

export function formatApiKey(params: { userId: string; keyId: string; secret: string }) {
  return [API_KEY_PREFIX, stringToBase64Url(params.userId), params.keyId, params.secret].join("_");
}

/**
 * Key format: `et_<base64url(userId)>_<keyId>_<secret>`.
 *
 * Both the encoded userId and the secret are base64url and may themselves contain `_`,
 * so the key cannot be split on `_`. It is parsed from the end, where every part has a
 * fixed shape, which makes the split unambiguous:
 * - secret: always exactly 43 base64url chars (32 random bytes, unpadded);
 * - keyId: Firestore auto-id, exactly 20 chars `[A-Za-z0-9]`, between `_` separators;
 * - userId: everything between `et_` and `_<keyId>_` (non-empty base64url).
 */
const API_KEY_PATTERN = /^et_([A-Za-z0-9_-]+)_([A-Za-z0-9]{20})_([A-Za-z0-9_-]{43})$/;

export function parseApiKey(value: string) {
  const match = API_KEY_PATTERN.exec(value.trim());

  if (!match) {
    return null;
  }

  const [, encodedUserId, keyId, secret] = match;

  try {
    const userId = base64UrlToString(encodedUserId);

    return userId ? { userId, keyId, secret } : null;
  } catch {
    return null;
  }
}

export async function hashApiKeySecret(secret: string) {
  return digestSha256(secret);
}
