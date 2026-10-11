import { useCallback, useEffect, useRef, useState } from "react"
import { PageHeader, PageSection, PageShell } from "./PageShell"
import { Container } from "../ui"

/* The browser page talks directly to the user's local Syntara gateway - no
   Syntara server sits in between, so nothing the user types reaches this
   site. The gateway only answers its configured origins (loopback dev
   servers, the desktop shell and this site's deployed origin) and only on
   the user's own machine. */

const DEFAULT_BASE = "http://127.0.0.1:8000"

type ChatMessage = { role: "user" | "assistant"; content: string }

type Phase = "idle" | "connecting" | "ready" | "generating"

const REACH_HELP =
  "Open the Syntara desktop app, enable the local API server (Settings → API), " +
  "then connect again. The gateway listens on localhost only — nothing leaves your machine."

function describeConnectFailure(base: string, reason: unknown): string {
  if (reason instanceof DOMException && reason.name === "AbortError") return "Connection attempt cancelled."
  if (reason instanceof Error && /failed to fetch|networkerror|load failed/i.test(reason.message)) {
    return `Could not reach a Syntara gateway at ${base}. ${REACH_HELP}`
  }
  if (reason instanceof Error && reason.message.includes("mixed content")) {
    return `This https page cannot call a plain-http address (${base}). ` +
      `Loopback addresses are normally exempt, but if your browser still blocks it, ` +
      `use the playground inside the desktop app instead.`
  }
  return `Could not reach a Syntara gateway at ${base}. ${REACH_HELP}`
}

function describeHttpFailure(status: number, body: string): string {
  let detail = ""
  try {
    const parsed = JSON.parse(body)
    detail = parsed?.error?.message || parsed?.error?.code || ""
  } catch {
    /* non-JSON error body; the status line below carries the meaning */
  }
  if (status === 401) return `The gateway requires an API key (401). ${detail || "Set or clear the key in Settings → API and retry."}`
  if (status === 404) return `That address answered, but it is not a Syntara gateway (no /v1/models). ${detail}`.trim()
  if (status === 403) return `The gateway refused this page's origin (403). ${detail || "Only origins listed in the gateway's CORS grants may connect."}`
  if (status === 503) return `The gateway is up but not ready yet (503). ${detail || "A model is still loading — retry in a moment."}`
  return `Gateway error ${status}.${detail ? ` ${detail}` : ""}`
}

const NOTE_CARDS: Array<{ title: string; body: string }> = [
  {
    title: "Where your prompts go",
    body: "Straight from this tab to the gateway on your machine. This site never relays, stores or logs what you type — there is no Syntara server in between.",
  },
  {
    title: "First-connect permission",
    body: "A page served over https that reaches a local address triggers a browser private-network preflight. Approve it once; the gateway only grants it to origins it explicitly allows.",
  },
  {
    title: "Requirements",
    body: "The Syntara desktop app with the local API server enabled (default http://127.0.0.1:8000) and a loaded model. The gateway binds to localhost — it is never exposed to your network unless you change that yourself.",
  },
]

