/* Pure presentation helpers for the agent run view (phase 4c).

   Everything here is UI formatting: model-facing text for tool results,
   one-line argument summaries for cards and permission prompts, a naive
   line diff for write previews, and human wording for interruption
   reasons. Kept out of App.tsx so it can be unit tested directly. */

import type { DirListResult, FileWriteResult, ProcRunResult } from "../agent-tools"

export function summarizeArgs(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "fs_read":
    case "fs_list":
      return typeof args.path === "string" && args.path.trim() ? args.path : "(project root)"
    case "fs_write":
      return typeof args.path === "string" && args.path ? args.path : "(missing path)"
    case "proc_run": {
      const argv = Array.isArray(args.argv) ? args.argv.filter((part): part is string => typeof part === "string") : []
      if (!argv.length) return "(missing argv)"
      const joined = argv.join(" ")
      return joined.length > 96 ? `${joined.slice(0, 96)}…` : joined
    }
    case "todo":
      return `${Array.isArray(args.items) ? args.items.length : 0} item(s)`
    case "web_fetch": {
      const url = typeof args.url === "string" && args.url.trim() ? args.url.trim() : "(missing url)"
      return url.length > 96 ? `${url.slice(0, 96)}…` : url
    }
    case "subagent": {
      const task = typeof args.task === "string" && args.task.trim() ? args.task.trim() : "(missing task)"
      return task.length > 96 ? `${task.slice(0, 96)}…` : task
    }
    default: {
      const keys = Object.keys(args)
      return keys.length ? keys.join(", ") : "—"
    }
  }
}

/* Model-facing text of an fs_list result: one line per entry, folders
   marked with a trailing slash, sizes for files. */
export function formatListOutput(result: DirListResult): string {
  if (!result.entries.length) {
    return result.truncated ? "(folder has more entries than the list cap)" : "(empty folder)"
  }
  const lines = result.entries.map((entry) => {
    if (entry.kind === "dir") return `${entry.name}/`
    if (entry.kind === "symlink") return `${entry.name} (symlink)`
    return entry.size != null ? `${entry.name} (${entry.size} B)` : entry.name
  })
  if (result.truncated) lines.push("… more entries exist but were not listed (cap reached)")
  return lines.join("\n")
}

/* Model-facing text of a proc_run result: honest about timeouts, exit
   codes and truncation, stdout then stderr. */
export function formatProcOutput(result: ProcRunResult): string {
  const parts: string[] = []
  if (result.timedOut) parts.push("[timed out: the process was killed]")
  const stdout = result.stdout.replace(/\s+$/, "")
  const stderr = result.stderr.replace(/\s+$/, "")
  if (stdout) parts.push(stdout)
  if (stderr) parts.push(stderr)
  if (!stdout && !stderr) parts.push("(no output)")
  if (result.exitCode != null && result.exitCode !== 0 && !result.timedOut) {
    parts.push(`[exit code ${result.exitCode}]`)
  }
  if (result.truncated) parts.push("[output beyond the cap was discarded]")
  return parts.join("\n")
}

export function summarizeWrite(result: FileWriteResult): string {
  return `wrote ${result.bytes} bytes to ${result.path}`
}

export interface DiffLine {
  kind: "same" | "add" | "del"
  text: string
}

/* Naive line diff: common prefix and suffix stay `same`; the middle is
   shown as removed then added lines. Enough for the write-preview card
   without pulling in a diffing dependency. */
export function diffLines(before: string, after: string): DiffLine[] {
  const oldLines = before.length ? before.split("\n") : []
  const newLines = after.length ? after.split("\n") : []
  let start = 0
  while (start < oldLines.length && start < newLines.length && oldLines[start] === newLines[start]) {
    start += 1
  }
  let endOld = oldLines.length
  let endNew = newLines.length
  while (endOld > start && endNew > start && oldLines[endOld - 1] === newLines[endNew - 1]) {
    endOld -= 1
    endNew -= 1
  }
  return [
    ...oldLines.slice(0, start).map((text) => ({ kind: "same" as const, text })),
    ...oldLines.slice(start, endOld).map((text) => ({ kind: "del" as const, text })),
    ...newLines.slice(start, endNew).map((text) => ({ kind: "add" as const, text })),
    ...oldLines.slice(endOld).map((text) => ({ kind: "same" as const, text })),
  ]
}

/* Honest human wording for LoopResult/AgentEvent interruption reasons. */
export function interruptedMessage(reason: string): string {
  switch (reason) {
    case "tools_not_bound":
      return "Tools are not available in this session. File and process tools run inside the desktop app."
    case "max_steps":
      return "Stopped at the step budget before the task finished. Raise the limit or ask for a smaller task."
    case "unparseable_tool_call":
      return "The model could not produce a valid tool call after repair attempts, so the run stopped instead of guessing."
    case "aborted":
      return "Stopped."
    default:
      return `Stopped: ${reason}`
  }
}

/* Truncate long tool output for the collapsed card preview. */
export function previewOutput(output: string, maxChars = 2000): string {
  if (output.length <= maxChars) return output
  return `${output.slice(0, maxChars)}… (${output.length - maxChars} more characters)`
}

/* First local dev-server URL mentioned in proc_run output, ready to load in
   the preview iframe. Servers frequently bind 0.0.0.0, which the browser
   cannot always reach from an app origin — rewrite it to 127.0.0.1. */
export function detectLocalServerUrl(output: string): string | null {
  const match = /\bhttps?:\/\/(127\.0\.0\.1|localhost|0\.0\.0\.0|\[::1\])(:\d{2,5})?(\/[^\s"'<>)]*)?/.exec(output)
  if (!match) return null
  const host = match[1] === "0.0.0.0" ? "127.0.0.1" : match[1]
  const port = match[2] ?? ""
  const path = match[3] ?? ""
  return `${match[0].startsWith("https") ? "https" : "http"}://${host}${port}${path}`
}
