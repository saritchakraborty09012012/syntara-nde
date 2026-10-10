/* Console ring: bounded capture of this window's console output for the
   console_read tool. The spies go in first, then the ring wraps them, so
   tests stay quiet while capture still happens; install is idempotent and
   the ring is capped on line length. */

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"

import { getConsoleLines, installConsoleRing, resetConsoleRing } from "./console-ring"

const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined)
const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined)
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined)
const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)

/* First install in this module graph: wraps the quiet spies above. */
installConsoleRing()
resetConsoleRing()

afterAll(() => {
  vi.restoreAllMocks()
})

describe("console ring", () => {
  beforeEach(() => {
    resetConsoleRing()
  })

  it("captures levels with a prefix while the original method still runs", () => {
    console.log("hello", { a: 1 })
    console.error(new Error("boom"))
    expect(getConsoleLines()).toEqual(['[log] hello {"a":1}', "[error] Error: boom"])
    expect(logSpy).toHaveBeenCalledWith("hello", { a: 1 })
    expect(errorSpy).toHaveBeenCalled()
  })

  it("stays idempotent: a second install does not double-capture", () => {
    installConsoleRing()
    installConsoleRing()
    console.warn("careful")
    expect(getConsoleLines().filter((line) => line.includes("careful"))).toHaveLength(1)
    expect(warnSpy).toHaveBeenCalled()
  })

  it("truncates very long lines instead of storing them whole", () => {
    console.info("x".repeat(600))
    const [line] = getConsoleLines()
    expect(line.length).toBeLessThanOrEqual(501)
    expect(line.endsWith("…")).toBe(true)
    expect(infoSpy).toHaveBeenCalled()
  })

  it("returns a copy so callers cannot mutate the ring", () => {
    console.log("marker")
    const lines = getConsoleLines()
    lines.push("forged")
    expect(getConsoleLines()).not.toContain("forged")
    expect(getConsoleLines()).toContain("[log] marker")
  })
})
