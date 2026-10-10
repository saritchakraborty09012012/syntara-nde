import { describe, expect, it } from "vitest"

/* Phase 3: the Chat|Agent toggle lives in the real App shell. There is no
   DOM in this environment, so the browser globals are stubbed before App is
   imported and the shell is server-rendered; effects never run, but the
   initial render executes the same NAV/toggle/label code paths the browser
   does. */
const storage = new Map<string, string>()

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
    clear: () => storage.clear(),
  },
})

Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    location: { hash: "" },
    localStorage: (globalThis as unknown as { localStorage: unknown }).localStorage,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
    requestAnimationFrame: (fn: () => void) => setTimeout(fn, 0),
    matchMedia: () => ({ matches: false, addEventListener: () => undefined, removeEventListener: () => undefined }),
  },
})

Object.defineProperty(globalThis, "document", {
  configurable: true,
  value: {
    visibilityState: "visible",
    title: "",
    /* KaTeX warns unless the (stubbed) document claims standards mode. */
    compatMode: "CSS1Compat",
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    getElementById: () => null,
    activeElement: null,
  },
})

const { renderToStaticMarkup } = await import("react-dom/server")
const { default: App } = await import("./App")

describe("phase 3 shell (server-rendered App)", () => {
  it("renders the Chat|Agent toggle with tabs, labels and aria state", () => {
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('role="tablist"')
    expect(html).toContain('aria-label="Work mode"')
    expect(html).toContain('id="mode-tab-chat"')
    expect(html).toContain('id="mode-tab-agents"')
    // Default route is chat: chat selected, agent deselected (roving tabindex).
    expect(html).toMatch(/id="mode-tab-chat"[^>]*aria-selected="true"/)
    expect(html).toMatch(/id="mode-tab-agents"[^>]*aria-selected="false"/)
    // Both labels come from VIEW_LABELS (singular mode names).
    expect(html).toContain(">Chat</button>")
    expect(html).toContain(">Agent</button>")
  })

  it("shows the chat panel and menu without a chat/agent menu entry", () => {
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('id="panel-chat"')
    expect(html).toContain('role="tabpanel"')
    expect(html).not.toContain('id="panel-agents"')
    // The menu holds only the six non-mode destinations.
    for (const label of ["Models", "Downloads", "Memory", "Performance", "Developer", "Settings"]) {
      expect(html).toContain(`<span>${label}</span>`)
    }
    expect(html).not.toContain("<span>Chat</span>")
    expect(html).not.toContain("<span>Agents</span>")
  })

  it("renders the full phase-3 agent workspace when routed to #agents", () => {
    const location = (globalThis as { window?: { location: { hash: string } } }).window?.location
    if (!location) throw new Error("window stub missing")
    location.hash = "#agents"
    try {
      const html = renderToStaticMarkup(<App />)
      expect(html).toContain('id="panel-agents"')
      expect(html).toContain('class="view agent-shell"')
      expect(html).toContain('aria-label="Agent sessions"')
      expect(html).toContain("Give the agent a task.")
      expect(html).toContain('aria-label="Agent task"')
      expect(html).toContain('aria-label="Progress"')
      expect(html).toContain('aria-label="Preview"')
      // The marketing hero and dashboard cards of the old layout are gone.
      expect(html).not.toContain("Local agents that can actually work.")
      expect(html).not.toContain("Run agent</button>")
    } finally {
      location.hash = ""
    }
  })
})
