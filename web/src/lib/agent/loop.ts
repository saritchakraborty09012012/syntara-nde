/* The agent loop (phase 4).

   Same semantics as the host's reference implementation
   (`syntara/client.py` `_Agents.run`), ported to TypeScript and made
   observable: a bounded number of non-streaming round-trips against the
   local gateway, honest interruption when tools are not bound or the step
   budget runs out, tool errors fed back as results instead of crashing the
   run, and one bounded repair round when a local model mangles the JSON
   fallback format.

   The loop owns policy (steps, repair, compaction, permissions); the
   caller owns mechanisms (transport, tool execution, the permission UI). */

import {
  chatOnce,
  type ChatOnceResult,
  type OpenAIToolSpec,
  type TokenUsage,
  type WireMessage,
  type WireToolCall,
} from "../api"
import { compactMessages, DEFAULT_COMPACT, type CompactOptions } from "./compact"
import { buildRepairMessage, extractJsonToolCall, parseNativeArguments, REPAIR_LIMIT } from "./parse"
import {
  isGated,
  isGranted,
  recordDecision,
  type GrantStore,
  type PermissionDecision,
} from "./permissions"

export interface ToolDefinition {
  spec: OpenAIToolSpec
}

export interface ToolResult {
  ok: boolean
  output: string
  /* Structured extras for the UI (e.g. the diff of a write). */
  data?: Record<string, unknown>
}

export interface ToolRunContext {
  projectId: string | null
  signal: AbortSignal
}

export interface ToolExecutor {
  bound(name: string): boolean
  execute(name: string, args: Record<string, unknown>, context: ToolRunContext): Promise<ToolResult>
}

export type PermissionAsk = (
  tool: string,
  args: Record<string, unknown>,
  projectId: string | null,
) => Promise<PermissionDecision>

export type AgentEvent =
  | { type: "step"; step: number }
  | { type: "assistant_text"; text: string }
  | { type: "tool_start"; callId: string; name: string; args: Record<string, unknown> }
  | { type: "permission"; callId: string; name: string; decision: PermissionDecision }
  | { type: "tool_end"; callId: string; name: string; ok: boolean; output: string; durationMs: number; data?: Record<string, unknown> }
  | { type: "repair"; attempt: number; reason: string }
  | { type: "compacted"; dropped: number }
  | { type: "done"; text: string; steps: number }
  | { type: "interrupted"; reason: string }
  | { type: "error"; message: string }

export interface TransportRequest {
  messages: WireMessage[]
  tools: OpenAIToolSpec[]
}

export type AgentTransport = (request: TransportRequest) => Promise<ChatOnceResult>

export interface LoopOptions {
  baseUrl: string
  apiKey?: string
  model: string
  systemPrompt: string
  task: string
  tools: ToolDefinition[]
  executor: ToolExecutor
  askPermission: PermissionAsk
  projectId: string | null
  sessionGrants: Set<string>
  grantStore: GrantStore
  signal: AbortSignal
  onEvent: (event: AgentEvent) => void
  maxSteps?: number
  maxTokens?: number
  repairLimit?: number
  temperature?: number
  /* `null` disables compaction (tests). */
  compact?: CompactOptions | null
  /* Injected in tests; defaults to `chatOnce` against the real endpoint. */
  transport?: AgentTransport
}

export interface LoopResult {
  status: "done" | "interrupted" | "error"
  text: string | null
  steps: number
  repairs: number
  reason: string | null
  usage: TokenUsage | null
  /* Calls that never ran because the loop interrupted honestly. */
  pendingToolCalls: WireToolCall[]
}

export function agentSystemPrompt(base: string, tools: ToolDefinition[]): string {
  if (!tools.length) return base
  const list = tools
    .map((tool) => `- ${tool.spec.function.name}: ${tool.spec.function.description}`)
    .join("\n")
  return [
    base,
    "",
    "You can call tools while working on this task; prefer a tool call over guessing.",
    "Call one tool step at a time and wait for its result.",
    "If the API offers a native tool-calling mechanism, use it. Otherwise answer with ONLY a JSON object inside a ```json fence:",
    '{"tool": "<name>", "args": { ... }}',
    "Available tools:",
    list,
    "When the task is complete, reply with plain text and no tool call.",
  ].join("\n")
}

