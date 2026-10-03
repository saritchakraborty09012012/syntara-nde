import { describe, expect, it } from "vitest"

import { grantKey, isGated, isGranted, recordDecision, type GrantStore } from "./permissions"

const memoryStore = (): GrantStore & { data: Map<string, boolean> } => {
  const data = new Map<string, boolean>()
  return {
    data,
    hasAlways: (projectId, tool) => data.get(grantKey(projectId, tool)) ?? false,
    addAlways: (projectId, tool) => void data.set(grantKey(projectId, tool), true),
  }
}

describe("permission policy", () => {
  it("gates writes and process execution only", () => {
    expect(isGated("fs_write")).toBe(true)
    expect(isGated("proc_run")).toBe(true)
    expect(isGated("fs_read")).toBe(false)
    expect(isGated("fs_list")).toBe(false)
    expect(isGated("todo")).toBe(false)
  })

  it("grants nothing by default", () => {
    const session = new Set<string>()
    const store = memoryStore()
    expect(isGranted("p1", "fs_write", session, store)).toBe(false)
  })

  it("`once` lives only in the session and is project-scoped", () => {
    const session = new Set<string>()
    const store = memoryStore()
    recordDecision("once", "p1", "fs_write", session, store)
    expect(isGranted("p1", "fs_write", session, store)).toBe(true)
    expect(isGranted("p2", "fs_write", session, store)).toBe(false)
    expect(store.hasAlways("p1", "fs_write")).toBe(false)
  })

  it("`always` persists on the project and survives a fresh session", () => {
    const store = memoryStore()
    const firstRun = new Set<string>()
    recordDecision("always", "p1", "proc_run", firstRun, store)
    expect(store.hasAlways("p1", "proc_run")).toBe(true)
    const nextRun = new Set<string>()
    expect(isGranted("p1", "proc_run", nextRun, store)).toBe(true)
    expect(isGranted("p2", "proc_run", nextRun, store)).toBe(false)
  })

  it("`deny` records nothing — the next call asks again", () => {
    const session = new Set<string>()
    const store = memoryStore()
    recordDecision("deny", "p1", "fs_write", session, store)
    expect(session.size).toBe(0)
    expect(store.hasAlways("p1", "fs_write")).toBe(false)
  })

  it("runs without a project fall back to session-scoped grants", () => {
    const session = new Set<string>()
    const store = memoryStore()
    recordDecision("always", null, "proc_run", session, store)
    expect(isGranted(null, "proc_run", session, store)).toBe(true)
    expect(isGranted("p1", "proc_run", session, store)).toBe(false)
    expect(store.hasAlways(null, "proc_run")).toBe(true)
  })
})
