import { describe, expect, it } from "vitest"

import type { AgentEvent } from "./loop"
import {
  createSession,
  createTurn,
  deleteSession,
  filterSessions,
  groupSessions,
  loadManifest,
  loadSession,
  MAX_EVENTS_PER_TURN,
  MAX_SESSIONS,
  modePolicy,
  saveSession,
  sessionKey,
  setActiveSession,
  SESSIONS_MANIFEST_KEY,
  titleFromTask,
  trimSessionForSave,
} from "./sessions"

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() { return values.size },
  } as unknown as Storage
}

function fakeEvents(count: number): AgentEvent[] {
  return Array.from({ length: count }, (_, index) => ({ type: "step", step: index + 1 }))
}

describe("modePolicy", () => {
  it("gates tool access per mode", () => {
    expect(modePolicy("build").tools).toBe("full")
    expect(modePolicy("debug").tools).toBe("full")
    expect(modePolicy("plan").tools).toBe("read-only")
    expect(modePolicy("chat").tools).toBe("none")
    expect(modePolicy("explain").tools).toBe("none")
  })

  it("gives each mode a distinct instruction", () => {
    const prompts = ["build", "plan", "explain", "chat", "debug"].map((mode) => modePolicy(mode as never).prompt)
    expect(new Set(prompts).size).toBe(prompts.length)
    expect(prompts.every((prompt) => prompt.length > 20)).toBe(true)
  })
})

describe("titleFromTask", () => {
  it("uses the first non-empty line", () => {
    expect(titleFromTask("\n\n  Fix the failing test  \nthen commit")).toBe("Fix the failing test")
  })

  it("truncates long tasks and handles empty input", () => {
    expect(titleFromTask("x".repeat(80))).toHaveLength(49)
    expect(titleFromTask("   \n  ")).toBe("New session")
  })
})

describe("session persistence", () => {
  it("round-trips a session through its own key and the manifest", () => {
    const storage = memoryStorage()
    const session = createSession("qwen", 1000)
    session.title = "Fix parser"
    session.turns.push({ ...createTurn("Fix parser", "build", 1000), status: "done" })

    const manifest = saveSession(session, storage)
    expect(manifest.activeId).toBe(session.id)
    expect(manifest.entries[0]).toMatchObject({ id: session.id, title: "Fix parser" })
    /* The manifest carries a search blob of the session's task texts. */
    expect(manifest.entries[0]?.text).toContain("Fix parser")
    expect(storage.getItem(sessionKey(session.id))).toBeTruthy()

    const loaded = loadSession(session.id, storage)
    expect(loaded?.turns).toHaveLength(1)
    expect(loaded?.model).toBe("qwen")
    expect(loadManifest(storage).activeId).toBe(session.id)
  })

  it("keeps list metadata in the manifest without the transcript", () => {
    const storage = memoryStorage()
    const session = createSession(null, 5000)
    session.title = "Listed"
    saveSession(session, storage)
    const raw = storage.getItem(SESSIONS_MANIFEST_KEY) ?? ""
    expect(raw).toContain("Listed")
    expect(raw).not.toContain("turns")
  })

  it("caps stored events per turn but never the running turn", () => {
    const session = createSession(null, 1)
    session.turns.push({ ...createTurn("old", "build", 1), status: "done", events: fakeEvents(MAX_EVENTS_PER_TURN + 50) })
    session.turns.push({ ...createTurn("live", "build", 2), status: "running", events: fakeEvents(10) })
    const { session: trimmed, droppedTurns } = trimSessionForSave(session)
    expect(droppedTurns).toBe(0)
    expect(trimmed.turns[0].events).toHaveLength(MAX_EVENTS_PER_TURN)
    expect(trimmed.turns[1].events).toHaveLength(10)
  })

  it("drops oldest finished turns when the JSON is still too big", () => {
    const session = createSession(null, 1)
    const bulky = fakeEvents(20).map((event, index) => ({
      ...event,
      type: "assistant_text" as const,
      text: "y".repeat(4000) + String(index),
    }))
    for (let index = 0; index < 6; index += 1) {
      session.turns.push({ ...createTurn(`task ${index}`, "build", index), status: "done", events: bulky })
    }
    const { session: trimmed, droppedTurns } = trimSessionForSave(session, 30_000)
    expect(droppedTurns).toBeGreaterThan(0)
    expect(JSON.stringify(trimmed).length).toBeLessThanOrEqual(30_000)
    expect(trimmed.turns.length).toBeLessThan(6)
  })

  it("evicts the oldest manifest entries beyond the session cap", () => {
    const storage = memoryStorage()
    for (let index = 0; index < MAX_SESSIONS + 3; index += 1) {
      const session = createSession(null, 1000 + index)
      session.title = `session ${index}`
      saveSession(session, storage)
    }
    const manifest = loadManifest(storage)
    expect(manifest.entries).toHaveLength(MAX_SESSIONS)
    expect(manifest.entries[0].title).toBe(`session ${MAX_SESSIONS + 2}`)
  })

  it("deletes both the key and the manifest entry", () => {
    const storage = memoryStorage()
    const first = createSession(null, 1)
    const second = createSession(null, 2)
    saveSession(first, storage)
    saveSession(second, storage)
    const manifest = deleteSession(second.id, storage)
    expect(manifest.entries.map((entry) => entry.id)).toEqual([first.id])
    expect(loadSession(second.id, storage)).toBeNull()
    expect(manifest.activeId).toBe(first.id)
  })

  it("survives corrupt JSON without throwing", () => {
    const storage = memoryStorage()
    storage.setItem(SESSIONS_MANIFEST_KEY, "{not json")
    storage.setItem(sessionKey("broken"), "also not json")
    expect(loadManifest(storage)).toEqual({ activeId: null, entries: [] })
    expect(loadSession("broken", storage)).toBeNull()
  })

  it("setActiveSession updates only the active pointer", () => {
    const storage = memoryStorage()
    const session = createSession(null, 1)
    saveSession(session, storage)
    const manifest = setActiveSession(null, storage)
    expect(manifest.activeId).toBeNull()
    expect(manifest.entries).toHaveLength(1)
  })
})

