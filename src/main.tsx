import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes";
import "./index.css";

const CHUNK_RELOAD_KEY = "chunk-reload";
const HYDRATION_RELOAD_KEY = "hydration-dom-reload";
const RELOAD_WINDOW_MS = 10_000;

const getErrorMessage = (reason: unknown) => {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  if (reason && typeof reason === "object" && "message" in reason && typeof reason.message === "string") {
    return reason.message;
  }

  return "";
};

const shouldRecoverHydrationError = (reason: unknown) => {
  const message = getErrorMessage(reason);

  return (
    message.includes("insertBefore") ||
    message.includes("removeChild") ||
    message.includes("appendChild") ||
    message.includes("not a child of this node") ||
    message.includes("Hydration failed") ||
    message.includes("hydrating")
  );
};

const reloadOnce = (key: string) => {
  const last = sessionStorage.getItem(key);

  if (!last || Date.now() - Number(last) > RELOAD_WINDOW_MS) {
    sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
    return true;
  }

  return false;
};

// Auto-reload on chunk load failure or unrecoverable hydration DOM errors
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", () => {
    reloadOnce(CHUNK_RELOAD_KEY);
  });

  window.addEventListener(
    "error",
    (event) => {
      if (shouldRecoverHydrationError(event.error ?? event.message)) {
        reloadOnce(HYDRATION_RELOAD_KEY);
      }
    },
    true
  );

  window.addEventListener("unhandledrejection", (event) => {
    if (
      event.reason?.message?.includes("Failed to fetch dynamically imported module") ||
      event.reason?.message?.includes("Importing a module script failed")
    ) {
      reloadOnce(CHUNK_RELOAD_KEY);
      return;
    }

    if (shouldRecoverHydrationError(event.reason)) {
      const reloaded = reloadOnce(HYDRATION_RELOAD_KEY);
      if (reloaded) {
        event.preventDefault();
      }
    }
  });
}

export const createRoot = ViteReactSSG(
  { routes },
  ({ isClient }) => {
    if (isClient) {
      // Any client-specific setup
    }
  }
);
