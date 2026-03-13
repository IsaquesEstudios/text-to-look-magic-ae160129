import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./routes";
import "./index.css";

// Auto-reload on chunk load failure (happens after new deploys)
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", () => {
    window.location.reload();
  });

  // Fallback for generic dynamic import errors
  window.addEventListener("unhandledrejection", (event) => {
    if (
      event.reason?.message?.includes("Failed to fetch dynamically imported module") ||
      event.reason?.message?.includes("Importing a module script failed")
    ) {
      // Prevent infinite reload loop
      const key = "chunk-reload";
      const last = sessionStorage.getItem(key);
      if (!last || Date.now() - Number(last) > 10000) {
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
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
