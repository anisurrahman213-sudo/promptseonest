import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Defer i18n initialization until after first paint to speed up initial render
import("./i18n/config");

const root = createRoot(document.getElementById("root")!);

// Skip StrictMode in production to avoid double-rendering overhead
if (import.meta.env.DEV) {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  root.render(<App />);
}
