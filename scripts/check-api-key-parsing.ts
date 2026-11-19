/**
 * Round-trip check for API key formatting/parsing.
 *
 * Run: npx tsx scripts/check-api-key-parsing.ts [iterations]
 */
import { createApiKeySecret, formatApiKey, parseApiKey } from "../src/lib/api-keys";

const ALNUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
// Includes `?`, `>`, `~` so that base64url(userId) regularly contains `_` and `-`.
const USER_ID_CHARS = `${ALNUM}?>~`;

function randomString(chars: string, length: number) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);

  return [...bytes].map((byte) => chars[byte % chars.length]).join("");
}

const iterations = Number(process.argv[2] ?? 10_000);
let failures = 0;
let secretsWithUnderscore = 0;
let userIdsWithUnderscore = 0;

function fail(message: string) {
  failures += 1;
  if (failures <= 10) {
    console.error(`FAIL: ${message}`);
  }
}

for (let index = 0; index < iterations; index += 1) {
  // Half Firebase-like uids (28 alnum), half random-length ids with `_`-producing chars.
  const userId = index % 2 === 0 ? randomString(ALNUM, 28) : randomString(USER_ID_CHARS, 1 + (index % 40));
  const keyId = randomString(ALNUM, 20);
  const secret = createApiKeySecret();
  const key = formatApiKey({ userId, keyId, secret });

  if (secret.includes("_")) secretsWithUnderscore += 1;
  if (key.slice(3, key.length - 65).includes("_")) userIdsWithUnderscore += 1;

  const parsed = parseApiKey(key);

  if (!parsed || parsed.userId !== userId || parsed.keyId !== keyId || parsed.secret !== secret) {
    fail(`round-trip mismatch for ${key}: ${JSON.stringify(parsed)}`);
  }
}

const sampleKey = formatApiKey({ userId: "user1234567890", keyId: randomString(ALNUM, 20), secret: createApiKeySecret() });
const invalidInputs: string[] = [
  "",
  "   ",
  "et_wrong",
  "et_",
  "et___",
  sampleKey.replace(/^et_/, "xx_"),
  sampleKey.replace(/^et_/, "ET_"),
  sampleKey.replace(/^et_/, ""),
  // keyId of wrong length / with non-alnum chars
  `et_dXNlcg_${"a".repeat(19)}_${createApiKeySecret()}`,
  `et_dXNlcg_${"a".repeat(21)}_${createApiKeySecret()}`,
  `et_dXNlcg_${"a".repeat(19)}-_${createApiKeySecret()}`,
  // missing userId
  `et__${"a".repeat(20)}_${createApiKeySecret()}`,
  // secret of wrong length
  `et_dXNlcg_${"a".repeat(20)}_${createApiKeySecret().slice(1)}`,
  `et_dXNlcg_${"a".repeat(20)}_${createApiKeySecret()}x`,
  `et_dXNlcg_${"a".repeat(20)}_`
];

for (const input of invalidInputs) {
  const parsed = parseApiKey(input);
  if (parsed !== null) {
    fail(`expected null for ${JSON.stringify(input)}, got ${JSON.stringify(parsed)}`);
  }
}

// Explicit case: a secret containing `_` must parse.
const underscoreSecret = `abc_def${"x".repeat(36)}`;
const explicit = parseApiKey(formatApiKey({ userId: "uid_test", keyId: "A".repeat(20), secret: underscoreSecret }));
if (!explicit || explicit.secret !== underscoreSecret || explicit.userId !== "uid_test" || explicit.keyId !== "A".repeat(20)) {
  fail(`explicit underscore secret failed: ${JSON.stringify(explicit)}`);
}

console.log(
  `iterations=${iterations} secretsWithUnderscore=${secretsWithUnderscore} userIdsWithUnderscore=${userIdsWithUnderscore} invalidCases=${invalidInputs.length} failures=${failures}`
);

if (failures > 0) {
  process.exit(1);
}
console.log("OK");
