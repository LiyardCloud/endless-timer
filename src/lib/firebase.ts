import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
  type Auth
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { logClientEvent } from "@/lib/client-logs";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const isConfigured = Object.values(firebaseConfig).every(Boolean);

const app = isConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

// Auth is created without a popupRedirectResolver: getAuth() would attach
// browserPopupRedirectResolver, which on iOS/Safari/mobile makes Auth load gapi and
// the authDomain iframe and check for a redirect result before resolving the user.
// We only use signInWithPopup, which receives the resolver explicitly.
function createAuth(firebaseApp: FirebaseApp): Auth {
  logClientEvent("auth-init-start");

  try {
    return initializeAuth(firebaseApp, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence]
    });
  } catch (error) {
    // Already initialized (e.g. module re-evaluated by HMR): reuse the existing instance.
    if ((error as { code?: string } | null)?.code === "auth/already-initialized") {
      return getAuth(firebaseApp);
    }
    throw error;
  }
}

export const auth = app ? createAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = app ? new GoogleAuthProvider() : null;
export const firebaseConfigured = isConfigured;
