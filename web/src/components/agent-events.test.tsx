import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { AgentEvents } from "./AgentEvents"
import type { AgentEvent } from "@/lib/agent/loop"

function html(events: AgentEvent[]): string {
  return renderToStaticMarkup(<AgentEvents events={events} />)
}

describe("AgentEvents run stream", () => {
  it("shows an empty state before any run", () => {
    expect(html([])).toContain("No agent runs yet.")
  })

  it("renders step dividers and assistant text", () => {
    const out = html([
      { type: "step", step: 1 },
      { type: "assistant_text", text: "Reading the repository first." },
    ])
    expect(out).toContain("Step 1")
    expect(out).toContain("Reading the repository first.")
  })

  it("collapses a started tool into its finished card instead of showing both", () => {
    const out = html([
      { type: "tool_start", callId: "c1", name: "fs_read", args: { path: "src/app.ts" } },
      { type: "tool_end", callId: "c1", name: "fs_read", ok: true, output: "export const x = 1", durationMs: 14, data: { path: "src/app.ts" } },
    ])
    expect(out.match(/fs_read/g)?.length).toBe(1)
    expect(out).toContain("tool-card ok")
    expect(out).toContain("src/app.ts")
    expect(out).toContain("14 ms")
  })

  it("shows a running card while the tool has not finished", () => {
    const out = html([{ type: "tool_start", callId: "c2", name: "proc_run", args: { argv: ["npm", "test"] } }])
    expect(out).toContain("tool-card running")
    expect(out).toContain("npm test")
  })

  it("renders a failed tool card with its output", () => {
    const out = html([
      { type: "tool_end", callId: "c3", name: "proc_run", ok: false, output: "[exit code 1]", durationMs: 900, data: { exitCode: 1 } },
    ])
    expect(out).toContain("tool-card fail")
    expect(out).toContain("[exit code 1]")
  })

  it("renders fs_write results as a diff when before/after text is captured", () => {
    const out = html([
      {
        type: "tool_end",
        callId: "c4",
        name: "fs_write",
        ok: true,
        output: "wrote 18 bytes to a.ts",
        durationMs: 5,
        data: { before: "one\ntwo", after: "one\nTWO", path: "a.ts" },
      },
    ])
    expect(out).toContain("tool-diff")
    expect(out).toContain("diff-line del")
    expect(out).toContain("diff-line add")
    expect(out).toContain("TWO")
  })

  it("renders permission decisions, notices, the done summary and banners", () => {
    const out = html([
      { type: "permission", callId: "c5", name: "fs_write", decision: "once" },
      { type: "repair", attempt: 1, reason: "malformed arguments" },
      { type: "compacted", dropped: 3 },
      { type: "done", text: "All tests pass.", steps: 2 },
    ])
    expect(out).toContain("fs_write: allowed (once)")
    expect(out).toContain("Repaired a malformed tool call (malformed arguments).")
    expect(out).toContain("Compacted 3 older message(s)")
    expect(out).toContain("Finished in 2 steps.")
    expect(out).toContain("All tests pass.")
  })

  it("explains interruptions and errors honestly", () => {
    expect(html([{ type: "interrupted", reason: "max_steps" }])).toContain("step budget")
    expect(html([{ type: "interrupted", reason: "tools_not_bound" }])).toContain("desktop app")
    expect(html([{ type: "error", message: "gateway unreachable" }])).toContain("gateway unreachable")
  })
})
