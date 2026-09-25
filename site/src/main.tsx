import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"

// Sync theme before first React paint (index.html script already set data-theme;
// this keeps Nav and document in agreement if storage changed in another tab).
try {
  const saved = localStorage.getItem("syntara-theme")
  document.documentElement.dataset.theme = saved === "light" ? "light" : "dark"
} catch {
  document.documentElement.dataset.theme = "dark"
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