export function PlaygroundPage() {
  const [base, setBase] = useState(DEFAULT_BASE)
  const [phase, setPhase] = useState<Phase>("idle")
  const [error, setError] = useState<string | null>(null)
  const [models, setModels] = useState<string[]>([])
  const [model, setModel] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const abortRef = useRef<AbortController | null>(null)
  const logRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages])

  const connect = useCallback(async () => {
    const target = base.trim().replace(/\/+$/, "")
    const controller = new AbortController()
    abortRef.current = controller
    setPhase("connecting")
    setError(null)
    try {
      const res = await fetch(`${target}/v1/models`, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      })
      if (!res.ok) {
        setError(describeHttpFailure(res.status, await res.text()))
        setPhase("idle")
        return
      }
      const body = (await res.json()) as { data?: Array<{ id?: string }> }
      const ids = (body.data ?? []).map((entry) => entry.id || "").filter(Boolean)
      if (!ids.length) {
        setError("The gateway is up but has no model loaded. Load a model in the desktop app, then connect again.")
        setPhase("idle")
        return
      }
      setModels(ids)
      setModel((current) => (current && ids.includes(current) ? current : ids[0]))
      setPhase("ready")
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") setError(null)
      else setError(describeConnectFailure(target, reason))
      setPhase("idle")
    } finally {
      if (abortRef.current === controller) abortRef.current = null
    }
  }, [base])

  const disconnect = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setPhase("idle")
    setModels([])
    setError(null)
  }, [])

  const send = useCallback(async () => {
    const text = draft.trim()
    if (!text || phase !== "ready") return
    const history: ChatMessage[] = [...messages, { role: "user", content: text }]
    setMessages([...history, { role: "assistant", content: "" }])
    setDraft("")
    setPhase("generating")
    setError(null)

    /* An error before the first token must not leave an empty "model ›" row
       behind; once text has arrived the partial answer stays on screen. */
    const settle = (received: () => boolean) =>
      setMessages((current) =>
        current.length === history.length + 1 && !current[current.length - 1].content && !received()
          ? history
          : current,
      )

    const controller = new AbortController()
    abortRef.current = controller
    const target = base.trim().replace(/\/+$/, "")
    let answer = ""

    try {
      const res = await fetch(`${target}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: history, stream: true }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        setError(describeHttpFailure(res.status, await res.text()))
        settle(() => false)
        setPhase("ready")
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let finished = false

      const absorb = (line: string) => {
        const payload = line.startsWith("data:") ? line.slice(5).trim() : line.trim()
        if (!payload) return false
        if (payload === "[DONE]") return true
        try {
          const chunk = JSON.parse(payload)
          const delta = chunk?.choices?.[0]?.delta?.content
          if (typeof delta === "string" && delta) {
            answer += delta
            setMessages([...history, { role: "assistant", content: answer }])
          }
        } catch {
          /* keep partial frames flowing; a malformed frame is not fatal */
        }
        return false
      }

      while (!finished) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""
        for (const line of lines) {
          if (absorb(line)) {
            finished = true
            break
          }
        }
      }
      if (!answer) {
        settle(() => false)
        setError("The stream ended without any text. Check the desktop app's runtime log for the underlying error.")
      }
    } catch (reason) {
      settle(() => answer.length > 0)
      if (reason instanceof DOMException && reason.name === "AbortError") {
        setError("Generation stopped.")
      } else if (reason instanceof Error && /failed to fetch|networkerror|load failed/i.test(reason.message)) {
        setError(`Lost the connection to ${target} mid-stream. ${REACH_HELP}`)
      } else {
        setError(reason instanceof Error ? reason.message : String(reason))
      }
    } finally {
      abortRef.current = null
      setPhase((current) => (current === "generating" ? "ready" : current))
    }
  }, [base, draft, messages, model, phase])

  return (
    <PageShell>
      <PageHeader
        kicker="Playground"
        title="Chat with the model on your machine."
        intro="A minimal OpenAI-compatible client for your local Syntara gateway. Pick an address, connect, and stream a conversation — your prompts travel from this tab straight to your own hardware and nowhere else."
        meta="Local gateway · Loopback only · No account · No relay"
      />

      <PageSection>
        <div className="hud-card cut p-5 md:p-6">
          {/* connection bar */}
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex-1 basis-64">
              <span className="kicker">Gateway address</span>
              <input
                value={base}
                onChange={(event) => setBase(event.target.value)}
                spellCheck={false}
                disabled={phase !== "idle"}
                aria-label="Local gateway base URL"
                className="mt-2 w-full rounded-none border border-line bg-black/30 px-3 py-2.5 font-mono text-[13px] text-ink outline-none focus:border-cyan/60 disabled:opacity-60"
              />
            </label>
            {phase === "idle" ? (
              <button type="button" className="hud-btn hud-btn-primary cut-sm" onClick={() => void connect()}>
                Connect
              </button>
            ) : (
              <button type="button" className="hud-btn hud-btn-ghost cut-sm" onClick={disconnect}>
                {phase === "connecting" ? "Cancel" : "Disconnect"}
              </button>
            )}
            {models.length > 1 && phase !== "idle" ? (
              <label>
                <span className="kicker">Model</span>
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  aria-label="Model"
                  className="mt-2 block border border-line bg-black/30 px-3 py-2.5 font-mono text-[13px] text-ink outline-none focus:border-cyan/60"
                >
                  {models.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <span
              className={`font-mono text-[11px] tracking-[0.2em] uppercase ${
                phase === "ready" || phase === "generating" ? "text-cyan" : "text-muted"
              }`}
              role="status"
            >
              {phase === "idle" && (error ? "offline" : "not connected")}
              {phase === "connecting" && "connecting…"}
              {phase === "ready" && `connected · ${model}`}
              {phase === "generating" && "generating…"}
            </span>
          </div>

          {phase === "ready" && models.length === 1 && (
            <p className="mt-2 font-mono text-[12px] text-muted">model: {model}</p>
          )}

          {error && (
            <p
              className="mt-4 border border-[rgba(255,99,111,0.35)] bg-[rgba(255,99,111,0.08)] px-3 py-2.5 text-[13px] leading-relaxed text-[rgb(255_160_170)]"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* conversation log */}
          <div
            ref={logRef}
            className="mt-5 h-[min(46vh,420px)] overflow-y-auto border border-line bg-black/25 p-4 font-mono text-[13px] leading-relaxed"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <p className="text-muted">
                {phase === "ready"
                  ? "Connected. Send a message — the reply streams from your local model."
                  : "Connect to your local gateway to start. Nothing you type here is sent anywhere except your own machine."}
              </p>
            ) : (
              <div className="grid gap-3">
                {messages.map((entry, index) => (
                  <p key={`${entry.role}-${index}`} className="whitespace-pre-wrap">
                    <span className={entry.role === "user" ? "text-cyan" : "text-[rgb(167_255_120)]"}>
                      {entry.role === "user" ? "you › " : "model › "}
                    </span>
                    <span className="text-ink">
                      {entry.content || (phase === "generating" && index === messages.length - 1 ? "…" : "")}
                    </span>
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* composer */}
          <form
            className="mt-4 flex flex-wrap gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              void send()
            }}
          >
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  void send()
                }
              }}
              rows={2}
              placeholder={phase === "ready" ? "Ask your local model…" : "Connect to the gateway first…"}
              aria-label="Message"
              className="min-h-14 flex-1 basis-64 resize-y border border-line bg-black/30 px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-muted focus:border-cyan/60"
            />
            {phase === "generating" ? (
              <button
                type="button"
                className="hud-btn hud-btn-ghost cut-sm"
                onClick={() => abortRef.current?.abort()}
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                className="hud-btn hud-btn-primary cut-sm"
                disabled={phase !== "ready" || !draft.trim()}
                style={phase !== "ready" || !draft.trim() ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              >
                Send
              </button>
            )}
          </form>
        </div>
      </PageSection>

      <PageSection>
        <div className="grid gap-4 md:grid-cols-3">
          {NOTE_CARDS.map((card) => (
            <article key={card.title} className="hud-card cut p-6">
              <h2 className="font-display text-[14px] font-bold tracking-[0.12em] text-ink uppercase">
                {card.title}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">{card.body}</p>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <Container>
          <div className="flex flex-wrap gap-3">
            <a className="hud-btn hud-btn-primary cut-sm" href="./#download">
              Get Syntara
            </a>
            <a className="hud-btn hud-btn-ghost cut-sm" href="./faq.html">
              API &amp; integration FAQ
            </a>
            <a
              className="hud-btn hud-btn-ghost cut-sm"
              href="https://github.com/saritchakraborty09012012/syntara-nde"
              target="_blank"
              rel="noreferrer"
            >
              Source code ↗
            </a>
          </div>
        </Container>
      </PageSection>
    </PageShell>
  )
}
