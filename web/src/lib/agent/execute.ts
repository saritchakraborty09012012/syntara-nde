/* Tool executor for the agent loop (phase 4c): binds the model-facing
   tool names to the desktop shell commands.

   In a browser session the app never constructs this executor with tools
   (the loop gets an empty tool list and answers plainly), so every path
   here assumes the Tauri wrappers are available. Failures are returned as
   honest `ok:false` results — the loop feeds them back to the model
   instead of crashing the run. */

import { agentFsList, agentFsRead, agentFsWrite, agentProcRun, agentTodoSet } from "../agent-tools"
import type { ToolExecutor, ToolResult } from "./loop"
import { AGENT_TOOL_NAMES } from "./tools"
import { formatListOutput, formatProcOutput, summarizeWrite } from "./ui"

export interface ExecutorHooks {
  /* Called with the fresh todo list so the UI panel can update live. */
  onTodo?: (items: string[]) => void
}

function needString(args: Record<string, unknown>, key: string): string {
  const value = args[key]
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`missing '${key}' argument`)
  }
  return value
}

export function createAgentExecutor(root: string | null, hooks: ExecutorHooks = {}): ToolExecutor {
  const requireRoot = (): string => {
    if (!root) throw new Error("no project folder is selected — pick a folder for this project first")
    return root
  }

  return {
    bound: (name) => AGENT_TOOL_NAMES.includes(name),
    execute: async (name, args): Promise<ToolResult> => {
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
          hooks.onTodo?.(saved)
          return { ok: true, output: `saved ${saved.length} todo item${saved.length === 1 ? "" : "s"}`, data: { items: saved } }
        }
        default:
          throw new Error(`no local handler registered for tool '${name}'`)
      }
    },
  }
}
