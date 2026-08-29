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

export function parseApiKey(value: string) {
  const [prefix, encodedUserId, keyId, secret, ...rest] = value.trim().split("_");

  if (prefix !== API_KEY_PREFIX || !encodedUserId || !keyId || !secret || rest.length) {
    return null;
  }

  try {
    return {
      userId: base64UrlToString(encodedUserId),
      keyId,
      secret
    };
  } catch {
    return null;
  }
}

export async function hashApiKeySecret(secret: string) {
  return digestSha256(secret);
}
