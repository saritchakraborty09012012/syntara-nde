import { describe, expect, it } from "vitest"

import {
  detectLocalServerUrl,
  diffLines,
  formatListOutput,
  formatProcOutput,
  interruptedMessage,
  previewOutput,
  summarizeArgs,
  summarizeWrite,
} from "@/lib/agent/ui"

describe("summarizeArgs", () => {
  it("shows the path for fs tools and the root when the path is missing", () => {
    expect(summarizeArgs("fs_read", { path: "src/app.ts" })).toBe("src/app.ts")
    expect(summarizeArgs("fs_list", {})).toBe("(project root)")
    expect(summarizeArgs("fs_read", { path: "  " })).toBe("(project root)")
  })

  it("shows the URL for web_fetch and the task for subagent", () => {
    expect(summarizeArgs("web_fetch", { url: "https://example.com/docs" })).toBe("https://example.com/docs")
    expect(summarizeArgs("web_fetch", {})).toBe("(missing url)")
    expect(summarizeArgs("subagent", { task: "Summarise the README" })).toBe("Summarise the README")
    expect(summarizeArgs("subagent", { task: "  " })).toBe("(missing task)")
    const long = summarizeArgs("web_fetch", { url: `https://example.com/${"x".repeat(200)}` })
    expect(long.length).toBeLessThanOrEqual(97)
    expect(long.endsWith("…")).toBe(true)
  })

  it("flags a missing write path", () => {
    expect(summarizeArgs("fs_write", {})).toBe("(missing path)")
  })

  it("joins argv and truncates very long commands", () => {
    expect(summarizeArgs("proc_run", { argv: ["git", "status", "--short"] })).toBe("git status --short")
    expect(summarizeArgs("proc_run", { argv: [] })).toBe("(missing argv)")
    expect(summarizeArgs("proc_run", {})).toBe("(missing argv)")
    const long = summarizeArgs("proc_run", { argv: ["python", "-c", "x".repeat(200)] })
    expect(long.length).toBeLessThanOrEqual(97)
    expect(long.endsWith("…")).toBe(true)
  })

  it("counts todo items and falls back to argument keys for unknown tools", () => {
    expect(summarizeArgs("todo", { items: ["a", "b", "c"] })).toBe("3 item(s)")
    expect(summarizeArgs("todo", {})).toBe("0 item(s)")
    expect(summarizeArgs("memory_write", { title: "t", body: "b" })).toBe("title, body")
    expect(summarizeArgs("memory_write", {})).toBe("—")
  })
})

describe("formatListOutput", () => {
  it("marks directories, symlinks and file sizes", () => {
    const text = formatListOutput({
      path: "/repo",
      entries: [
        { name: "src", kind: "dir", size: null },
        { name: "readme.md", kind: "file", size: 120 },
        { name: "alias", kind: "symlink", size: null },
        { name: "socket", kind: "other", size: null },
      ],
      truncated: false,
    })
    expect(text).toBe("src/\nreadme.md (120 B)\nalias (symlink)\nsocket")
  })

  it("is honest about empty folders and truncation", () => {
    expect(formatListOutput({ path: "/repo", entries: [], truncated: false })).toBe("(empty folder)")
    expect(formatListOutput({ path: "/repo", entries: [], truncated: true })).toBe("(folder has more entries than the list cap)")
    const text = formatListOutput({ path: "/repo", entries: [{ name: "a", kind: "file", size: 1 }], truncated: true })
    expect(text).toContain("… more entries exist but were not listed (cap reached)")
  })
})

describe("formatProcOutput", () => {
  it("reports timeouts, exit codes and discarded output", () => {
    const text = formatProcOutput({
      stdout: "building\n",
      stderr: "warning: x\n",
      exitCode: 2,
      timedOut: false,
      truncated: true,
      durationMs: 12,
    })
    expect(text).toBe("building\nwarning: x\n[exit code 2]\n[output beyond the cap was discarded]")
  })

  it("marks a timed-out process without a bogus exit line", () => {
    const text = formatProcOutput({ stdout: "", stderr: "", exitCode: null, timedOut: true, truncated: false, durationMs: 5 })
    expect(text).toBe("[timed out: the process was killed]\n(no output)")
  })

  it("reports no output for a clean empty run", () => {
    expect(formatProcOutput({ stdout: "", stderr: "", exitCode: 0, timedOut: false, truncated: false, durationMs: 1 })).toBe("(no output)")
  })
})

describe("summarizeWrite", () => {
  it("states bytes and path", () => {
    expect(summarizeWrite({ path: "a.ts", bytes: 42 })).toBe("wrote 42 bytes to a.ts")
  })
})

describe("diffLines", () => {
  it("keeps the common prefix and suffix and shows the changed middle", () => {
    const lines = diffLines("one\ntwo\nthree", "one\ntwo\nTHREE\nfour")
    expect(lines).toEqual([
      { kind: "same", text: "one" },
      { kind: "same", text: "two" },
      { kind: "del", text: "three" },
      { kind: "add", text: "THREE" },
      { kind: "add", text: "four" },
    ])
  })

  it("treats a missing previous file as pure additions", () => {
    expect(diffLines("", "new line")).toEqual([{ kind: "add", text: "new line" }])
    expect(diffLines("old", "")).toEqual([{ kind: "del", text: "old" }])
  })
})

describe("interruptedMessage", () => {
  it("explains each loop interruption reason", () => {
    expect(interruptedMessage("tools_not_bound")).toContain("desktop app")
    expect(interruptedMessage("max_steps")).toContain("step budget")
    expect(interruptedMessage("unparseable_tool_call")).toContain("instead of guessing")
    expect(interruptedMessage("aborted")).toBe("Stopped.")
    expect(interruptedMessage("custom-why")).toBe("Stopped: custom-why")
  })
})

describe("previewOutput", () => {
  it("passes short output through and truncates long output with a count", () => {
    expect(previewOutput("hello")).toBe("hello")
    const long = "x".repeat(5000)
    const shown = previewOutput(long, 100)
    expect(shown.length).toBeLessThan(5000)
    expect(shown).toContain("… (4900 more characters)")
  })
})

describe("detectLocalServerUrl", () => {
  it("finds the first local server URL in proc output", () => {
    const output = "listening on http://127.0.0.1:5173/\nnone of the other lines matter"
    expect(detectLocalServerUrl(output)).toBe("http://127.0.0.1:5173/")
    expect(detectLocalServerUrl("vite ready on http://localhost:3000")).toBe("http://localhost:3000")
  })

  it("rewrites 0.0.0.0 binds to a browser-reachable host", () => {
    expect(detectLocalServerUrl("Serving on http://0.0.0.0:8080")).toBe("http://127.0.0.1:8080")
  })

  it("keeps the path when the server prints a full URL", () => {
    expect(detectLocalServerUrl("open http://127.0.0.1:4173/app/index.html now"))
      .toBe("http://127.0.0.1:4173/app/index.html")
  })

  it("ignores non-local hosts and text without a URL", () => {
    expect(detectLocalServerUrl("https://example.com/docs")).toBeNull()
    expect(detectLocalServerUrl("server started successfully")).toBeNull()
  })
})
