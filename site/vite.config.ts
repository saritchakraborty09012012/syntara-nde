import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { readFileSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { defineConfig, type Plugin } from "vite"

// Relative base so the bundle works from GitHub Pages project paths and any
// subdirectory without hard-coding the repository name.
const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)))

// In dev, serve the compiled web application at /app/ so "Try Online" works
// straight from `npm run dev` without a second dev server in the web folder.
const WEB_DIST = path.resolve(siteRoot, "../web/dist")
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webm": "video/webm",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
}

function serveOnlineApp(): Plugin {
  return {
    name: "syntara-site:serve-online-app",
    configureServer(server) {
      // Install before Vite's internal middlewares so /app/* (and its SPA
      // fallback) hits the built web app instead of the site index.html.
      server.middlewares.use((req, res, next) => {
        const url = (req.url || "").split("?")[0]
        if (url !== "/app" && !url.startsWith("/app/")) return next()
        let rel = url === "/app" ? "index.html" : decodeURIComponent(url.slice("/app/".length))
        if (rel === "" || rel.endsWith("/")) rel += "index.html"
        const file = path.resolve(WEB_DIST, rel)
        if (!file.startsWith(WEB_DIST + path.sep) && file !== path.join(WEB_DIST, "index.html")) return next()
        let stat
        try { stat = statSync(file) } catch { return next() }
        if (!stat.isFile()) return next()
        res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream")
        res.end(readFileSync(file))
      })
    },
  }
}

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), serveOnlineApp()],
  resolve: { alias: { "@": path.resolve(siteRoot, "./src") } },
  // Multi-page build: the landing page plus the standalone About / Privacy / FAQ
  // pages. All four sit at the root of the output, so the relative asset base
  // keeps working on the custom domain, on GitHub Pages project paths and in
  // any subdirectory.
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(siteRoot, "index.html"),
        about: path.resolve(siteRoot, "about.html"),
        privacy: path.resolve(siteRoot, "privacy.html"),
        faq: path.resolve(siteRoot, "faq.html"),
      },
    },
  },
})
