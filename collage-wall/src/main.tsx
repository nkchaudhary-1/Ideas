import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/outfit/latin-300.css";
import "@fontsource/outfit/latin-ext-300.css";
import "@fontsource/outfit/latin-400.css";
import "@fontsource/outfit/latin-ext-400.css";
import "./styles/global.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
