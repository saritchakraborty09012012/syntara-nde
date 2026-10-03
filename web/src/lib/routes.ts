/* Hash routing for the app.

   Every view is an addressable page (#models, #downloads, …) so deep links,
   refresh and browser back/forward work. Each model family gets its own page
   too (#models/qwen-local), and the Models hub is tabbed with one page per
   tab (#models, #models/installing, #models/installed). Hash routing keeps
   the links valid wherever the app is served (site /app/ subdir, Vercel,
   local preview) without server rewrites. */

export type View =
  | "chat"
  | "agents"
  | "models"
  | "downloads"
  | "memory"
  | "performance"
  | "developer"
  | "settings"

export type ModelTab = "all" | "installing" | "installed"

export const MODEL_TABS: Array<{ id: ModelTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "installing", label: "Installing" },
  { id: "installed", label: "Installed" },
]

/* Segments that mean a Models tab, never a model family. Reserved words are
   safe: family ids are catalog identifiers such as `qwen-local`. */
const TAB_SEGMENTS = new Set<ModelTab>(["installing", "installed"])

export interface ParsedRoute {
  view: View
  /* Model family page id, null on the hub and on every other view. */
  family: string | null
  /* Models sub-tab, null when the URL addresses the family page or the
     plain hub — callers read `null` as the default "all" tab. */
  tab: ModelTab | null
}

export function parseHash(hash: string, viewIds: readonly string[]): ParsedRoute {
  const [head, ...rest] = hash.replace(/^#\/?/, "").split("/")
  const view = viewIds.includes(head) ? (head as View) : "chat"
  const segment = rest.length ? decodeURIComponent(rest.join("/")) : null
  if (view !== "models" || !segment) return { view, family: null, tab: null }
  if (TAB_SEGMENTS.has(segment as ModelTab)) return { view, family: null, tab: segment as ModelTab }
  return { view, family: segment, tab: null }
}
