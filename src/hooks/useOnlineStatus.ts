import { useState, useEffect, useCallback, useRef } from "react";

const PING_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`;
const PING_INTERVAL = 15_000; // 15s
const PING_TIMEOUT = 5_000;   // 5s

/**
 * Robust online detection: combines navigator.onLine with active pings
 * to the backend. Works reliably on mobile where navigator.onLine
 * can return true even without real internet.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true); // optimistic
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const checkConnection = useCallback(async () => {
    // Quick fail if browser says offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT);

      await fetch(PING_URL, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeout);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    // Check immediately on mount
    checkConnection();

    // Listen for browser events
    const goOffline = () => {
      setIsOnline(false);
    };
    const goOnline = () => {
      // Don't trust it — verify with a real ping
      checkConnection();
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    // Periodic check
    intervalRef.current = setInterval(checkConnection, PING_INTERVAL);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkConnection]);

  return { isOnline, checkConnection };
}
