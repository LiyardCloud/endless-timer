"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";

import { createApiKey, apiKeysQuery, revokeApiKey } from "@/lib/firestore";
import { createApiKeySecret, formatApiKey, hashApiKeySecret } from "@/lib/api-keys";
import { mapApiKey } from "@/lib/firestore-mappers";
import type { ApiKeyRecord } from "@/lib/types";
import { getErrorMessage, type SetBusy, type SetError } from "@/components/endless-timer/hooks/shared";

export function useApiKeyManagement(params: {
  user: User | null;
  setBusy: SetBusy;
  setErrorMessage: SetError;
}) {
  const { user, setBusy, setErrorMessage } = params;
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [apiKeyName, setApiKeyName] = useState("External export");
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setApiKeys([]);
      setNewApiKey(null);
      return;
    }

    const unsubscribe = onSnapshot(apiKeysQuery(user.uid), (snapshot) => {
      setApiKeys(snapshot.docs.map(mapApiKey));
    });

    return () => unsubscribe();
  }, [user]);

  async function handleApiKeySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    try {
      setBusy("create-api-key");
      const secret = createApiKeySecret();
      const secretHash = await hashApiKeySecret(secret);
      const keyId = await createApiKey(user.uid, {
        name: apiKeyName.trim() || "External export",
        secretHash
      });

      setNewApiKey(formatApiKey({ userId: user.uid, keyId, secret }));
      setApiKeyName("External export");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to create API key."));
    } finally {
      setBusy(null);
    }
  }

  async function handleRevokeApiKey(keyId: string) {
    if (!user) {
      return;
    }

    try {
      setBusy(`revoke-api-key-${keyId}`);
      await revokeApiKey(user.uid, keyId);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to revoke API key."));
    } finally {
      setBusy(null);
    }
  }

  return {
    apiKeys,
    apiKeyName,
    newApiKey,
    setApiKeyName,
    setNewApiKey,
    handleApiKeySubmit,
    handleRevokeApiKey
  };
}
