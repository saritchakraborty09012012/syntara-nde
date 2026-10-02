export type ChatRole = "system" | "user" | "assistant"

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  /* Data URIs of the pictures attached to this turn. Kept on the message rather
     than on the draft, because the transcript is resent on every later turn and
     the model has to keep seeing what it was shown. */
  images?: string[]
}

interface OpenAIError {
  error?: { message?: string }
}

export interface SchedulerHealth {
  active: boolean | number
  capacity?: number
  queued: number
  max_queue: number
  queue_timeout_seconds: number
  admitted: number
  completed: number
  rejected: number
  timed_out: number
  cancelled: number
}

export interface TiersHealth {
  vram: number
  ram: number
  disk: number
  vram_gb: number
  ram_gb: number
}

export interface HwinfoHealth {
  cores: number
  ram_total_gb: number
  ram_avail_gb: number
  gpus: number
  vram_total_gb: number
  cpu: string
  gpu: string
}

export interface HealthResponse {
  status: string
  scheduler?: SchedulerHealth
  kv_slots?: number
  tiers?: TiersHealth
  hwinfo?: HwinfoHealth
}

export interface ProfileTurn {
  wall_s: number
  prompt_tokens: number
  completion_tokens: number
  expert_disk_s: number
  expert_wait_s: number
  expert_matmul_s: number
  attention_s: number
  lm_head_s: number
  forwards: number
}

export interface ProfileResponse {
  seq: number
  turns: ProfileTurn[]
}

export interface TokenUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface StreamChatResult {
  finishReason: string | null
  usage: TokenUsage | null
  requestId: string | null
  queueWaitMs: number | null
}

