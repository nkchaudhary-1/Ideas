import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { IN_ARTIFACT } from "./lib/env";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline shell for the installed app. Production only, so development is never served stale.
if (import.meta.env.PROD && !IN_ARTIFACT && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