describe("groupSessions", () => {
  it("splits entries by local day, newest first", () => {
    const now = new Date(2026, 9, 10, 15, 0, 0).getTime()
    const today = now - 60_000
    const yesterday = now - 26 * 60 * 60 * 1000
    const older = now - 5 * 24 * 60 * 60 * 1000
    const groups = groupSessions(
      [
        { id: "a", title: "older", createdAt: older, updatedAt: older },
        { id: "b", title: "yesterday", createdAt: yesterday, updatedAt: yesterday },
        { id: "c", title: "today-1", createdAt: today, updatedAt: today },
        { id: "d", title: "today-2", createdAt: today - 1000, updatedAt: today - 1000 },
      ],
      now,
    )
    expect(groups.map((group) => group.label)).toEqual(["Today", "Yesterday", "Older"])
    expect(groups[0].entries.map((entry) => entry.id)).toEqual(["c", "d"])
  })

  it("returns no groups when there is nothing to show", () => {
    expect(groupSessions([], Date.now())).toEqual([])
  })
})

describe("filterSessions", () => {
  const entries = [
    { id: "a", title: "Fix parser bug", createdAt: 1, updatedAt: 1, text: "investigate the json tool-call parser" },
    { id: "b", title: "Update site", createdAt: 2, updatedAt: 2, text: "rewrite the download section" },
    { id: "c", title: "New session", createdAt: 3, updatedAt: 3 },
  ]

  it("returns everything for an empty or whitespace query", () => {
    expect(filterSessions(entries, "")).toEqual(entries)
    expect(filterSessions(entries, "   ")).toEqual(entries)
  })

  it("matches title and stored text, case-insensitively", () => {
    expect(filterSessions(entries, "parser").map((entry) => entry.id)).toEqual(["a"])
    expect(filterSessions(entries, "DOWNLOAD").map((entry) => entry.id)).toEqual(["b"])
    expect(filterSessions(entries, "json").map((entry) => entry.id)).toEqual(["a"])
  })

  it("ANDs multiple terms across title and text", () => {
    expect(filterSessions(entries, "fix parser").map((entry) => entry.id)).toEqual(["a"])
    expect(filterSessions(entries, "fix site").map((entry) => entry.id)).toEqual([])
  })

  it("tolerates entries without stored text (older manifests)", () => {
    expect(filterSessions(entries, "new session").map((entry) => entry.id)).toEqual(["c"])
    expect(filterSessions(entries, "ghost")).toEqual([])
  })
})
