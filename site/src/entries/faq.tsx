import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { FaqPage } from "../components/pages/FaqPage"
import { syncTheme } from "../theme"
import "../index.css"

syncTheme()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FaqPage />
  </StrictMode>,
)
