/* Public site links used from inside the app (web build especially).

   The hosted landing page is the only place with downloads, install guides
   and the model catalogue — the in-app browser build cannot fetch those
   itself, so several controls link out instead of dead-ending. */

export const SITE_BASE = "https://syntara-nde.vercel.app"
export const SITE_DOWNLOAD_URL = `${SITE_BASE}/#download`
export const SITE_MODELS_URL = `${SITE_BASE}/#models`

/** Sentinel value for the "Download models" entry in model dropdowns. */
export const MODEL_DOWNLOAD_VALUE = "__download_models__"

/** Open a site page in a new tab; a failed popup (blocked) falls back to
    the current tab so the link is never a no-op. */
export function openSitePage(url: string): void {
  const opened = window.open(url, "_blank", "noopener,noreferrer")
  if (!opened) window.location.assign(url)
}
