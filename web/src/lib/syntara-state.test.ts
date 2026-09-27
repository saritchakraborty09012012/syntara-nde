import { describe, expect, it } from "vitest"

import { defaultState, loadState, saveState } from "./syntara-state"

function memoryStorage(initial = "") {
  const values = new Map<string, string>()
  if (initial) values.set("syntara.state.v1", initial)
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
  } as unknown as Storage
}

describe("seed model catalogue", () => {
  it("refreshes stored seed families, adds new ones and keeps imports", () => {
    const stored = JSON.stringify({
      schema: 1,
      models: [
        {
          id: "qwen-local", name: "Qwen family", provider: "Qwen", architecture: "Dense / MoE variants",
          parameters: "Various", formats: [], quantizations: [], capabilities: [], context: "",
          sourceUrl: "", recommendedRam: "8 GB", recommendedVram: "", disk: "",
          status: "installed", localPath: "/models/qwen.gguf", installedAt: 123,
        },
        {
          id: "imported-local", name: "My import", provider: "local", architecture: "dense",
          parameters: "7B", formats: ["GGUF"], quantizations: ["Q4"], capabilities: ["text"],
          context: "8k", sourceUrl: "local://import", recommendedRam: "8 GB",
          recommendedVram: "", disk: "5 GB", status: "installed", localPath: "/x.gguf",
        },
      ],
    })
    const state = loadState(memoryStorage(stored))
    expect(state.models.length).toBeGreaterThanOrEqual(23)
    const qwen = state.models.find((model) => model.id === "qwen-local")
    expect(qwen?.name).toBe("Qwen families and variants")
    expect(qwen?.status).toBe("installed")
    expect(qwen?.localPath).toBe("/models/qwen.gguf")
    expect(state.models.find((model) => model.id === "phi-local")).toBeTruthy()
    expect(state.models.find((model) => model.id === "imported-local")?.name).toBe("My import")
  })
})

describe("sidebar collapse preferences", () => {
  it("defaults both sidebars to expanded", () => {
    const state = defaultState()
    expect(state.settings.navCollapsed).toBe(false)
    expect(state.settings.historyCollapsed).toBe(false)
  })

  it("backfills the flags for states saved before they existed", () => {
    const legacy = JSON.stringify({ schema: 1, settings: { theme: "dark" } })
    const state = loadState(memoryStorage(legacy))
    expect(state.settings.navCollapsed).toBe(false)
    expect(state.settings.historyCollapsed).toBe(false)
    expect(state.settings.theme).toBe("dark")
  })

  it("round-trips collapsed flags through save and load", () => {
    const storage = memoryStorage()
    const next = defaultState()
    next.settings.navCollapsed = true
    next.settings.historyCollapsed = true
    saveState(next, storage)
    const restored = loadState(storage)
    expect(restored.settings.navCollapsed).toBe(true)
    expect(restored.settings.historyCollapsed).toBe(true)
  })
})
