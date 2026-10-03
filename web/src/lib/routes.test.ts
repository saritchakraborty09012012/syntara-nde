import { describe, expect, it } from "vitest"

import { MODEL_TABS, parseHash } from "./routes"

const VIEW_IDS = ["chat", "agents", "models", "downloads", "memory", "performance", "developer", "settings"] as const

describe("parseHash", () => {
  it("keeps a plain view route", () => {
    expect(parseHash("#downloads", VIEW_IDS)).toEqual({ view: "downloads", family: null, tab: null })
    expect(parseHash("#downloads", VIEW_IDS).tab).toBeNull()
  })

  it("reads the plain Models hub as the default tab", () => {
    expect(parseHash("#models", VIEW_IDS)).toEqual({ view: "models", family: null, tab: null })
    expect(parseHash("#/models", VIEW_IDS)).toEqual({ view: "models", family: null, tab: null })
  })

  it("recognises the tab pages", () => {
    expect(parseHash("#models/installing", VIEW_IDS)).toEqual({ view: "models", family: null, tab: "installing" })
    expect(parseHash("#models/installed", VIEW_IDS)).toEqual({ view: "models", family: null, tab: "installed" })
  })

  it("keeps every other segment a family page, never a tab", () => {
    expect(parseHash("#models/qwen-local", VIEW_IDS)).toEqual({ view: "models", family: "qwen-local", tab: null })
    expect(parseHash("#models/import-abc", VIEW_IDS)).toEqual({ view: "models", family: "import-abc", tab: null })
    expect(parseHash("#models/installing/extra", VIEW_IDS).family).toBe("installing/extra")
  })

  it("url-decodes family ids", () => {
    expect(parseHash("#models/a%20b", VIEW_IDS).family).toBe("a b")
  })

  it("falls back to chat for unknown hashes", () => {
    expect(parseHash("#nope", VIEW_IDS)).toEqual({ view: "chat", family: null, tab: null })
    expect(parseHash("", VIEW_IDS)).toEqual({ view: "chat", family: null, tab: null })
    expect(parseHash("#nope/anything", VIEW_IDS).family).toBeNull()
  })

  it("sends legacy #projects bookmarks to chat (view removed in Phase 2)", () => {
    expect(parseHash("#projects", VIEW_IDS)).toEqual({ view: "chat", family: null, tab: null })
  })

  it("exposes all three tabs with 'all' first", () => {
    expect(MODEL_TABS.map((tab) => tab.id)).toEqual(["all", "installing", "installed"])
    expect(MODEL_TABS[0].label).toBe("All")
  })
})
