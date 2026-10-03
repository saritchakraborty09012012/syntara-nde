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

/* Phase 3: the app has exactly two modes — Chat and Agent — switched by one
   segmented toggle where the workspace switcher used to sit. They are views
   like any other (#chat, #agents) so deep links, back/forward and hash-only
   navigation work; switching never remounts the app, so each mode keeps its
   own history (conversations vs. run log) in place. */
export const MODE_VIEWS = ["chat", "agents"] as const

/* Canonical list of every routable view id. The sidebar menu (NAV in App.tsx)
   is a subset — the two modes are reached through the toggle, not the menu —
   but parseHash must still accept all of them. */
export const ALL_VIEW_IDS: readonly string[] = [
  ...MODE_VIEWS,
  "models",
  "downloads",
  "memory",
  "performance",
  "developer",
  "settings",
]

/* Labels shown for each view (sidebar tooltips, topbar eyebrow, a11y names).
   The mode labels are singular: the toggle reads "Chat | Agent". */
export const VIEW_LABELS: Record<View, string> = {
  chat: "Chat",
  agents: "Agent",
  models: "Models",
  downloads: "Downloads",
  memory: "Memory",
  performance: "Performance",
  developer: "Developer",
  settings: "Settings",
}

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
