// Stages the compiled web application inside the site output so the
// "Try Online" button works from the built site and GitHub Pages without
// requiring a separate `npm run dev` in the web folder.
import { execSync } from "node:child_process"
import { cpSync, existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const webRoot = path.resolve(siteRoot, "..", "web")
const webDist = path.join(webRoot, "dist")
const distApp = path.join(siteRoot, "dist", "app")

console.log("[stage-app] building web app…")
execSync("npm --prefix ../web run build", { cwd: siteRoot, stdio: "inherit" })

if (!existsSync(webDist)) {
  console.error("[stage-app] web build produced no dist/ — aborting.")
  process.exit(1)
}

cpSync(webDist, distApp, { recursive: true })
console.log(`[stage-app] staged web app → ${path.relative(siteRoot, distApp)}`)