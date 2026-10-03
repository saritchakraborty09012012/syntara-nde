/* Bridge to the desktop shell's host + library commands (track 1e).

   Inside the Tauri shell these invoke Rust commands: `library_inspect`
   runs the Python package's own inspector (one source of truth with the
   CLI), and `host_start`/`host_status` manage the local gateway process.
   In a plain `syntara web` session `qdmAvailable()` is false and the
   callers skip these flows - there is no native host to talk to.

   Storage (`storage_list_volumes`) and the copy/move import live here
   for the same reason: they are shell-only, and every caller already
   gates on the shell being present. */

import { invoke } from "@tauri-apps/api/core"

import type { LibraryInspectResult } from "./inspect"
import type { VolumeReport } from "./storage-plan"

/** The `health` object of a HostStatus: the gateway's `/health` body. */
export interface HostHealth {
  status?: string
  ready?: boolean
  model?: string | null
  error?: string | null
  [key: string]: unknown
}

export interface HostStatus {
  /** no_model | not_configured | running | exited | failed */
  state: string
  url: string | null
  port: number | null
  model: string | null
  pid: number | null
  exitCode: number | null
  reason: string | null
  log: string | null
  health: HostHealth | null
}

export const hostStart = (model: string, port?: number | null): Promise<HostStatus> =>
  invoke("host_start", { model, port: port ?? null })

export const hostStatus = (): Promise<HostStatus> => invoke("host_status")

/** Tail of the local host log (Phase 5): `exists=false` means the host has
    never written one yet - an honest empty, not an error. */
export interface HostLogTail {
  path: string
  exists: boolean
  lines: string[]
}
export const hostLogs = (lines?: number): Promise<HostLogTail> => invoke("host_logs", { lines: lines ?? null })

/* The gateway base URL a host status can be auto-connected to, or null
   when there is nothing to connect to yet (no model chosen, process not
   running). Track 2a: chat uses this on mount instead of a manual
   Connect click. */
export function hostBaseFromStatus(status: Pick<HostStatus, "state" | "url">): string | null {
  if (status.state !== "running" || !status.url) return null
  return `${status.url.replace(/\/+$/, "")}/v1`
}

/* Inspect (and register when complete) one local file through the Python
   package - badges, quants and the partial verdict come from the same
   inspector the `syntara inspect` CLI uses. */
export const libraryInspect = (path: string): Promise<LibraryInspectResult> =>
  invoke("library_inspect", { path })

/* ── storage + connecting a model that already exists ─────────────────── */

/** The machine's volumes plus the shell's answer about where models go. */
export const storageListVolumes = (): Promise<VolumeReport> => invoke("storage_list_volumes")

/** Native file picker, filtered to model formats; null when cancelled. */
export const dialogSelectModelFile = (): Promise<string | null> =>
  invoke("dialog_select_model_file")

/* "Connect an existing model": `copy` leaves the original where it is,
   `move` removes it only after the copy into the model folder has been
   verified. Both refuse a file that is already inside the folder. */
export interface ImportResult {
  mode: string
  source: string
  path: string
  bytes: number
  sourceRemoved: boolean
  warning: string | null
  inspect: LibraryInspectResult
}

export const libraryImport = (path: string, mode: "copy" | "move"): Promise<ImportResult> =>
  invoke("library_import", { path, mode })

/* Global timer, not `window.setTimeout`: the wait loop also runs under
   vitest's node environment, where `window` does not exist. */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export interface WaitHostReadyOptions {
  /** How many times to poll before giving up (default 240). */
  tries?: number
  /** Delay between polls in ms (default 500 -> two minutes total). */
  intervalMs?: number
  /** Observer for the UI (spinner phase, status text). */
  onTick?: (status: HostStatus) => void
  /** Injectable for tests; defaults to the `host_status` command. */
  getStatus?: () => Promise<HostStatus>
}

/* Poll the host until the gateway reports a loaded model.

   Failure paths are explicit because AGENTS asks errors to be actionable:
   - host not running (spawn failed, python missing, process died) -> the
     shell's own reason;
   - gateway health `failed` -> the gateway's error text;
   - still loading after the deadline -> points at the host log. */
export async function waitHostReady(options: WaitHostReadyOptions = {}): Promise<HostStatus> {
  const tries = options.tries ?? 240
  const intervalMs = options.intervalMs ?? 500
  const getStatus = options.getStatus ?? hostStatus
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const status = await getStatus()
    options.onTick?.(status)
    if (status.state !== "running") {
      throw new Error(status.reason ?? `the local host stopped (${status.state})`)
    }
    const health = status.health
    if (health?.status === "ready") return status
    if (health?.status === "failed") {
      const detail = typeof health.error === "string" && health.error ? health.error : ""
      throw new Error(detail ? `the model failed to load: ${detail}` : "the model failed to load")
    }
    await sleep(intervalMs)
  }
  throw new Error(
    `the model is still loading after ${Math.round((tries * intervalMs) / 1000)} seconds - check the host log for details`,
  )
}
