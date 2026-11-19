"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  browserPopupRedirectResolver,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User
} from "firebase/auth";

import { bootstrapUser } from "@/lib/firestore";
import { getAuthResourceTimings, logClientEvent } from "@/lib/client-logs";
import { auth, googleProvider, prewarmPopupResolver } from "@/lib/firebase";
import { getErrorMessage, type SetBusy, type SetError } from "@/components/endless-timer/hooks/shared";

function isDisplayModeStandalone() {
  if (typeof window === "undefined") return false;

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    navigatorWithStandalone.standalone === true
  );
}

const PREWARM_TIMEOUT_MS = 5000;

export function useAuthSession(setBusy: SetBusy, setErrorMessage: SetError) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signInPreparing, setSignInPreparing] = useState(false);
  const prewarmRun = useRef(0);

  // Only for the signed-out screen: a signed-in launch must not load gapi / the authDomain iframe.
  const prewarmSignIn = useCallback(() => {
    const run = ++prewarmRun.current;
    const startedAt = performance.now();
    let finished = false;

    const finish = (outcome: "success" | "error" | "timeout", error?: unknown) => {
      if (finished) return;
      finished = true;
      if (prewarmRun.current === run) setSignInPreparing(false);
      logClientEvent("sign-in-prewarm-settled", {
        outcome,
        elapsedMs: Math.round(performance.now() - startedAt),
        error: error ? getErrorMessage(error, "unknown") : undefined
      });
    };

    setSignInPreparing(true);
    logClientEvent("sign-in-prewarm-start");

    const timeoutId = window.setTimeout(() => finish("timeout"), PREWARM_TIMEOUT_MS);
    prewarmPopupResolver().then(
      () => {
        window.clearTimeout(timeoutId);
        finish("success");
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        finish("error", error);
      }
    );
  }, []);

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
        prewarmSignIn();
        return;
      }

      // Signed in: cancel a pending prewarm's effect on the sign-in button.
      prewarmRun.current++;
      setSignInPreparing(false);

      try {
        await bootstrapUser(nextUser);
        logClientEvent("user-bootstrap-complete");
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Failed to bootstrap user."));
      }
    });

    return () => unsubscribe();
  }, [prewarmSignIn, setErrorMessage]);

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
    signInPreparing,
    handleGoogleSignIn,
    handleSignOut
  };
}
