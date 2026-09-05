import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelloView } from "./HelloView";

/**
 * Entry standalone — solo para probar la vista de forma aislada.
 * El host NO usa este entry; consume ./plugin vía remoteEntry.js.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelloView />
  </StrictMode>
);
