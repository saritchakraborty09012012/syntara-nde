/* Agent-mode sessions sidebar (phase 3, redesign): a New session action, the
   project folder with its permission chips, then sessions grouped inside
   collapsible project-folder accordions (open/close per folder). Pure
   presentation — App owns session state, persistence and deletion. */

import { useEffect, useState } from "react"
import { ArrowUpRight, ChevronRight, FolderOpen, PanelLeft, Plus, Search, ShieldCheck, Trash2 } from "lucide-react"

import { filterSessions, groupSessionsByFolder, rankSessions, relativeLabel, type SessionManifestEntry } from "@/lib/agent/sessions"
import { openSitePage, SITE_DOWNLOAD_URL } from "@/lib/site"
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
  onCollapse?: () => void
  /* Model attached → typo/guess-tolerant ranking instead of strict AND. */
  smart?: boolean
}

export function AgentSessions(props: AgentSessionsProps) {
  const [query, setQuery] = useState("")
  /* Web build: folder picking is desktop-only, so the button explains that
     and links to the download page instead of sitting dead. */
  const [pickNudge, setPickNudge] = useState(false)
  useEffect(() => {
    if (!pickNudge || props.canPickFolder) return
    const timer = window.setTimeout(() => setPickNudge(false), 6000)
    return () => window.clearTimeout(timer)
  }, [pickNudge, props.canPickFolder])
  /* Open/close state per folder key ("" = No folder). The active session's
     folder starts open; others start closed until toggled. */
  const [openFolders, setOpenFolders] = useState<Set<string>>(() => new Set<string>())
  const matched = props.smart ? rankSessions(props.entries, query) : filterSessions(props.entries, query)
  const folders = groupSessionsByFolder(matched, props.activeId)
  const folderOpen = (key: string, hasActive: boolean) => openFolders.has(key) || hasActive
  const toggleFolder = (key: string) =>
    setOpenFolders((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  return (
    <aside className="ag-sessions" aria-label="Agent sessions">
      <div className="ag-sessions-head">
        <span className="ag-sessions-title">Sessions</span>
        <div className="ag-sessions-actions">
          {props.onCollapse ? (
            <button type="button" className="ag-icon-btn" onClick={props.onCollapse} title="Hide sessions" aria-label="Hide sessions" aria-expanded={true}>
              <PanelLeft size={14} />
            </button>
          ) : null}
          <button type="button" className="ag-icon-btn" onClick={props.onNew} title="New session" aria-label="New session">
            <Plus size={14} />
          </button>
        </div>
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
        <div className="pick-folder-wrap">
          <button
            type="button"
            className="ag-mini-btn wide"
            onClick={() => (props.canPickFolder ? props.onPickFolder() : setPickNudge((shown) => !shown))}
            title={props.canPickFolder ? undefined : "Folder picking is available inside the Syntara desktop app"}
          >
            <FolderOpen size={12} /> {props.projectPath ? "Change folder…" : "Choose folder…"}
          </button>
          {pickNudge && !props.canPickFolder ? (
            <div className="desktop-nudge" role="status">
              <p>Folder access lives in the Syntara desktop app.</p>
              <button type="button" className="nudge-cta" onClick={() => openSitePage(SITE_DOWNLOAD_URL)}>
                Download <ArrowUpRight size={12} aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
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
        {folders.length ? (
          folders.map((folder) => {
            const key = folder.folderId ?? ""
            const hasActive = folder.entries.some((entry) => entry.id === props.activeId)
            const open = folderOpen(key, hasActive)
            return (
              <div key={key || "no-folder"} className="ag-folder-group">
                <button
                  type="button"
                  className={cn("ag-folder-head", open && "open")}
                  onClick={() => toggleFolder(key)}
                  aria-expanded={open}
                  aria-label={`${open ? "Collapse" : "Expand"} folder: ${folder.label}`}
                >
                  <ChevronRight size={13} className="ag-folder-caret" aria-hidden="true" />
                  <FolderOpen size={13} />
                  <span className="ag-folder-label">{folder.label}</span>
                  <span className="ag-folder-count">{folder.entries.length}</span>
                </button>
                {open ? (
                  <div className="ag-folder-sessions">
                    {folder.entries.map((entry) => {
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
                ) : null}
              </div>
            )
          })
        ) : (
          <div className="empty-mini">
            {query.trim() ? "No sessions match your search." : "No sessions yet — press + to start one."}
          </div>
        )}
      </div>
    </aside>
  )
}
