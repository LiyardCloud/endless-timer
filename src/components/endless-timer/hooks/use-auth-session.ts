"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";

import { bootstrapUser } from "@/lib/firestore";
import { auth, googleProvider } from "@/lib/firebase";
import { getErrorMessage, type SetBusy, type SetError } from "@/components/endless-timer/hooks/shared";

export function useAuthSession(setBusy: SetBusy, setErrorMessage: SetError) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
      setErrorMessage(null);

      if (!nextUser) {
        return;
      }

      try {
        await bootstrapUser(nextUser);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Failed to bootstrap user."));
      }
    });

    return () => unsubscribe();
  }, [setErrorMessage]);

  async function handleGoogleSignIn() {
    if (!auth || !googleProvider) {
      return;
    }

    try {
      setBusy("sign-in");
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Sign-in failed."));
    } finally {
      setBusy(null);
    }
  }

  async function handleSignOut() {
    if (!auth) {
      return;
    }

    try {
      setBusy("sign-out");
      await signOut(auth);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Sign-out failed."));
    } finally {
      setBusy(null);
    }
  }

  return {
    user,
    authLoading,
    handleGoogleSignIn,
    handleSignOut
  };
}
