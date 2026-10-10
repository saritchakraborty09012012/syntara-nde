/* web_fetch tool client (phase 4): the browser/Tauri side never fetches
   remote pages directly — it posts the URL to the local gateway's
   `POST /fetch`, which performs the request with a bounded timeout and
   size cap, converts HTML to text, and enforces its own origin + scheme
   checks. This module only validates the URL shape and maps the gateway
   reply to a ToolResult-friendly shape. */

import { headers, serverEndpoint } from "../api"

export interface WebFetchResult {
  ok: boolean
  status: number | null
  finalUrl: string | null
  contentType: string | null
  text: string
  truncated: boolean
  error: string | null
}

/* Pure URL gate shared by the executor and tests. Mirrors the gateway's
   policy: absolute http(s) only, no credentials in the URL. */
export function validateFetchUrl(raw: unknown): { ok: true; url: string } | { ok: false; reason: string } {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, reason: "missing 'url' argument" }
  }
  let parsed: URL
  try {
    parsed = new URL(raw.trim())
  } catch {
    return { ok: false, reason: "the URL could not be parsed — use an absolute http(s) URL" }
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: `unsupported URL scheme '${parsed.protocol}' — only http and https are allowed` }
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: "URLs with embedded credentials are not allowed" }
  }
  return { ok: true, url: parsed.toString() }
}

/* Preview URLs are loopback-only: the preview dock (and any Tauri preview
   window) may only ever point at a dev server on this machine. `0.0.0.0`
   and `[::1]` are normalised to what the iframe can actually load. */
export function validateLocalPreviewUrl(raw: unknown): { ok: true; url: string } | { ok: false; reason: string } {
  const base = validateFetchUrl(raw)
  if (!base.ok) return base
  const parsed = new URL(base.url)
  const host = parsed.hostname.replace(/^\[|\]$/g, "")
  const loopback = host === "127.0.0.1" || host === "localhost" || host === "::1" || host === "0.0.0.0"
  if (!loopback) {
    return { ok: false, reason: `preview only opens local servers — '${parsed.hostname}' is not a loopback address` }
  }
  if (host === "0.0.0.0") parsed.hostname = "127.0.0.1"
  return { ok: true, url: parsed.toString() }
}

interface FetchWireBody {
  ok?: unknown
  status?: unknown
  final_url?: unknown
  content_type?: unknown
  text?: unknown
  truncated?: unknown
  error?: unknown
}

export async function gatewayWebFetch(options: {
  baseUrl: string
  apiKey?: string
  url: string
  signal?: AbortSignal
}): Promise<WebFetchResult> {
  const response = await fetch(serverEndpoint(options.baseUrl, "fetch"), {
    method: "POST",
    headers: headers(options.apiKey),
    body: JSON.stringify({ url: options.url }),
    signal: options.signal,
  })

  let body: FetchWireBody | null = null
  try {
    body = (await response.json()) as FetchWireBody
  } catch {
    body = null
  }

  if (!response.ok) {
    const message =
      body && typeof body.error === "string" && body.error
        ? body.error
        : `${response.status} ${response.statusText} — the local gateway could not fetch the page`
    return { ok: false, status: response.status, finalUrl: null, contentType: null, text: "", truncated: false, error: message }
  }

  return {
    ok: body?.ok === true,
    status: typeof body?.status === "number" ? body.status : null,
    finalUrl: typeof body?.final_url === "string" ? body.final_url : null,
    contentType: typeof body?.content_type === "string" ? body.content_type : null,
    text: typeof body?.text === "string" ? body.text : "",
    truncated: body?.truncated === true,
    error: typeof body?.error === "string" && body.error ? body.error : null,
  }
}
