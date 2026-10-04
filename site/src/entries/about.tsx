import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { AboutPage } from "../components/pages/AboutPage"
import { syncTheme } from "../theme"
import "../index.css"

syncTheme()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AboutPage />
  </StrictMode>,
)
