/* Public site links used from inside the app (web build especially).

   The hosted landing page is the only place with downloads, install guides
   and the model catalogue — the in-app browser build cannot fetch those
   itself, so several controls link out instead of dead-ending. */

export const SITE_BASE = "https://syntara-nde.vercel.app"
export const SITE_DOWNLOAD_URL = `${SITE_BASE}/#download`
/** The app's own Models view as hosted on the site — what "Download models"
    in a model dropdown opens. */
export const APP_MODELS_URL = `${SITE_BASE}/app/#models`

/** Sentinel value for the "Download models" entry in model dropdowns. */
export const MODEL_DOWNLOAD_VALUE = "__download_models__"

/** Open a page in a new tab. `noopener` makes window.open return null even
    on success, so there is no reliable "was it blocked?" signal — never fall
    back to navigating the current tab (that double-opened the page). */
export function openSitePage(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer")
}
