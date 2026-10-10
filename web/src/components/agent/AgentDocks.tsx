/* Right-hand docks for agent mode (phase 3): a progress panel (todo list +
   last-run summary) stacked over a live preview panel — the right column. The preview stays an honest empty state until a run exposes
   a URL (phase 4 wires preview targets). */

import { Check, Copy, Eye, ListChecks, LoaderCircle, X } from "lucide-react"

import { cn } from "@/lib/utils"

export interface LastRunSummary {
  status: "done" | "stopped" | "error"
  steps: number
  text: string | null
}

interface AgentDocksProps {
  todo: string[]
  running: boolean
  lastRun: LastRunSummary | null
  previewUrl: string | null
  onClosePreview: () => void
  copiedKey: string | null
  onCopy: (text: string, key: string) => void
}

export function AgentDocks(props: AgentDocksProps) {
  const doneCount = props.todo.length
  const lastRun = props.lastRun
  const lastRunCopyKey = lastRun ? `run_${lastRun.status}_${lastRun.steps}` : null
  return (
    <div className="ag-docks">
      <section className="ag-panel" aria-label="Progress">
        <div className="ag-panel-head">
          <ListChecks size={13} />
          <span>Progress</span>
          {props.running ? <LoaderCircle size={12} className="spin" /> : null}
          {doneCount ? <span className="ag-panel-count">{doneCount} item{doneCount === 1 ? "" : "s"}</span> : null}
        </div>
        <div className="ag-panel-body">
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
            <button type="button" className="icon-btn" onClick={props.onClosePreview} aria-label="Close preview">
              <X size={12} />
            </button>
          ) : null}
        </div>
        <div className="ag-panel-body">
          {props.previewUrl ? (
            <iframe className="ag-preview-frame" src={props.previewUrl} title="Local dev preview" sandbox="allow-scripts allow-forms allow-same-origin" />
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
