/* Agent stage (phase 3): the session card — sticky header
   with the project/session breadcrumb and run status, a transcript of
   user tasks and streamed run events, and an empty state that suggests
   first tasks. Tool cards come from the shared AgentEvents renderer. */

import { useEffect, useRef } from "react"
import { Check, Copy, LoaderCircle } from "lucide-react"

import { AgentEvents } from "@/components/AgentEvents"
import { AGENT_MODES, type AgentSession, type AgentTurn } from "@/lib/agent/sessions"

interface AgentStageProps {
  session: AgentSession | null
  running: boolean
  projectName: string | null
  copiedKey: string | null
  onCopy: (text: string, key: string) => void
  suggestions: string[]
  onSuggest: (text: string) => void
}

function modeLabel(turn: AgentTurn): string {
  return AGENT_MODES.find((item) => item.id === turn.mode)?.label ?? turn.mode
}

function statusOf(turn: AgentTurn | undefined): "idle" | "running" | "done" | "stopped" | "error" {
  if (!turn) return "idle"
  return turn.status
}

export function AgentStage(props: AgentStageProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const lastTurn = props.session?.turns[props.session.turns.length - 1]
  const status = statusOf(lastTurn)

  /* Follow the stream: a run appends events continuously, so keep the
     newest content in view while the user has not scrolled away. */
  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [props.session?.id, props.session?.turns.length, lastTurn?.events.length])

  const steps = lastTurn ? [...lastTurn.events].reverse().find((event) => event.type === "done") : null

  return (
    <section className="ag-stage" aria-label="Agent transcript">
      <header className="ag-stage-head">
        <div className="ag-crumb" title={props.session?.title}>
          <span className="ag-crumb-project">{props.projectName ?? "No folder"}</span>
          <span className="ag-crumb-sep" aria-hidden="true">/</span>
          <span className="ag-crumb-title">{props.session?.title ?? "New session"}</span>
        </div>
        <div className="ag-stage-status">
          {status === "running" ? (
            <span className="ag-status-pill running"><LoaderCircle size={12} className="spin" /> Running</span>
          ) : status === "done" ? (
            <span className="ag-status-pill done">
              <Check size={12} />
              {steps && steps.type === "done" ? `Done · ${steps.steps} step${steps.steps === 1 ? "" : "s"}` : "Done"}
            </span>
          ) : status === "stopped" ? (
            <span className="ag-status-pill stopped">Stopped</span>
          ) : status === "error" ? (
            <span className="ag-status-pill error">Error</span>
          ) : (
            <span className="ag-status-pill idle">Idle</span>
          )}
          <span className="ag-turn-count">{props.session?.turns.length ?? 0} turn{(props.session?.turns.length ?? 0) === 1 ? "" : "s"}</span>
        </div>
      </header>

      <div className="ag-timeline" ref={scrollRef} role="log" aria-label="Session messages">
        {!props.session || !props.session.turns.length ? (
          <div className="ag-empty">
            <img src="/syntara-logo.png" alt="" className="ag-empty-logo" />
            <span className="section-kicker">AGENT SESSION</span>
            <h2>Give the agent a task.</h2>
            <p>
              It plans, reads, edits and runs tools inside your project folder — every write and every
              process asks for permission first.
            </p>
            <div className="ag-suggests">
              {props.suggestions.map((text) => (
                <button key={text} type="button" onClick={() => props.onSuggest(text)}>
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          props.session.turns.map((turn) => (
            <div className="ag-turn" key={turn.id} data-status={turn.status}>
              <div className="ag-user">
                <div className="ag-user-bubble">{turn.task}</div>
                <div className="ag-user-meta">
                  <span>{modeLabel(turn)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(turn.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => props.onCopy(turn.task, `agt_${turn.id}`)}
                    title="Copy task"
                    aria-label="Copy task"
                  >
                    {props.copiedKey === `agt_${turn.id}` ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              <div className="ag-run" data-status={turn.status}>
                {turn.events.length ? (
                  <AgentEvents events={turn.events} />
                ) : turn.status === "running" ? (
                  <span className="typing" aria-label="Starting"><i /><i /><i /></span>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

/* Short hint line for the composer (mirrors the chat composer hint). */
export function agentHint(label: string, busy: boolean, tokensPerSec: number): string {
  if (busy) return `${label} mode · running…`
  const speed = tokensPerSec > 0 ? ` · ${tokensPerSec.toFixed(1)} tok/s` : ""
  return `${label} mode${speed}`
}
