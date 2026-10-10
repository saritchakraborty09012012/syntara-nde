/* FolderBar (phase 3): sits under the agent composer — the list of added
   project folders, a project file search (desktop shell only) and the
   new-project folder picker. Pure presentation; App owns projects state. */

import { useEffect, useRef, useState } from "react"
import { FolderOpen, FolderPlus, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

export interface FolderBarProject {
  id: string
  name: string
}

interface AgentFolderBarProps {
  projects: FolderBarProject[]
  activeId: string | null
  onSelect: (id: string) => void
  onNewProject: () => void
  canPickFolder: boolean
  /* Present only where the desktop fs tools exist. */
  onSearch?: (query: string) => Promise<string[]>
  /* A clicked search result is appended to the task draft. */
  onPickResult: (path: string) => void
}

export function AgentFolderBar(props: AgentFolderBarProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<string[]>([])
  const [searching, setSearching] = useState(false)
  const abortRef = useRef(0)

  /* Debounced search: every keystroke bumps a token; only the last
     request may commit its results. */
  useEffect(() => {
    const term = query.trim()
    if (!props.onSearch || term.length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    const token = ++abortRef.current
    setSearching(true)
    const id = window.setTimeout(() => {
      void props
        .onSearch?.(term)
        .then((matches) => {
          if (abortRef.current === token) setResults(matches)
        })
        .catch(() => {
          if (abortRef.current === token) setResults([])
        })
        .finally(() => {
          if (abortRef.current === token) setSearching(false)
        })
    }, 220)
    return () => window.clearTimeout(id)
  }, [query, props.onSearch])

  return (
    <div className="ag-folderbar" aria-label="Projects">
      <div className="ag-folder-projects">
        <span className="ag-folder-label">Projects</span>
        {props.projects.map((project) => (
          <button
            key={project.id}
            type="button"
            className={cn("ag-folder-chip", project.id === props.activeId && "active")}
            onClick={() => props.onSelect(project.id)}
            title={`Switch to project ${project.name}`}
          >
            <FolderOpen size={12} />
            <span>{project.name}</span>
          </button>
        ))}
        {!props.projects.length ? <span className="ag-folder-empty">No folders yet</span> : null}
        <button
          type="button"
          className="ag-folder-chip new"
          onClick={props.onNewProject}
          disabled={!props.canPickFolder}
          title={props.canPickFolder ? "Add a project folder" : "Folder picking is available inside the Syntara desktop app"}
        >
          <FolderPlus size={12} />
          <span>New project</span>
        </button>
      </div>

      {props.onSearch ? (
        <div className="ag-folder-search">
          <div className="ag-search">
            <Search size={13} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search files…"
              aria-label="Search project files"
            />
            {query ? (
              <button type="button" className="ag-search-clear" onClick={() => setQuery("")} aria-label="Clear file search">
                <X size={12} />
              </button>
            ) : null}
          </div>
          {results.length || searching ? (
            <div className="ag-folder-results" role="listbox" aria-label="File search results">
              {searching && !results.length ? <div className="empty-mini">Searching…</div> : null}
              {results.map((path) => (
                <button
                  key={path}
                  type="button"
                  role="option"
                  onClick={() => {
                    props.onPickResult(path)
                    setQuery("")
                    setResults([])
                  }}
                >
                  {path}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
