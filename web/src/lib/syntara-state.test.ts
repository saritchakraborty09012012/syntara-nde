import { describe, expect, it } from "vitest"

import { clearState, defaultState, DOWNLOADS_KEY, loadState, markMissingFiles, restoreBackup, saveState, type DownloadTask } from "./syntara-state"

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

describe("first-run starter suggestion flag", () => {
  it("starts unseen so the welcome card can show", () => {
    expect(defaultState().settings.starterSuggestionSeen).toBe(false)
  })

  it("backfills false for states saved before the flag existed", () => {
    const legacy = JSON.stringify({ schema: 1, settings: { theme: "dark" } })
    const state = loadState(memoryStorage(legacy))
    expect(state.settings.starterSuggestionSeen).toBe(false)
    expect(state.settings.theme).toBe("dark")
  })

  it("round-trips the seen flag through save and load", () => {
    const storage = memoryStorage()
    const next = defaultState()
    next.settings.starterSuggestionSeen = true
    saveState(next, storage)
    expect(loadState(storage).settings.starterSuggestionSeen).toBe(true)
  })
})

describe("downloaded-model memory", () => {
  it("starts empty and backfills for states saved before it existed", () => {
    expect(defaultState().downloadedModels).toEqual({})
    const legacy = JSON.stringify({ schema: 1, settings: { theme: "dark" } })
    expect(loadState(memoryStorage(legacy)).downloadedModels).toEqual({})
  })

  it("round-trips downloaded records through save and load", () => {
    const storage = memoryStorage()
    const next = defaultState()
    next.downloadedModels["qwen-local"] = { name: "Qwen 3 8B", at: 123, bytes: 5_000_000 }
    saveState(next, storage)
    const restored = loadState(storage)
    expect(restored.downloadedModels["qwen-local"]).toEqual({ name: "Qwen 3 8B", at: 123, bytes: 5_000_000 })
  })

  it("survives a legacy backup that predates the field", async () => {
    const legacy = new File([JSON.stringify({ kind: "syntara-backup", schema: 1, data: { schema: 1, conversations: [], memories: [], projects: [], agents: [], models: [], downloads: [], settings: {} } })], "b.syntara-backup")
    const restored = await restoreBackup(legacy)
    expect(restored.downloadedModels).toEqual({})
  })
})

function task(over: Partial<DownloadTask> & { id: string }): DownloadTask {
  return {
    modelId: "qwen-local", name: "qwen.gguf", url: "https://example.com/qwen.gguf",
    state: "complete", progress: 100, receivedBytes: 100, totalBytes: 100,
    createdAt: 1, updatedAt: 1, ...over,
  }
}

function stateWith(rows: DownloadTask[], memory: Record<string, { name: string; at: number }> = {}) {
  const next = defaultState()
  next.downloads = rows
  next.downloadedModels = memory
  return next
}

describe("download history persistence", () => {
  it("keeps rows under their own key even when the main state write is capped", () => {
    const storage = memoryStorage()
    const next = defaultState()
    next.downloads = [task({ id: "dl_1" })]
    next.conversations.push({ id: "c1", title: "x".repeat(2_100_000), model: "", messages: [], createdAt: 1, updatedAt: 1 })
    saveState(next, storage)
    expect(storage.getItem("syntara.state.v1")).toBeNull()
    expect(loadState(storage).downloads.map((row) => row.id)).toEqual(["dl_1"])
  })

  it("clearState removes both the state key and the history key", () => {
    const storage = memoryStorage()
    saveState(stateWith([task({ id: "dl_1" })]), storage)
    clearState(storage)
    expect(storage.getItem("syntara.state.v1")).toBeNull()
    expect(storage.getItem(DOWNLOADS_KEY)).toBeNull()
    expect(loadState(storage).downloads).toEqual([])
  })

  it("the history key wins over stale rows inside the main state", () => {
    const storage = memoryStorage()
    saveState(stateWith([task({ id: "dl_fresh" })]), storage)
    storage.setItem("syntara.state.v1", JSON.stringify({ schema: 1, downloads: [task({ id: "dl_stale" })] }))
    expect(loadState(storage).downloads.map((row) => row.id)).toEqual(["dl_fresh"])
  })

  it("legacy stores without the history key still load their rows", () => {
    const legacy = JSON.stringify({ schema: 1, downloads: [task({ id: "dl_legacy" })] })
    expect(loadState(memoryStorage(legacy)).downloads.map((row) => row.id)).toEqual(["dl_legacy"])
  })
})

describe("missing-file flags", () => {
  it("strikes completed rows whose file vanished but keeps them in the list", () => {
    const next = markMissingFiles(stateWith([task({ id: "dl_1" }), task({ id: "dl_2" })]), new Set(["dl_1"]))
    expect(next.downloads).toHaveLength(2)
    expect(next.downloads[0]).toMatchObject({ state: "complete", fileMissing: true })
    expect(next.downloads[1].fileMissing).toBeUndefined()
  })

  it("drops re-download memory only when every completed row of the model is gone", () => {
    const current = stateWith(
      [task({ id: "dl_1" }), task({ id: "dl_2" }), task({ id: "dl_3", modelId: "phi-local" })],
      { "qwen-local": { name: "Qwen 3 8B", at: 1 }, "phi-local": { name: "Phi", at: 2 } },
    )
    const next = markMissingFiles(current, new Set(["dl_1", "dl_2"]))
    expect(next.downloadedModels["qwen-local"]).toBeUndefined()
    expect(next.downloadedModels["phi-local"]).toEqual({ name: "Phi", at: 2 })
  })

  it("unflags a row whose file is back on disk", () => {
    const next = markMissingFiles(stateWith([task({ id: "dl_1", fileMissing: true })]), new Set())
    expect(next.downloads[0].fileMissing).toBeUndefined()
  })

  it("returns the same state object when nothing changed and ignores non-complete rows", () => {
    const current = stateWith([task({ id: "dl_1" }), task({ id: "dl_9", state: "cancelled" })])
    expect(markMissingFiles(current, new Set())).toBe(current)
    expect(markMissingFiles(current, new Set(["dl_9"]))).toBe(current)
  })
})
