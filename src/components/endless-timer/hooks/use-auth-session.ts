"use client";

import { useEffect, useState } from "react";
import {
  browserPopupRedirectResolver,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User
} from "firebase/auth";

import { bootstrapUser } from "@/lib/firestore";
import { getAuthResourceTimings, logClientEvent } from "@/lib/client-logs";
import { auth, googleProvider } from "@/lib/firebase";
import { getErrorMessage, type SetBusy, type SetError } from "@/components/endless-timer/hooks/shared";

function isDisplayModeStandalone() {
  if (typeof window === "undefined") return false;

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    navigatorWithStandalone.standalone === true
  );
}

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

      logClientEvent(nextUser ? "authentication-complete" : "authentication-missing", {
        signedIn: Boolean(nextUser),
        displayModeStandalone: isDisplayModeStandalone(),
        authResources: getAuthResourceTimings(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
      });

      if (!nextUser) {
        return;
      }

      try {
        await bootstrapUser(nextUser);
        logClientEvent("user-bootstrap-complete");
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
      await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
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
