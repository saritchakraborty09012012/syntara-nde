/* Event stream of one agent run (phase 4c): steps, assistant text, tool
   cards with outputs/diffs, permission decisions, repair and compaction
   notices, and honest end banners. Pure presentation — the loop appends
   AgentEvents, this component renders them. */

import {
  Activity,
  AlertTriangle,
  Check,
  ClipboardList,
  CircleX,
  FileText,
  FolderOpen,
  GitBranch,
  Globe,
  HelpCircle,
  Info,
  ListChecks,
  LoaderCircle,
  Monitor,
  ScrollText,
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
  if (name === "git") return GitBranch
  if (name === "console_read") return ScrollText
  if (name === "preview_open" || name === "preview_reload") return Monitor
  if (name === "ask_user" || name === "submit_plan") return HelpCircle
  return FileText
}

/* These two render as the richer plan/question cards instead of tool
   cards, so their tool_start/tool_end rows are suppressed here. */
const CARD_SUPPRESSED = new Set(["ask_user", "submit_plan"])

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
  /* ask_user answers travel back as tool results; pair them with the
     question card so one card shows the whole exchange. */
  const answersByQuestion = new Map<string, string>()
  for (const event of events) {
    if (event.type === "tool_start") argsByCall.set(event.callId, event.args)
    if (event.type === "tool_end") ended.add(event.callId)
    if (event.type === "tool_end" && event.name === "ask_user" && typeof event.data?.question === "string" && typeof event.data?.answer === "string") {
      answersByQuestion.set(event.data.question, event.data.answer)
    }
  }

  return (
    <div className="agent-events">
      {events.map((event, index) => {
        switch (event.type) {
          case "step":
            return (
              <div className="ev-step" key={index}>
                <Activity size={13} /> Step {event.step}
                {typeof event.elapsedMs === "number" ? <span className="ev-step-time">· {(event.elapsedMs / 1000).toFixed(1)}s</span> : null}
              </div>
            )
          case "assistant_text":
            return (
              <div className="ev-text" key={index}>
                {event.text}
              </div>
            )
          case "plan":
            return (
              <div className="ev-plan" key={index}>
                <div className="ev-plan-head">
                  <ClipboardList size={13} /> Plan proposed
                </div>
                <ol>
                  {event.items.map((item, itemIndex) => (
                    <li key={`${itemIndex}-${item}`}>{item}</li>
                  ))}
                </ol>
              </div>
            )
          case "question": {
            const answer = answersByQuestion.get(event.text)
            return (
              <div className="ev-question" key={index}>
                <div className="ev-question-head">
                  <HelpCircle size={13} /> Asked you
                </div>
                <p>{event.text}</p>
                {event.options?.length ? <div className="ev-question-options">{event.options.map((option) => <span key={option}>{option}</span>)}</div> : null}
                {answer ? <div className="ev-question-answer">You: {answer}</div> : null}
              </div>
            )
          }
          case "subagent_start":
            return (
              <div className="ev-subagent running" key={index}>
                <Users size={13} /> Sub-agent started: <span>{event.task}</span>
              </div>
            )
          case "subagent_end":
            return (
              <div className={cn("ev-subagent", event.ok ? "ok" : "fail")} key={index}>
                <Users size={13} /> Sub-agent {event.ok ? "reported" : "stopped"}: <span>{event.summary}</span>
              </div>
            )
          case "tool_start": {
            if (ended.has(event.callId) || CARD_SUPPRESSED.has(event.name)) return null
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
            if (CARD_SUPPRESSED.has(event.name)) return null
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