const emptyUsage = (): TokenUsage => ({ prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 })

function addUsage(total: TokenUsage, delta: TokenUsage | null): TokenUsage {
  if (!delta) return total
  return {
    prompt_tokens: total.prompt_tokens + delta.prompt_tokens,
    completion_tokens: total.completion_tokens + delta.completion_tokens,
    total_tokens: total.total_tokens + delta.total_tokens,
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function runAgentLoop(options: LoopOptions): Promise<LoopResult> {
  const maxSteps = options.maxSteps ?? 8
  const repairLimit = options.repairLimit ?? REPAIR_LIMIT
  const toolNames = options.tools.map((tool) => tool.spec.function.name)
  const specs = options.tools.map((tool) => tool.spec)

  const transport: AgentTransport =
    options.transport ??
    ((request) =>
      chatOnce({
        baseUrl: options.baseUrl,
        apiKey: options.apiKey,
        model: options.model,
        messages: request.messages,
        tools: request.tools,
        temperature: options.temperature ?? 0.2,
        maxTokens: options.maxTokens,
        signal: options.signal,
      }))

  let messages: WireMessage[] = [
    { role: "system", content: agentSystemPrompt(options.systemPrompt, options.tools) },
    { role: "user", content: options.task },
  ]
  let steps = 0
  let repairs = 0
  let usage = emptyUsage()

  const result = (
    status: LoopResult["status"],
    text: string | null,
    reason: string | null,
    pending: WireToolCall[] = [],
  ): LoopResult => ({ status, text, steps, repairs, reason, usage, pendingToolCalls: pending })

  /* Executes one call and appends the `role:"tool"` result, mirroring the
     host loop: permission gate → execute → JSON result string. */
  const executeCall = async (callId: string, name: string, args: Record<string, unknown>): Promise<WireMessage> => {
    options.onEvent({ type: "tool_start", callId, name, args })
    let toolResult: ToolResult
    let denied = false

    if (isGated(name) && !isGranted(options.projectId, name, options.sessionGrants, options.grantStore)) {
      const decision = await options.askPermission(name, args, options.projectId)
      options.onEvent({ type: "permission", callId, name, decision })
      recordDecision(decision, options.projectId, name, options.sessionGrants, options.grantStore)
      denied = decision === "deny"
    }

    if (denied) {
      toolResult = { ok: false, output: "permission denied by the user" }
      options.onEvent({ type: "tool_end", callId, name, ok: false, output: toolResult.output, durationMs: 0 })
    } else {
      const started = performance.now()
      try {
        toolResult = await options.executor.execute(name, args, {
          projectId: options.projectId,
          signal: options.signal,
        })
      } catch (error) {
        toolResult = { ok: false, output: errorText(error) }
      }
      options.onEvent({
        type: "tool_end",
        callId,
        name,
        ok: toolResult.ok,
        output: toolResult.output,
        durationMs: Math.round(performance.now() - started),
        ...(toolResult.data ? { data: toolResult.data } : {}),
      })
    }

    return {
      role: "tool",
      tool_call_id: callId,
      content: JSON.stringify({ ok: toolResult.ok, output: toolResult.output, ...(toolResult.data ?? {}) }),
    }
  }

  /* A failed tool result that never executed (bad arguments, unbound name):
     emitted as events so the UI still shows the card. */
  const refusedCall = (callId: string, name: string, reason: string): WireMessage => {
    options.onEvent({ type: "tool_start", callId, name, args: {} })
    options.onEvent({ type: "tool_end", callId, name, ok: false, output: reason, durationMs: 0 })
    return { role: "tool", tool_call_id: callId, content: JSON.stringify({ ok: false, output: reason }) }
  }

  const maybeCompact = () => {
    if (options.compact === null) return
    const outcome = compactMessages(messages, options.compact ?? DEFAULT_COMPACT)
    if (outcome.dropped > 0) {
      messages = outcome.messages
      options.onEvent({ type: "compacted", dropped: outcome.dropped })
    }
  }

  for (;;) {
    if (options.signal.aborted) return result("interrupted", null, "aborted")
    maybeCompact()

    let response: ChatOnceResult
    try {
      response = await transport({ messages, tools: specs })
    } catch (error) {
      if (options.signal.aborted) return result("interrupted", null, "aborted")
      options.onEvent({ type: "error", message: errorText(error) })
      return result("error", null, errorText(error))
    }
    usage = addUsage(usage, response.usage)
    options.onEvent({ type: "step", step: steps + 1 })

    /* --- native path: the runtime emitted OpenAI tool_calls ------------ */
    if (response.toolCalls.length > 0) {
      if (toolNames.length === 0) {
        options.onEvent({ type: "interrupted", reason: "tools_not_bound" })
        return result("interrupted", response.content, "tools_not_bound", response.toolCalls)
      }
      if (steps >= maxSteps) {
        options.onEvent({ type: "interrupted", reason: "max_steps" })
        return result("interrupted", response.content, "max_steps", response.toolCalls)
      }

      messages.push({ role: "assistant", content: response.content, tool_calls: response.toolCalls })
      for (const call of response.toolCalls) {
        if (options.signal.aborted) return result("interrupted", null, "aborted")
        const parsed = parseNativeArguments(call.function.arguments)
        if (!parsed.ok) {
          /* Malformed native arguments never execute with guessed defaults;
             the model gets the error back and can retry. */
          messages.push(refusedCall(call.id, call.function.name, parsed.reason))
          steps += 1
          continue
        }
        if (!options.executor.bound(call.function.name)) {
          /* A name the model invented but nothing executes: feed the honest
             error back, exactly like the host loop. */
          messages.push(refusedCall(call.id, call.function.name, `no local handler registered for tool '${call.function.name}'`))
          steps += 1
          continue
        }
        messages.push(await executeCall(call.id, call.function.name, parsed.args))
        steps += 1
      }
      continue
    }

    /* --- text response: JSON fallback call, repair, or the final answer - */
    const content = response.content ?? ""
    const outcome = extractJsonToolCall(content, toolNames)

    if (outcome.status === "absent") {
      if (content.trim()) options.onEvent({ type: "assistant_text", text: content })
      options.onEvent({ type: "done", text: content, steps })
      return result("done", content, null)
    }

    if (outcome.status === "malformed") {
      repairs += 1
      if (repairs > repairLimit) {
        options.onEvent({ type: "interrupted", reason: "unparseable_tool_call" })
        return result("interrupted", content, "unparseable_tool_call")
      }
      options.onEvent({ type: "repair", attempt: repairs, reason: outcome.reason })
      messages.push({ role: "assistant", content })
      messages.push({ role: "user", content: buildRepairMessage(outcome.reason) })
      continue
    }

    /* parsed JSON tool call */
    if (toolNames.length === 0) {
      options.onEvent({ type: "interrupted", reason: "tools_not_bound" })
      return result("interrupted", content, "tools_not_bound", [
        { id: `json_${steps + 1}`, type: "function", function: { name: outcome.name, arguments: JSON.stringify(outcome.args) } },
      ])
    }
    if (steps >= maxSteps) {
      options.onEvent({ type: "interrupted", reason: "max_steps" })
      return result("interrupted", content, "max_steps", [
        { id: `json_${steps + 1}`, type: "function", function: { name: outcome.name, arguments: JSON.stringify(outcome.args) } },
      ])
    }

    const callId = `json_${steps + 1}`
    messages.push({ role: "assistant", content })
    if (options.executor.bound(outcome.name)) {
      messages.push(await executeCall(callId, outcome.name, outcome.args))
    } else {
      messages.push(refusedCall(callId, outcome.name, `no local handler registered for tool '${outcome.name}'`))
    }
    steps += 1
  }
}
