"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  isIos: boolean;
  installApp: () => Promise<boolean>;
};

const PwaContext = createContext<PwaContextValue>({
  canInstall: false,
  isInstalled: false,
  isIos: false,
  installApp: async () => false
});

export function PwaProvider({ children }: { children?: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const updateInstalledState = () => {
      const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsInstalled(mediaQuery.matches || iosStandalone);
    };

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(userAgent));
    updateInstalledState();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    if (!("serviceWorker" in navigator)) {
      return;
    }

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]";

    if (window.location.protocol !== "https:" && !isLocalhost) {
      return;
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    mediaQuery.addEventListener("change", updateInstalledState);
    void navigator.serviceWorker.register("/sw.js");

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      mediaQuery.removeEventListener("change", updateInstalledState);
    };
  }, []);

  const value = useMemo<PwaContextValue>(
    () => ({
      canInstall: deferredPrompt !== null && !isInstalled,
      isInstalled,
      isIos,
      installApp: async () => {
        if (!deferredPrompt) {
          return false;
        }

        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        return choice.outcome === "accepted";
      }
    }),
    [deferredPrompt, isInstalled, isIos]
  );

  return <PwaContext.Provider value={value}>{children ?? null}</PwaContext.Provider>;
}

export function usePwaInstall() {
  return useContext(PwaContext);
}
