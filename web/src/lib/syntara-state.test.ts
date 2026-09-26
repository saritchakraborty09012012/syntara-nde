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
