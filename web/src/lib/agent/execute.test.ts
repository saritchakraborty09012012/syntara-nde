/* Executor-side coverage for the phase-3/4 tools: the git safety gate runs
   before any process is spawned, and the frontend-owned tools (plan,
   question, preview, console) delegate through injected options — so every
   case here runs without the desktop shell or a model. */

import { describe, expect, it, vi } from "vitest"

import { createAgentExecutor } from "./execute"
import type { ToolRunContext } from "./loop"

const ctx: ToolRunContext = { projectId: "p1", signal: new AbortController().signal }

const executor = (options: Parameters<typeof createAgentExecutor>[1] extends infer O ? Partial<O> : never = {}) =>
  createAgentExecutor(null, { baseUrl: "http://127.0.0.1:1234/v1", ...options })

describe("git allowlist", () => {
  it("refuses write and destructive subcommands without spawning anything", async () => {
    const push = await executor().execute("git", { args: ["push"] }, ctx)
    expect(push.ok).toBe(false)
    expect(push.output).toContain("read-only git subcommands")

    const del = await executor().execute("git", { args: ["branch", "-D", "topic"] }, ctx)
    expect(del.ok).toBe(false)
    expect(del.output).toContain("deleting branches")

    const checkout = await executor().execute("git", { args: ["checkout", "main"] }, ctx)
    expect(checkout.ok).toBe(false)
  })

  it("refuses external diff helpers even on safe subcommands", async () => {
    const result = await executor().execute("git", { args: ["diff", "--ext-diff"] }, ctx)
    expect(result.ok).toBe(false)
    expect(result.output).toContain("--ext-diff")
  })

  it("lets a read-only subcommand reach the project-folder gate", async () => {
    /* root is null: hitting the gate proves the allowlist passed and the
       refusal check ran before any process could start. */
    await expect(executor().execute("git", { args: ["status", "--short"] }, ctx)).rejects.toThrow(/no project folder/)
  })

  it("rejects malformed args payloads", async () => {
    await expect(executor().execute("git", { args: [] }, ctx)).rejects.toThrow(/non-empty array/)
    await expect(executor().execute("git", {}, ctx)).rejects.toThrow(/non-empty array/)
  })
})

describe("submit_plan", () => {
  it("cleans the steps, hands them to the dock and emits a plan event", async () => {
    const onPlan = vi.fn()
    const onEvent = vi.fn()
    const result = await executor({ onPlan, onEvent }).execute(
      "submit_plan",
      { steps: ["  Reproduce the failure  ", "Fix the guard", "   "] },
      ctx,
    )
    expect(result.ok).toBe(true)
    expect(onPlan).toHaveBeenCalledWith(["Reproduce the failure", "Fix the guard"])
    expect(onEvent).toHaveBeenCalledWith({ type: "plan", items: ["Reproduce the failure", "Fix the guard"] })
    expect(result.output).toContain("review")
  })

  it("refuses an empty or non-array plan", async () => {
    await expect(executor().execute("submit_plan", { steps: ["   "] }, ctx)).rejects.toThrow(/at least one/)
    await expect(executor().execute("submit_plan", { steps: "one" }, ctx)).rejects.toThrow(/array of strings/)
  })
})

describe("ask_user", () => {
  it("emits a question event and resolves with the dock answer", async () => {
    const askUser = vi.fn().mockResolvedValue("  sqlite  ")
    const onEvent = vi.fn()
    const result = await executor({ askUser, onEvent }).execute(
      "ask_user",
      { question: "Which database?", options: ["sqlite", "postgres"] },
      ctx,
    )
    expect(askUser).toHaveBeenCalledWith("Which database?", ["sqlite", "postgres"])
    expect(onEvent).toHaveBeenCalledWith({ type: "question", text: "Which database?", options: ["sqlite", "postgres"] })
    expect(result.ok).toBe(true)
    expect(result.output).toBe("sqlite")
  })

  it("answers honestly when no dock is wired", async () => {
    const result = await executor().execute("ask_user", { question: "Q?" }, ctx)
    expect(result.ok).toBe(false)
    expect(result.output).toContain("no interactive question dock")
  })
})

describe("preview and console delegation", () => {
  it("validates loopback URLs before opening the preview", async () => {
    const previewOpen = vi.fn().mockResolvedValue({ ok: true, output: "opened" })
    const ok = await executor({ previewOpen }).execute("preview_open", { url: "http://0.0.0.0:5173" }, ctx)
    expect(previewOpen).toHaveBeenCalledWith("http://127.0.0.1:5173/")
    expect(ok.ok).toBe(true)

    await expect(
      executor({ previewOpen }).execute("preview_open", { url: "https://evil.example.com" }, ctx),
    ).rejects.toThrow(/loopback/)
  })

  it("reports missing docks instead of failing silently", async () => {
    expect((await executor().execute("preview_reload", {}, ctx)).output).toContain("preview dock is not available")
    expect((await executor().execute("console_read", {}, ctx)).output).toContain("console capture is not available")
    expect((await executor().execute("preview_open", {}, ctx)).output).toContain("preview dock is not available")
  })

  it("returns the captured console lines when wired", async () => {
    const readConsole = vi.fn().mockResolvedValue({ ok: true, output: "[log] started" })
    const result = await executor({ readConsole }).execute("console_read", {}, ctx)
    expect(readConsole).toHaveBeenCalled()
    expect(result.output).toBe("[log] started")
  })
})
