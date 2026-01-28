import { createRoot } from "react-dom/client";
import { i18nPromise } from "@/i18n";
import App from "./App.tsx";
import "./index.css";

// Wait for i18n to be initialized before rendering
i18nPromise.then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
