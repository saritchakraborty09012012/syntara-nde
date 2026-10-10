/* Event stream of one agent run (phase 4c): steps, assistant text, tool
   cards with outputs/diffs, permission decisions, repair and compaction
   notices, and honest end banners. Pure presentation — the loop appends
   AgentEvents, this component renders them. */

import {
  Activity,
  AlertTriangle,
  Check,
  CircleX,
  FileText,
  FolderOpen,
  Globe,
  Info,
  ListChecks,
  LoaderCircle,
  ShieldCheck,
  Terminal,
  Users,
} from "lucide-react"

import type { AgentEvent } from "@/lib/agent/loop"
import { diffLines, interruptedMessage, previewOutput, summarizeArgs } from "@/lib/agent/ui"
import { cn } from "@/lib/utils"

interface AgentEventsProps {
  events: AgentEvent[]
}

function toolIcon(name: string) {
  if (name === "proc_run") return Terminal
  if (name === "todo") return ListChecks
  if (name === "fs_list") return FolderOpen
  if (name === "web_fetch") return Globe
  if (name === "subagent") return Users
  return FileText
}

function renderToolBody(event: Extract<AgentEvent, { type: "tool_end" }>) {
  const data = event.data ?? {}
  /* fs_write cards show the diff we captured (before vs written text). */
  if (typeof data.before === "string" && typeof data.after === "string") {
    const lines = diffLines(data.before, data.after)
    return (
      <div className="tool-diff" role="figure" aria-label="File change preview">
        {lines.map((line, index) => (
          <div key={`${index}-${line.kind}`} className={cn("diff-line", line.kind)}>
            <span aria-hidden="true">{line.kind === "add" ? "+" : line.kind === "del" ? "-" : " "}</span>
            {line.text || " "}
          </div>
        ))}
      </div>
    )
  }
  return <pre className="tool-output">{previewOutput(event.output)}</pre>
}

export function AgentEvents({ events }: AgentEventsProps) {
  if (!events.length) return <div className="empty-mini">No agent runs yet.</div>

  const argsByCall = new Map<string, Record<string, unknown>>()
  const ended = new Set<string>()
  for (const event of events) {
    if (event.type === "tool_start") argsByCall.set(event.callId, event.args)
    if (event.type === "tool_end") ended.add(event.callId)
  }

  return (
    <div className="agent-events">
      {events.map((event, index) => {
        switch (event.type) {
          case "step":
            return (
              <div className="ev-step" key={index}>
                <Activity size={13} /> Step {event.step}
              </div>
            )
          case "assistant_text":
            return (
              <div className="ev-text" key={index}>
                {event.text}
              </div>
            )
          case "tool_start": {
            if (ended.has(event.callId)) return null
            const Icon = toolIcon(event.name)
            return (
              <div className="tool-card running" key={`${event.callId}-${index}`}>
                <div className="tool-card-head">
                  <Icon size={14} />
                  <code>{event.name}</code>
                  <span className="tool-args">{summarizeArgs(event.name, event.args)}</span>
                  <LoaderCircle size={14} className="spin" />
                </div>
              </div>
            )
          }
          case "permission":
            return (
              <div className="ev-permission" key={index}>
                <ShieldCheck size={13} /> {event.name}: {event.decision === "deny" ? "denied" : `allowed (${event.decision})`}
              </div>
            )
          case "tool_end": {
            const Icon = toolIcon(event.name)
            const args = argsByCall.get(event.callId) ?? {}
            return (
              <div className={cn("tool-card", event.ok ? "ok" : "fail")} key={`${event.callId}-${index}`}>
                <div className="tool-card-head">
                  <Icon size={14} />
                  <code>{event.name}</code>
                  <span className="tool-args">{summarizeArgs(event.name, args)}</span>
                  <span className="tool-status">
                    {event.ok ? <Check size={13} /> : <CircleX size={13} />}
                    {event.durationMs} ms
                  </span>
                </div>
                {renderToolBody(event)}
              </div>
            )
          }
          case "repair":
            return (
              <div className="ev-notice" key={index}>
                <Info size={13} /> Repaired a malformed tool call ({event.reason}).
              </div>
            )
          case "compacted":
            return (
              <div className="ev-notice" key={index}>
                <Info size={13} /> Compacted {event.dropped} older message(s) to fit the context window.
              </div>
            )
          case "done":
            return (
              <div className="ev-done" key={index}>
                <Check size={14} /> Finished in {event.steps} step{event.steps === 1 ? "" : "s"}.
                {event.text ? <div className="ev-text">{event.text}</div> : null}
              </div>
            )
          case "interrupted":
            return (
              <div className="ev-interrupted" key={index}>
                <AlertTriangle size={14} /> {interruptedMessage(event.reason)}
              </div>
            )
          case "error":
            return (
              <div className="ev-error" key={index}>
                <CircleX size={14} /> {event.message}
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
