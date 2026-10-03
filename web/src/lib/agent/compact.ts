/* History compaction for the agent loop (phase 4).

   Every step appends an assistant message plus one `role:"tool"` payload per
   call; file listings and process output make those payloads large fast, and
   a local model has a finite context. Compaction drops the OLDEST tool
   rounds (between the task message and a safe recent window) and replaces
   them with a single marker message, so:

   - the system prompt and the original task never move;
   - the retained window always starts at a non-`tool` message, otherwise the
     API would see an orphaned tool result with no preceding tool_calls;
   - tool usage so far survives as a short summary the model can build on. */

import type { WireMessage } from "../api"

export interface CompactOptions {
  /* Character budget for the whole message list. */
  maxChars: number
  /* Always keep this many trailing messages verbatim. */
  keepRecent: number
}

export const DEFAULT_COMPACT: CompactOptions = { maxChars: 24000, keepRecent: 8 }

function messageSize(message: WireMessage): number {
  const content = message.content ?? ""
  const calls = message.tool_calls
    ? message.tool_calls.reduce((sum, call) => sum + call.function.name.length + call.function.arguments.length, 0)
    : 0
  return content.length + calls + 64
}

function totalSize(messages: WireMessage[]): number {
  return messages.reduce((sum, message) => sum + messageSize(message), 0)
}

/* Index of the first message that is safe to start a window at: anything
   except a `tool` result (its assistant tool_calls must be present too). */
function earliestSafeStart(messages: WireMessage[], from: number): number {
  let index = from
  while (index > 0 && messages[index].role === "tool") index -= 1
  return index
}

function summarize(dropped: WireMessage[]): string {
  const tools: Record<string, number> = {}
  let lastResult = ""
  for (const message of dropped) {
    for (const call of message.tool_calls ?? []) {
      tools[call.function.name] = (tools[call.function.name] ?? 0) + 1
    }
    if (message.role === "tool" && message.content) lastResult = message.content
  }
  const toolsPart = Object.entries(tools)
    .map(([name, count]) => `${name}×${count}`)
    .join(", ")
  const snippet = lastResult.length > 240 ? `${lastResult.slice(0, 240)}…` : lastResult
  return [
    "[Earlier agent steps were compacted to fit the context window.",
    toolsPart ? `Tools used: ${toolsPart}.` : "",
    snippet ? `Last tool result: ${snippet}` : "",
    "Continue the task from here.]",
  ].filter(Boolean).join("\n")
}

export interface CompactOutcome {
  messages: WireMessage[]
  /* How many messages the marker replaced; 0 when nothing was touched. */
  dropped: number
}

export function compactMessages(messages: WireMessage[], options: CompactOptions = DEFAULT_COMPACT): CompactOutcome {
  if (totalSize(messages) <= options.maxChars || messages.length < 4) {
    return { messages, dropped: 0 }
  }

  /* Index 0 is the system prompt, index 1 the task; both stay. */
  const headCount = Math.min(2, messages.length)
  const windowStart = earliestSafeStart(messages, Math.max(headCount, messages.length - options.keepRecent))
  if (windowStart <= headCount) return { messages, dropped: 0 }

  const dropped = messages.slice(headCount, windowStart)
  const marker: WireMessage = { role: "user", content: summarize(dropped) }
  const next = [...messages.slice(0, headCount), marker, ...messages.slice(windowStart)]
  return { messages: next, dropped: dropped.length }
}
