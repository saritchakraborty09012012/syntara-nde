/* Tool executor for the agent loop (phase 4c): binds the model-facing
   tool names to the desktop shell commands and the local gateway.

   In a browser session the app never constructs this executor with tools
   (the loop gets an empty tool list and answers plainly), so every path
   here assumes the Tauri wrappers or a reachable local gateway. Failures
   are returned as honest `ok:false` results — the loop feeds them back to
   the model instead of crashing the run. */

import { agentFsList, agentFsRead, agentFsWrite, agentProcRun, agentTodoSet } from "../agent-tools"
import type { AgentEvent, ToolExecutor, ToolResult } from "./loop"
import { AGENT_TOOL_NAMES } from "./tools"
import { detectLocalServerUrl, formatListOutput, formatProcOutput, summarizeWrite } from "./ui"
import { gatewayWebFetch, validateFetchUrl, validateLocalPreviewUrl } from "./webfetch"

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
  /* submit_plan: hands the plan to the dock (App owns the state). */
  onPlan?: (items: string[]) => void
  /* ask_user: resolves with the user's answer from the question dock. */
  askUser?: (question: string, options?: string[]) => Promise<string>
  /* Preview dock controls (frontend-owned; loopback URLs only). */
  previewOpen?: (url: string) => Promise<ToolResult>
  previewReload?: () => Promise<ToolResult>
  /* Recent console lines captured from the Syntara window. */
  readConsole?: () => Promise<ToolResult>
  /* Extra timeline events the loop itself cannot see (plan/question). */
  onEvent?: (event: AgentEvent) => void
}

function needString(args: Record<string, unknown>, key: string): string {
  const value = args[key]
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`missing '${key}' argument`)
  }
  return value
}

/* Read-only git allowlist: the first element must be a safe subcommand and
   the flags must not enable external side effects (diff drivers, branch
   deletion). Everything else is refused with an explanation the model can
   act on, instead of running an arbitrary git invocation. */
function refuseUnsafeGit(argv: string[]): string | null {
  const sub = argv[1]
  const rest = argv.slice(2)
  const alwaysSafe = ["status", "diff", "log", "show", "blame", "ls-files", "rev-parse", "shortlog", "describe"]
  if (alwaysSafe.includes(sub)) {
    if (rest.some((flag) => flag === "--ext-diff" || flag === "--textconv")) {
      return "refused: --ext-diff/--textconv can execute external helpers; plain output only"
    }
    return null
  }
  if (sub === "branch") {
    /* Both spellings of the delete flag: -d/-D and --delete. The old
       check missed "-D" because it looked at the first character. */
    if (rest.some((flag) => /^-[dD]$/.test(flag) || flag === "--delete")) {
      return "refused: deleting branches is not allowed; read-only git only"
    }
    return null
  }
  if (sub === "remote" && (rest.length === 0 || rest.every((flag) => flag === "-v" || flag === "--verbose"))) return null
  return `refused: only read-only git subcommands are allowed (status, diff, log, show, blame, ls-files, rev-parse, branch, remote -v, shortlog) — got '${sub}'`
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
        case "git": {
          const rawArgs = args.args
          if (!Array.isArray(rawArgs) || !rawArgs.length || !rawArgs.every((part) => typeof part === "string")) {
            throw new Error("args must be a non-empty array of strings")
          }
          const argv = ["git", ...(rawArgs as string[])]
          const refusal = refuseUnsafeGit(argv)
          if (refusal) return { ok: false, output: refusal }
          const result = await agentProcRun(requireRoot(), argv)
          return {
            ok: result.exitCode === 0 && !result.timedOut,
            output: formatProcOutput(result),
            data: { exitCode: result.exitCode, timedOut: result.timedOut, durationMs: result.durationMs },
          }
        }
        case "submit_plan": {
          const rawSteps = args.steps
          if (!Array.isArray(rawSteps) || !rawSteps.every((step) => typeof step === "string")) {
            throw new Error("steps must be an array of strings")
          }
          const steps = (rawSteps as string[]).map((step) => step.trim()).filter(Boolean)
          if (!steps.length) throw new Error("steps must contain at least one non-empty plan step")
          options.onPlan?.(steps)
          options.onEvent?.({ type: "plan", items: steps })
          return {
            ok: true,
            output: "Plan submitted. The user will review, edit and approve it before execution.",
            data: { steps },
          }
        }
        case "ask_user": {
          const question = needString(args, "question")
          const suggested = Array.isArray(args.options)
            ? (args.options as unknown[]).filter((item): item is string => typeof item === "string" && !!item.trim())
            : []
          if (!options.askUser) {
            return { ok: false, output: "no interactive question dock is available; make a reasonable assumption and continue" }
          }
          options.onEvent?.({ type: "question", text: question, options: suggested })
          const answer = (await options.askUser(question, suggested)).trim()
          return {
            ok: true,
            output: answer || "(the user skipped the question — choose the most reasonable default and continue)",
            data: { question, answer },
          }
        }
        case "preview_open": {
          if (!options.previewOpen) return { ok: false, output: "the preview dock is not available" }
          const raw = typeof args.url === "string" && args.url.trim() ? args.url : null
          const check = raw ? validateLocalPreviewUrl(raw) : null
          if (check && !check.ok) throw new Error(check.reason)
          return options.previewOpen(check ? check.url : "")
        }
        case "preview_reload": {
          if (!options.previewReload) return { ok: false, output: "the preview dock is not available" }
          return options.previewReload()
        }
        case "console_read": {
          if (!options.readConsole) return { ok: false, output: "console capture is not available in this session" }
          return options.readConsole()
        }
        default:
          throw new Error(`no local handler registered for tool '${name}'`)
      }
    },
  }
}
