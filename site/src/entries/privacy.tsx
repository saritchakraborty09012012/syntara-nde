import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { PrivacyPage } from "../components/pages/PrivacyPage"
import { syncTheme } from "../theme"
import "../index.css"

syncTheme()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PrivacyPage />
  </StrictMode>,
)
