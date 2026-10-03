/* Bridge to the desktop shell's agent tool commands (track 4b).

   Inside the Tauri shell these invoke Rust commands in
   `desktop/src-tauri/src/agent_tools.rs`; every filesystem path is scoped
   there to the project root the caller passes. In a plain `syntara web`
   session `agentToolsAvailable()` is false and the agent loop reports an
   honest `tools_not_bound` interruption instead of pretending to act. */

import { invoke } from "@tauri-apps/api/core"

export interface FileReadResult {
  path: string
  content: string
  size: number
  truncated: boolean
}

export interface DirEntryInfo {
  name: string
  kind: "dir" | "file" | "symlink" | "other"
  size: number | null
}

export interface DirListResult {
  path: string
  entries: DirEntryInfo[]
  truncated: boolean
}

export interface FileWriteResult {
  path: string
  bytes: number
}

export interface ProcRunResult {
  exitCode: number | null
  stdout: string
  stderr: string
  timedOut: boolean
  truncated: boolean
  durationMs: number
}

/** True inside the desktop shell (same probe the download bridge uses). */
export function agentToolsAvailable(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
}

export const agentFsRead = (root: string, path: string): Promise<FileReadResult> =>
  invoke<FileReadResult>("fs_read", { root, path })

export const agentFsList = (root: string, path?: string): Promise<DirListResult> =>
  invoke<DirListResult>("fs_list", { root, path: path ?? null })

export const agentFsWrite = (root: string, path: string, content: string): Promise<FileWriteResult> =>
  invoke<FileWriteResult>("fs_write", { root, path, content })

/** argv array only — the Rust side never involves a shell. */
export const agentProcRun = (root: string, argv: string[], timeoutS?: number): Promise<ProcRunResult> =>
  invoke<ProcRunResult>("proc_run", { root, argv, timeoutS: timeoutS ?? null, cwd: null })

export const agentTodoGet = (): Promise<string[]> => invoke<string[]>("todo_get")

export const agentTodoSet = (items: string[]): Promise<string[]> =>
  invoke<string[]>("todo_set", { items })
