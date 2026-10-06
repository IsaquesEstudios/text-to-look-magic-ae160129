import { useState, useEffect, useCallback, useRef } from "react";

const PING_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`;
const PING_INTERVAL = 15_000; // 15s
const PING_TIMEOUT = 6_000;   // 6s
const CONFIRM_ATTEMPTS = 3;   // silent re-checks before declaring offline
const CONFIRM_DELAY = 2_000;  // 2s between silent re-checks
const RESUME_GRACE = 4_000;   // wait after returning from background

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ping(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT);
    await fetch(PING_URL, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

/**
 * Robust online detection. Before ever showing the offline screen it runs
 * several silent connection tests. Checks are paused while the app is in
 * background, and after returning there is a grace period so the OS can
 * restore the network before any test is made.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true); // optimistic
  const checkingRef = useRef(false);
  const resumedAtRef = useRef(0);

  const checkConnection = useCallback(async () => {
    if (checkingRef.current) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    checkingRef.current = true;
    try {
      for (let i = 0; i < CONFIRM_ATTEMPTS; i++) {
        // Ignore checks during the grace period after resume
        const sinceResume = Date.now() - resumedAtRef.current;
        if (sinceResume < RESUME_GRACE) await sleep(RESUME_GRACE - sinceResume);
        if (document.visibilityState === "hidden") return;

        if (await ping()) {
          setIsOnline(true);
          return;
        }
        if (i < CONFIRM_ATTEMPTS - 1) await sleep(CONFIRM_DELAY);
      }
      // All silent attempts failed and app is visible → really offline
      if (document.visibilityState === "visible") setIsOnline(false);
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    checkConnection();

    // Never trust browser events directly — always verify silently
    const onNetworkChange = () => checkConnection();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        resumedAtRef.current = Date.now();
        checkConnection();
      }
    };

    window.addEventListener("offline", onNetworkChange);
    window.addEventListener("online", onNetworkChange);
    document.addEventListener("visibilitychange", onVisibility);
    const interval = setInterval(checkConnection, PING_INTERVAL);

    return () => {
      window.removeEventListener("offline", onNetworkChange);
      window.removeEventListener("online", onNetworkChange);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, [checkConnection]);

  return { isOnline, checkConnection };
}
