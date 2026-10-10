/* Agent-mode sessions sidebar (phase 3), modelled on opencode's list:
   a New session action, the project folder with its permission chips, and
   sessions grouped by day with a status dot on the active one. Pure
   presentation — App owns session state, persistence and deletion. */

import { useState } from "react"
import { FolderOpen, Plus, Search, ShieldCheck, Trash2 } from "lucide-react"

import { filterSessions, groupSessions, relativeLabel, type SessionManifestEntry } from "@/lib/agent/sessions"
import { cn } from "@/lib/utils"

export interface SessionGrant {
  tool: string
  label: string
  granted: boolean
}

interface AgentSessionsProps {
  entries: SessionManifestEntry[]
  activeId: string | null
  running: boolean
  projectName: string | null
  projectPath: string | null
  toolsActive: boolean
  canPickFolder: boolean
  grants: SessionGrant[]
  onNew: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onPickFolder: () => void
  onRevoke: (tool: string) => void
}

export function AgentSessions(props: AgentSessionsProps) {
  const [query, setQuery] = useState("")
  const groups = groupSessions(filterSessions(props.entries, query))
  return (
    <aside className="ag-sessions" aria-label="Agent sessions">
      <div className="ag-sessions-head">
        <span className="ag-sessions-title">Sessions</span>
        <button type="button" className="ag-icon-btn" onClick={props.onNew} title="New session" aria-label="New session">
          <Plus size={14} />
        </button>
      </div>

      <div className="ag-search">
        <Search size={13} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search sessions…"
          aria-label="Search sessions"
        />
      </div>

      <div className="ag-project">
        <div className="ag-project-row">
          <FolderOpen size={13} />
          <span className="ag-project-name" title={props.projectPath ?? undefined}>
            {props.projectName ?? "No folder"}
          </span>
          <span className={cn("ag-tools-pill", props.toolsActive && "on")}>
            {props.toolsActive ? "tools active" : "planning only"}
          </span>
        </div>
        {props.projectPath ? <div className="ag-project-path" title={props.projectPath}>{props.projectPath}</div> : null}
        <button type="button" className="ag-mini-btn wide" onClick={props.onPickFolder} disabled={!props.canPickFolder}
          title={props.canPickFolder ? undefined : "Folder picking is available inside the Syntara desktop app"}>
          <FolderOpen size={12} /> {props.projectPath ? "Change folder…" : "Choose folder…"}
        </button>
        <div className="grant-row" aria-label="Tool permissions">
          {props.grants.map(({ tool, label, granted }) => (
            <span key={tool} className={cn("grant-chip", granted && "granted")}>
              <ShieldCheck size={11} /> {label}: {granted ? "always" : "asks"}
              {granted ? (
                <button type="button" className="chip-x" onClick={() => props.onRevoke(tool)} aria-label={`Revoke always-allow for ${label}`}>
                  ×
                </button>
              ) : null}
            </span>
          ))}
        </div>
      </div>

      <div className="ag-session-list">
        {groups.length ? (
          groups.map((group) => (
            <div key={group.label} className="ag-session-group">
              <div className="ag-session-group-label">{group.label}</div>
              {group.entries.map((entry) => {
                const isActive = entry.id === props.activeId
                return (
                  <div key={entry.id} className={cn("ag-session-row", isActive && "active")}>
                    <button type="button" className="ag-session-main" onClick={() => props.onSelect(entry.id)}>
                      <span
                        className={cn("ag-session-dot", isActive && props.running && "busy")}
                        aria-hidden="true"
                      />
                      <span className="ag-session-name">{entry.title}</span>
                      <span className="ag-session-time">{relativeLabel(entry.updatedAt)}</span>
                    </button>
                    <button
                      type="button"
                      className="ag-session-del"
                      onClick={() => props.onDelete(entry.id)}
                      aria-label={`Delete session: ${entry.title}`}
                      title="Delete session"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          ))
        ) : (
          <div className="empty-mini">
            {query.trim() ? "No sessions match your search." : "No sessions yet — press + to start one."}
          </div>
        )}
      </div>
    </aside>
  )
}
