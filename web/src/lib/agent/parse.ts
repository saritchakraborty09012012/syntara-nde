/* Tool-call parsing for local models (phase 4).

   Local GGUF models span two worlds:
   - runtimes whose chat template speaks the OpenAI `tool_calls` dialect
     (native path — extracted in loop.ts from the API message), and
   - models that only emit text. For those the agent system prompt asks for
     a single JSON object `{"tool": ..., "args": {...}}` — optionally in a
     ```json fence (fallback path — this file).

   Parsing is deliberately forgiving about WHERE the object sits (fenced or
   bare, preceded by prose) but strict about it being parseable JSON; a
   present-but-broken object yields `malformed`, which the loop turns into
   one bounded repair round instead of silently running a guess. */

export type ToolParseResult =
  | { status: "parsed"; name: string; args: Record<string, unknown> }
  | { status: "malformed"; reason: string }
  | { status: "absent" }

interface FencedBlock {
  body: string
  open: boolean
}

/* All ``` fences in the text. An unclosed fence counts too: a model that
   opened the block and then emitted broken JSON still intended a call. */
function fencedBlocks(text: string): FencedBlock[] {
  const blocks: FencedBlock[] = []
  const pattern = /```([a-zA-Z0-9_-]*)\n?/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    const bodyStart = pattern.lastIndex
    const close = text.indexOf("```", bodyStart)
    if (close === -1) {
      blocks.push({ body: text.slice(bodyStart), open: false })
      break
    }
    blocks.push({ body: text.slice(bodyStart, close), open: true })
    pattern.lastIndex = close + 3
  }
  return blocks
}

/* First balanced top-level `{…}` in the text, string-aware (braces inside
   string literals must not count) and escape-aware. */
function firstJsonObject(text: string): string | null {
  const start = text.indexOf("{")
  if (start === -1) return null
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === "{") depth += 1
    else if (ch === "}") {
      depth -= 1
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/* Classify a parsed JSON value as a tool call. `tool` is our documented key
   and is unambiguous; `name`/`function` are accepted too but only mark a
   call when the value is one of the bound tools (a prose answer containing
   {"name": ...} must not derail the loop). */
function classify(
  value: unknown,
  toolNames: readonly string[],
): { name: string; args: Record<string, unknown> } | null {
  const obj = asObject(value)
  if (!obj) return null
  const explicitTool = typeof obj.tool === "string" ? obj.tool : null
  const byName = typeof obj.name === "string" ? obj.name : null
  const byFunction = asObject(obj.function) && typeof (obj.function as { name?: unknown }).name === "string"
    ? ((obj.function as { name: string }).name)
    : null
  const name = explicitTool ?? byName ?? byFunction
  if (!name) return null
  if (!explicitTool && !toolNames.includes(name)) return null
  const rawArgs = obj.args ?? obj.arguments ?? obj.parameters
  const args = asObject(rawArgs) ?? {}
  return { name, args }
}

export function extractJsonToolCall(text: string, toolNames: readonly string[]): ToolParseResult {
  const blocks = fencedBlocks(text)
  const candidates: unknown[] = []
  let sawBrokenBlock = false

  for (const block of blocks) {
    const trimmed = block.body.trim()
    if (!trimmed) continue
    try {
      candidates.push(JSON.parse(trimmed))
    } catch {
      sawBrokenBlock = true
    }
  }
  if (!blocks.length) {
    const raw = firstJsonObject(text)
    if (raw !== null) {
      try {
        candidates.push(JSON.parse(raw))
      } catch {
        /* A stray unbalanced brace in prose is not a broken tool call —
           only an explicit fence proves the model meant to emit one. */
      }
    }
  }

  for (const candidate of candidates) {
    const call = classify(candidate, toolNames)
    if (call) return { status: "parsed", ...call }
  }

  if (sawBrokenBlock) {
    return {
      status: "malformed",
      reason: "the JSON inside the ``` fence did not parse",
    }
  }
  if (blocks.length) {
    /* A fence was opened but the content carried no tool object at all. */
    return { status: "malformed", reason: "the fenced block did not contain a {\"tool\": ..., \"args\": ...} object" }
  }
  return { status: "absent" }
}

export const REPAIR_LIMIT = 2

export function buildRepairMessage(reason: string): string {
  return [
    `Your tool call could not be used: ${reason}.`,
    'Reply with ONLY the tool call as JSON inside a ```json fence, in exactly this shape:',
    '{"tool": "<one of the available tool names>", "args": { ... }}',
    "Do not add any other text.",
  ].join("\n")
}

/* Native `function.arguments` is a string; a model that emits invalid JSON
   there must not silently become `{}` (that would run a tool with default
   arguments the user never approved). The caller feeds this error back as
   the tool result instead. */
export function parseNativeArguments(raw: string): { ok: true; args: Record<string, unknown> } | { ok: false; reason: string } {
  try {
    const value: unknown = JSON.parse(raw || "{}")
    const obj = asObject(value)
    if (!obj) return { ok: false, reason: "arguments were not a JSON object" }
    return { ok: true, args: obj }
  } catch {
    return { ok: false, reason: "arguments were not valid JSON" }
  }
}
