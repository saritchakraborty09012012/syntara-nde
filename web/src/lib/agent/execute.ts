/* Tool executor for the agent loop (phase 4c): binds the model-facing
   tool names to the desktop shell commands and the local gateway.

   In a browser session the app never constructs this executor with tools
   (the loop gets an empty tool list and answers plainly), so every path
   here assumes the Tauri wrappers or a reachable local gateway. Failures
   are returned as honest `ok:false` results — the loop feeds them back to
   the model instead of crashing the run. */

import { agentFsList, agentFsRead, agentFsWrite, agentProcRun, agentTodoSet } from "../agent-tools"
import type { ToolExecutor, ToolResult } from "./loop"
import { AGENT_TOOL_NAMES } from "./tools"
import { detectLocalServerUrl, formatListOutput, formatProcOutput, summarizeWrite } from "./ui"
import { gatewayWebFetch, validateFetchUrl } from "./webfetch"

/* Cap the text handed back to the model so one huge page cannot blow the
   context window; the gateway's own 512 KB cap is the hard ceiling. */
const WEB_FETCH_OUTPUT_CAP = 60_000

export interface ExecutorOptions {
  /* Gateway base URL (…/v1) and optional key for web_fetch. */
  baseUrl: string
  apiKey?: string
  /* Called with the fresh todo list so the UI panel can update live. */
  onTodo?: (items: string[]) => void
  /* Called when proc_run output reveals a local dev-server URL, so the
     preview dock can load it. Only non-null detections are reported. */
  onServerUrl?: (url: string) => void
  /* Runs a read-only sub-agent and returns its final report. Injected by
     App because it owns the model + transport wiring. */
  runSubagent?: (task: string, signal: AbortSignal) => Promise<ToolResult>
}

function needString(args: Record<string, unknown>, key: string): string {
  const value = args[key]
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`missing '${key}' argument`)
  }
  return value
}

export function createAgentExecutor(root: string | null, options: ExecutorOptions): ToolExecutor {
  const requireRoot = (): string => {
    if (!root) throw new Error("no project folder is selected — pick a folder for this project first")
    return root
  }

  return {
    bound: (name) => AGENT_TOOL_NAMES.includes(name),
    execute: async (name, args, context): Promise<ToolResult> => {
      switch (name) {
        case "fs_read": {
          const path = needString(args, "path")
          const result = await agentFsRead(requireRoot(), path)
          const output = result.truncated ? `${result.content}\n[file truncated at the read cap]` : result.content
          return { ok: true, output, data: { path: result.path, size: result.size, truncated: result.truncated } }
        }
        case "fs_list": {
          const path = typeof args.path === "string" ? args.path : ""
          const result = await agentFsList(requireRoot(), path || undefined)
          return {
            ok: true,
            output: formatListOutput(result),
            data: { path: result.path, entries: result.entries, truncated: result.truncated },
          }
        }
        case "fs_write": {
          const path = needString(args, "path")
          const content = typeof args.content === "string" ? args.content : (() => { throw new Error("missing 'content' argument") })()
          const rootPath = requireRoot()
          /* Best-effort capture of the previous text so the card can show
             a diff; a missing file simply diffs against nothing. */
          let before: string | null = null
          try {
            before = (await agentFsRead(rootPath, path)).content
          } catch {
            before = null
          }
          const result = await agentFsWrite(rootPath, path, content)
          return {
            ok: true,
            output: summarizeWrite(result),
            data: { path: result.path, bytes: result.bytes, before, after: content },
          }
        }
        case "proc_run": {
          const rawArgv = args.argv
          if (!Array.isArray(rawArgv) || !rawArgv.length || !rawArgv.every((part) => typeof part === "string")) {
            throw new Error("argv must be a non-empty array of strings")
          }
          const timeout = typeof args.timeout_s === "number" && args.timeout_s > 0 ? Math.floor(args.timeout_s) : undefined
          const result = await agentProcRun(requireRoot(), rawArgv as string[], timeout)
          const ok = result.exitCode === 0 && !result.timedOut
          if (ok) {
            const serverUrl = detectLocalServerUrl(`${result.stdout}\n${result.stderr}`)
            if (serverUrl) options.onServerUrl?.(serverUrl)
          }
          return {
            ok,
            output: formatProcOutput(result),
            data: {
              exitCode: result.exitCode,
              timedOut: result.timedOut,
              truncated: result.truncated,
              durationMs: result.durationMs,
            },
          }
        }
        case "todo": {
          const rawItems = args.items
          if (!Array.isArray(rawItems) || !rawItems.every((item) => typeof item === "string")) {
            throw new Error("items must be an array of strings")
          }
          const saved = await agentTodoSet(rawItems as string[])
          options.onTodo?.(saved)
          return { ok: true, output: `saved ${saved.length} todo item${saved.length === 1 ? "" : "s"}`, data: { items: saved } }
        }
        case "web_fetch": {
          const check = validateFetchUrl(args.url)
          if (!check.ok) throw new Error(check.reason)
          const result = await gatewayWebFetch({
            baseUrl: options.baseUrl,
            apiKey: options.apiKey,
            url: check.url,
            signal: context.signal,
          })
          if (!result.ok) {
            return {
              ok: false,
              output: result.error ?? "the page could not be fetched",
              data: { url: check.url, status: result.status },
            }
          }
          const text = result.text.length > WEB_FETCH_OUTPUT_CAP
            ? `${result.text.slice(0, WEB_FETCH_OUTPUT_CAP)}… [page text truncated at the tool cap]`
            : result.text
          const notes: string[] = []
          if (result.finalUrl && result.finalUrl !== check.url) notes.push(`[redirected to ${result.finalUrl}]`)
          if (result.truncated) notes.push("[the page was larger than the 512 KB fetch cap; the rest was discarded]")
          return {
            ok: true,
            output: [text || "(the page contained no extractable text)", ...notes].join("\n"),
            data: { url: check.url, status: result.status, contentType: result.contentType, finalUrl: result.finalUrl },
          }
        }
        case "subagent": {
          const task = needString(args, "task")
          if (!options.runSubagent) {
            return { ok: false, output: "sub-agents are not available in this session" }
          }
          const report = await options.runSubagent(task, context.signal)
          return {
            ...report,
            output: report.ok ? `sub-agent report:\n${report.output}` : report.output,
          }
        }
        default:
          throw new Error(`no local handler registered for tool '${name}'`)
      }
    },
  }
}