export function endpoint(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`
}

export function serverEndpoint(baseUrl: string, path: string) {
  return endpoint(baseUrl.replace(/\/v1\/?$/, ""), path)
}

function headers(apiKey = "") {
  return {
    "Content-Type": "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  }
}

/* Structured HTTP failure (track 2b): the status and the server's
   Retry-After survive as fields so the send path can decide whether a
   local gateway that is still loading or restarting is worth waiting
   for, instead of flattening everything into an opaque message. */
export class ApiError extends Error {
  readonly status: number
  readonly retryAfterSeconds: number | null

  constructor(message: string, status: number, retryAfterSeconds: number | null) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }
}

/* Retry-After arrives as either seconds or an HTTP date; only the
   seconds form matters for a localhost gateway, and the result is
   always bounded so a bad header cannot pin the UI for minutes. */
export function parseRetryAfter(header: string | null): number | null {
  if (!header) return null
  const seconds = Number(header.trim())
  if (!Number.isFinite(seconds) || seconds < 0) return null
  return Math.min(seconds, 15)
}

async function fail(response: Response): Promise<never> {
  const fallback = `${response.status} ${response.statusText}`
  let message = fallback
  try {
    const body = (await response.json()) as OpenAIError
    message = body.error?.message || fallback
  } catch {
    /* Non-JSON error body (proxy page, bare 503): the status line is
       still useful enough to show. */
  }
  throw new ApiError(message, response.status, parseRetryAfter(response.headers.get("retry-after")))
}

export async function listModels(baseUrl: string, apiKey = "", signal?: AbortSignal) {
  const response = await fetch(endpoint(baseUrl, "models"), { headers: headers(apiKey), signal })
  if (!response.ok) await fail(response)
  const body = (await response.json()) as { data?: Array<{ id: string }> }
  return (body.data || []).map((model) => model.id)
}

export async function getHealth(baseUrl: string, apiKey = "", signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(serverEndpoint(baseUrl, "health"), { headers: headers(apiKey), signal })
  if (!response.ok) await fail(response)
  return (await response.json()) as HealthResponse
}

export async function getProfile(baseUrl: string, apiKey = "", signal?: AbortSignal): Promise<ProfileResponse> {
  const response = await fetch(serverEndpoint(baseUrl, "profile"), { headers: headers(apiKey), signal })
  if (!response.ok) await fail(response)
  return (await response.json()) as ProfileResponse
}

export function extractSSE(buffer: string) {
  const frames = buffer.split(/\r?\n\r?\n/)
  const rest = frames.pop() || ""
  const data = frames.flatMap((frame) =>
    frame
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart()),
  )
  return { data, rest }
}

export interface StreamChatOptions {
  baseUrl: string
  /* Optional bearer token for gateways that enable auth; the packaged
     localhost host runs without one, so the UI never asks for a key. */
  apiKey?: string
  model: string
  messages: ChatMessage[]
  temperature: number
  maxTokens: number
  enableThinking: boolean
  cacheSlot?: number
  signal: AbortSignal
  onDelta: (text: string) => void
}

export async function streamChat(options: StreamChatOptions): Promise<StreamChatResult> {
  const response = await fetch(endpoint(options.baseUrl, "chat/completions"), {
    method: "POST",
    headers: headers(options.apiKey),
    signal: options.signal,
    body: JSON.stringify({
      model: options.model,
      /* A turn with pictures goes out in the content-array form the API takes;
         a plain turn stays a string, so a text-only server sees exactly what it
         saw before this existed. */
      messages: options.messages.map(({ role, content, images }) => images?.length
        ? { role, content: [
            ...(content ? [{ type: "text", text: content }] : []),
            ...images.map(url => ({ type: "image_url", image_url: { url } })),
          ] }
        : { role, content }),
      temperature: options.temperature,
      max_completion_tokens: options.maxTokens,
      enable_thinking: options.enableThinking,
      ...(options.cacheSlot === undefined ? {} : { cache_slot: options.cacheSlot }),
      stream: true,
      stream_options: { include_usage: true },
    }),
  })
  if (!response.ok) await fail(response)
  if (!response.body) throw new Error("The server returned an empty stream.")

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let finishReason: string | null = null
  let usage: TokenUsage | null = null

  const consume = (data: string) => {
    if (data === "[DONE]") return
    const event = JSON.parse(data) as {
      choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>
      usage?: TokenUsage | null
    }
    const choice = event.choices?.[0]
    const text = choice?.delta?.content
    if (text) options.onDelta(text)
    if (choice?.finish_reason) finishReason = choice.finish_reason
    if (event.usage) usage = event.usage
  }

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    const parsed = extractSSE(buffer)
    buffer = parsed.rest
    parsed.data.forEach(consume)
    if (done) break
  }

  const queueWaitHeader = response.headers.get("x-syntara-queue-wait-ms")
  const parsedQueueWait = queueWaitHeader === null ? null : Number(queueWaitHeader)
  return {
    finishReason,
    usage,
    requestId: response.headers.get("x-request-id"),
    queueWaitMs: parsedQueueWait !== null && Number.isFinite(parsedQueueWait) ? parsedQueueWait : null,
  }
}

/* Modalita brio: il modello non genera, assegna una probabilita a ogni opzione
 * ammessa. Il ciclo (fotografia del prefisso condiviso, una lettura per
 * opzione, normalizzazione per lunghezza) sta nel gateway: qui si manda una
 * richiesta e si riceve una distribuzione. */
export interface BrioChoice {
  option: string
  p: number
  logprob: number
  mean_logprob: number
  tokens: number
}

export interface BrioResponse {
  answer: string
  entropy: number
  normalize: "mean" | "sum"
  choices: BrioChoice[]
  usage: { prompt_tokens: number; completion_tokens: number; read_tokens: number; total_tokens: number }
}

export async function askBrio(
  baseUrl: string,
  apiKey: string,
  model: string,
  state: string,
  question: string,
  options: string[],
  signal?: AbortSignal,
): Promise<BrioResponse> {
  const response = await fetch(endpoint(baseUrl, "brio"), {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({ model, state, question, options }),
    signal,
  })
  if (!response.ok) await fail(response)
  return (await response.json()) as BrioResponse
}
