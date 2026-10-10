/* Right-hand docks for agent mode (phase 3 + 4): priority panels pinned
   above the progress panel — permission request, plan review, question —
   then live run progress (status, elapsed, commands, sub-agents, todo,
   last-run summary) and the local preview. Pure presentation: App owns
   every piece of state these panels read and mutate. */

import { useEffect, useMemo, useState } from "react"
import {
  Check,
  ClipboardList,
  Copy,
  Eye,
  HelpCircle,
  ListChecks,
  LoaderCircle,
  Pencil,
  RefreshCw,
  ShieldAlert,
  Terminal,
  Timer,
  Users,
  X,
} from "lucide-react"

import type { AgentEvent } from "@/lib/agent/loop"
import type { PermissionDecision } from "@/lib/agent/permissions"
import { summarizeArgs } from "@/lib/agent/ui"
import { cn } from "@/lib/utils"

export interface LastRunSummary {
  status: "done" | "stopped" | "error"
  steps: number
  text: string | null
}

export interface PermissionPrompt {
  tool: string
  args: Record<string, unknown>
}

export interface QuestionPrompt {
  text: string
  options: string[]
}

export interface PlanDraft {
  text: string
}

interface AgentDocksProps {
  todo: string[]
  running: boolean
  /* createdAt of the running turn — drives the elapsed counter. */
  startedAt: number | null
  /* Events of the newest turn: status, commands and sub-agents derive
     from them live while the run streams. */
  events: AgentEvent[]
  lastRun: LastRunSummary | null
  permission: PermissionPrompt | null
  permissionNote: string
  onSettlePermission: (decision: PermissionDecision) => void
  question: QuestionPrompt | null
  onAnswerQuestion: (answer: string) => void
  plan: PlanDraft | null
  onPlanText: (text: string) => void
  onApprovePlan: () => void
  onDismissPlan: () => void
  previewUrl: string | null
  previewNonce: number
  onClosePreview: () => void
  onReloadPreview: () => void
  copiedKey: string | null
  onCopy: (text: string, key: string) => void
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

interface CommandRow {
  label: string
  ok: boolean | null
  durationMs: number
}

/* Live terminal commands: proc_run/git starts become rows immediately and
   settle when the matching tool_end arrives. */
function commandRows(events: AgentEvent[]): CommandRow[] {
  const pending = new Map<string, CommandRow>()
  const rows: CommandRow[] = []
  for (const event of events) {
    if (event.type === "tool_start" && (event.name === "proc_run" || event.name === "git")) {
      const argv = Array.isArray(event.args.argv)
        ? (event.args.argv as string[]).join(" ")
        : Array.isArray(event.args.args)
          ? `git ${(event.args.args as string[]).join(" ")}`
          : event.name
      const row: CommandRow = { label: argv, ok: null, durationMs: 0 }
      pending.set(event.callId, row)
      rows.push(row)
    }
    if (event.type === "tool_end" && pending.has(event.callId)) {
      const row = pending.get(event.callId) as CommandRow
      row.ok = event.ok
      row.durationMs = event.durationMs
    }
  }
  return rows
}

interface SubagentRow {
  task: string
  ok: boolean | null
}

function subagentRows(events: AgentEvent[]): SubagentRow[] {
  const rows: SubagentRow[] = []
  for (const event of events) {
    if (event.type === "subagent_start") rows.push({ task: event.task, ok: null })
    if (event.type === "subagent_end") {
      const open = rows.find((row) => row.ok === null)
      if (open) {
        open.ok = event.ok
      } else {
        rows.push({ task: event.summary.slice(0, 80), ok: event.ok })
      }
    }
  }
  return rows
}

export function AgentDocks(props: AgentDocksProps) {
  const [now, setNow] = useState(() => Date.now())
  const [planEditing, setPlanEditing] = useState(false)
  const [answer, setAnswer] = useState("")

  /* One shared ticker while a run is active: drives elapsed + the pending
     command durations without a timer per panel. */
  useEffect(() => {
    if (!props.running) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [props.running])

  const commands = useMemo(() => commandRows(props.events), [props.events])
  const subagents = useMemo(() => subagentRows(props.events), [props.events])
  const runningTool = useMemo(() => {
    const started = new Set<string>()
    for (const event of props.events) {
      if (event.type === "tool_start") started.add(event.callId)
      if (event.type === "tool_end") started.delete(event.callId)
    }
    return started.size > 0
  }, [props.events])

  const elapsed = props.running && props.startedAt ? Math.max(0, now - props.startedAt) : null
  const lastRun = props.lastRun
  const lastRunCopyKey = lastRun ? `run_${lastRun.status}_${lastRun.steps}` : null
  const planSteps = (props.plan?.text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const statusText = props.running
    ? runningTool
      ? "Executing tools…"
      : "Thinking…"
    : null

  return (
    <div className="ag-docks">
      {props.permission ? (
        <section className="ag-panel ag-panel-pinned permission-dock" role="alertdialog" aria-label="Tool permission request">
          <div className="ag-panel-head">
            <ShieldAlert size={13} />
            <span>Permission</span>
            <LoaderCircle size={12} className="spin" />
          </div>
          <div className="ag-panel-body">
            <div className="ag-permission">
              <strong>
                Allow <code>{props.permission.tool}</code>?
              </strong>
              <p className="panel-note permission-args">{summarizeArgs(props.permission.tool, props.permission.args)}</p>
              <p className="panel-note">{props.permissionNote}</p>
              <div className="ag-dock-actions">
                <button type="button" className="ghost-btn" onClick={() => props.onSettlePermission("deny")}>
                  Deny
                </button>
                <button type="button" className="ghost-btn" onClick={() => props.onSettlePermission("once")}>
                  Allow once
                </button>
                <button type="button" className="primary-btn" onClick={() => props.onSettlePermission("always")}>
                  Always allow
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {props.question ? (
        <section className="ag-panel ag-panel-pinned question-dock" aria-label="Agent question">
          <div className="ag-panel-head">
            <HelpCircle size={13} />
            <span>Question</span>
            <LoaderCircle size={12} className="spin" />
          </div>
          <div className="ag-panel-body">
            <p className="ag-question-text">{props.question.text}</p>
            {props.question.options.length ? (
              <div className="ag-question-options">
                {props.question.options.map((option) => (
                  <button key={option} type="button" className="ag-mini-btn" onClick={() => props.onAnswerQuestion(option)}>
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="ag-question-answer">
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Type your answer…"
                aria-label="Answer"
                rows={2}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    if (answer.trim()) {
                      props.onAnswerQuestion(answer)
                      setAnswer("")
                    }
                  }
                }}
              />
              <button
                type="button"
                className="primary-btn"
                disabled={!answer.trim()}
                onClick={() => {
                  props.onAnswerQuestion(answer)
                  setAnswer("")
                }}
              >
                Answer
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {props.plan ? (
        <section className="ag-panel ag-panel-pinned plan-dock" aria-label="Plan review">
          <div className="ag-panel-head">
            <ClipboardList size={13} />
            <span>Plan</span>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setPlanEditing((value) => !value)}
              title={planEditing ? "Done editing" : "Edit plan"}
              aria-label={planEditing ? "Done editing plan" : "Edit plan"}
            >
              {planEditing ? <Check size={12} /> : <Pencil size={12} />}
            </button>
          </div>
          <div className="ag-panel-body">
            {planEditing ? (
              <textarea
                className="ag-plan-edit"
                value={props.plan.text}
                onChange={(event) => props.onPlanText(event.target.value)}
                aria-label="Plan text"
                rows={Math.min(12, planSteps.length + 2)}
              />
            ) : (
              <ol className="ag-plan-list">
                {planSteps.map((step, index) => (
                  <li key={`${index}-${step}`}>{step}</li>
                ))}
              </ol>
            )}
            <div className="ag-dock-actions">
              <button type="button" className="ghost-btn" onClick={props.onDismissPlan}>
                Dismiss
              </button>
              <button type="button" className="primary-btn" onClick={props.onApprovePlan}>
                Approve &amp; run
              </button>
            </div>
            <p className="panel-note">Review and edit the steps — approving switches to Build mode and runs the plan.</p>
          </div>
        </section>
      ) : null}

      <section className="ag-panel" aria-label="Progress">
        <div className="ag-panel-head">
          <ListChecks size={13} />
          <span>Progress</span>
          {props.running ? <LoaderCircle size={12} className="spin" /> : null}
          {elapsed !== null ? (
            <span className="ag-elapsed" title="Run elapsed time">
              <Timer size={11} /> {formatElapsed(elapsed)}
            </span>
          ) : null}
        </div>
        <div className="ag-panel-body">
          {statusText ? (
            <div className="ag-status-line" role="status">
              <span className="typing" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {statusText}
            </div>
          ) : null}

          {commands.length ? (
            <div className="ag-commands" aria-label="Terminal commands">
              <div className="ag-subhead">
                <Terminal size={12} /> Commands
              </div>
              {commands.map((row, index) => (
                <div key={`${index}-${row.label}`} className={cn("ag-command", row.ok === true && "ok", row.ok === false && "fail")}>
                  <span className="ag-command-prompt" aria-hidden="true">
                    $
                  </span>
                  <code>{row.label}</code>
                  <span className="ag-command-state">
                    {row.ok === null ? <LoaderCircle size={11} className="spin" /> : row.ok ? <Check size={11} /> : <X size={11} />}
                    {row.ok !== null && row.durationMs ? <span>{row.durationMs} ms</span> : null}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {subagents.length ? (
            <div className="ag-subagents" aria-label="Sub-agents">
              <div className="ag-subhead">
                <Users size={12} /> Sub-agents
              </div>
              {subagents.map((row, index) => (
                <div key={`${index}-${row.task}`} className={cn("ag-subagent", row.ok === true && "ok", row.ok === false && "fail")}>
                  <span title={row.task}>{row.task}</span>
                  {row.ok === null ? <LoaderCircle size={11} className="spin" /> : row.ok ? <Check size={11} /> : <X size={11} />}
                </div>
              ))}
            </div>
          ) : null}

          {lastRun ? (
            <div className={cn("ag-last-run", lastRun.status)} role="status">
              <div className="ag-last-run-head">
                <Check size={12} />
                <span>
                  {lastRun.status === "done"
                    ? `Completed in ${lastRun.steps} step${lastRun.steps === 1 ? "" : "s"}`
                    : lastRun.status === "stopped"
                      ? "Stopped before finishing"
                      : "Run failed"}
                </span>
                {lastRun.text && lastRunCopyKey ? (
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => props.onCopy(lastRun.text as string, lastRunCopyKey)}
                    title="Copy final answer"
                    aria-label="Copy final answer"
                  >
                    {props.copiedKey === lastRunCopyKey ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                ) : null}
              </div>
              {lastRun.text ? <p className="ag-last-run-text">{lastRun.text}</p> : null}
            </div>
          ) : null}

          {props.todo.length ? (
            <ol className="todo-list">
              {props.todo.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
              ))}
            </ol>
          ) : (
            <div className="empty-mini">
              {props.running
                ? "The agent can create a todo list with the todo tool."
                : "No todo list yet — it appears when the agent plans its work."}
            </div>
          )}
        </div>
      </section>

      <section className="ag-panel ag-preview" aria-label="Preview">
        <div className="ag-panel-head">
          <Eye size={13} />
          <span>Preview</span>
          {props.previewUrl ? (
            <span className="ag-panel-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={props.onReloadPreview}
                title="Reload preview"
                aria-label="Reload preview"
              >
                <RefreshCw size={12} />
              </button>
              <button type="button" className="icon-btn" onClick={props.onClosePreview} aria-label="Close preview">
                <X size={12} />
              </button>
            </span>
          ) : null}
        </div>
        <div className="ag-panel-body">
          {props.previewUrl ? (
            <iframe
              key={props.previewNonce}
              className="ag-preview-frame"
              src={props.previewUrl}
              title="Local dev preview"
              sandbox="allow-scripts allow-forms allow-same-origin"
            />
          ) : (
            <div className="empty-mini ag-preview-empty">
              When a run starts a local dev server (for example <code>npm run dev</code>), its page
              opens here. Everything stays on this machine.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
