/* Context-window accounting for the topbar meter and chat auto-summary.

   A local model has a finite context; a long conversation silently degrades
   (or hard-fails) once the prompt exceeds it. The meter estimates token
   usage from character counts — good enough to drive a UI indicator and a
   compaction trigger without shipping a tokenizer — and `compactChatHistory`
   drops the oldest turns behind a summary marker so the next request fits. */

export const DEFAULT_CONTEXT_LIMIT = 8192
/* Heuristic: ~4 characters per token for English/code mixes. Local models
   vary, but a stable estimate keeps the meter honest about magnitude. */
export const CHARS_PER_TOKEN = 4
/* Auto-summary fires when the next request would likely overflow. */
export const AUTO_COMPACT_PERCENT = 85

export interface TokenEstimatableMessage {
  role: string
  content?: string | null
}

export function estimateTextTokens(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

export function estimateMessagesTokens(messages: TokenEstimatableMessage[]): number {
  return messages.reduce((sum, item) => sum + estimateTextTokens(item.content ?? "") + 4, 0)
}

/* Parses catalogue context strings: "32k", "8192", "128k" → tokens.
   Unparseable values ("Architecture dependent", "—") fall back. */
export function parseContextLimit(context: string | null | undefined, fallback = DEFAULT_CONTEXT_LIMIT): number {
  const raw = (context ?? "").trim().toLowerCase()
  if (!raw) return fallback
  const match = raw.match(/^(\d+(?:\.\d+)?)\s*([km]?)t?$/)
  if (!match) return fallback
  const value = Number(match[1])
  if (!Number.isFinite(value) || value <= 0) return fallback
  const unit = match[2]
  return Math.round(value * (unit === "k" ? 1_000 : unit === "m" ? 1_000_000 : 1))
}

export interface ContextUsage {
  usedTokens: number
  limitTokens: number
  /* 0..100, rounded; capped at 100. */
  percent: number
}

export function contextUsage(messages: TokenEstimatableMessage[], limitTokens: number): ContextUsage {
  const limit = limitTokens > 0 ? limitTokens : DEFAULT_CONTEXT_LIMIT
  const used = estimateMessagesTokens(messages)
  const percent = Math.min(100, Math.round((used / limit) * 100))
  return { usedTokens: used, limitTokens: limit, percent }
}

export interface ChatCompactOptions {
  /* Always keep this many trailing messages verbatim. */
  keepRecent: number
}

export interface ChatCompactOutcome<T extends TokenEstimatableMessage> {
  messages: T[]
  /* How many messages the summary marker replaced; 0 when nothing changed. */
  dropped: number
}

function summarizeChatTurns(dropped: TokenEstimatableMessage[]): string {
  const firstUser = dropped.find((item) => item.role === "user")?.content?.trim() ?? ""
  const topic = firstUser.length > 160 ? `${firstUser.slice(0, 160)}…` : firstUser
  return [
    "[Earlier conversation was summarized to fit the model's context window.",
    topic ? `Original request: ${topic}` : "",
    `${dropped.length} older message(s) folded into this summary. Continue from here.]`,
  ].filter(Boolean).join("\n")
}

/* Drop the oldest middle of a chat transcript (never the newest
   `keepRecent` messages) behind one summary marker message. Unlike the
   agent-loop compaction there is no tool-call pairing to preserve, so any
   non-empty history with at least one droppable message can compact. */
export function compactChatHistory<T extends TokenEstimatableMessage>(
  messages: T[],
  options: ChatCompactOptions = { keepRecent: 6 },
  makeMarker: (summary: string) => T,
): ChatCompactOutcome<T> {
  if (messages.length <= options.keepRecent + 1) return { messages, dropped: 0 }
  const windowStart = messages.length - options.keepRecent
  if (windowStart <= 0) return { messages, dropped: 0 }
  const dropped = messages.slice(0, windowStart)
  const marker = makeMarker(summarizeChatTurns(dropped))
  return { messages: [marker, ...messages.slice(windowStart)], dropped: dropped.length }
}
