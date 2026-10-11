import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { PlaygroundPage } from "../components/pages/PlaygroundPage"
import { syncTheme } from "../theme"
import "../index.css"

syncTheme()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PlaygroundPage />
  </StrictMode>,
)
