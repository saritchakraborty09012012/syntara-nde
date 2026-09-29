/* Bridge to the desktop app's native download engine (Quantum Download Manager).

   Inside the Tauri shell, transfers run in Rust: multi-segment HTTP with
   pause/resume, cancellation and state persisted across restarts. In a plain
   `syntara web` session `qdmAvailable()` is false and App.tsx keeps using the
   streaming fetch helper from download.ts instead.

   Engine: QDM — Quantum Download Manager (MIT), https://github.com/PBhadoo/QDM
   Command names, argument shapes and event payloads mirror that project's
   frontend so the two sides stay interchangeable. */

import { invoke } from "@tauri-apps/api/core"
import { listen, type UnlistenFn } from "@tauri-apps/api/event"

import type { StorageFileEntry } from "./installed"

export type QdmStatus = "queued" | "downloading" | "paused" | "completed" | "failed" | "assembling" | "stopped"

export interface QdmDownloadItem {
  id: string
  url: string
  fileName: string
  fileSize: number
  downloaded: number
  progress: number
  speed: number
  eta: number
  status: QdmStatus
  savePath: string
  resumable: boolean
  error?: string | null
}

export interface QdmProgress {
  id: string
  downloaded: number
  progress: number
  speed: number
  eta: number
  status: QdmStatus
}

export interface QdmConfig {
  downloadDir: string
  maxConcurrentDownloads: number
  maxSegmentsPerDownload: number
  speedLimit: number
  showNotifications: boolean
  minimizeToTray: boolean
  startWithWindows: boolean
  theme: string
  ytdlpPath?: string
  ytdlpBrowser?: string
}

export interface QdmNewDownloadRequest {
  url: string
  fileName?: string
  savePath?: string
  headers?: Record<string, string>
  maxSegments?: number
  autoStart?: boolean
}

export function qdmAvailable(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
}

/* Engine status values are richer than the DownloadTask states the UI knows;
   `assembling` still counts as downloading, and `stopped` (a cancelled
   transfer, persisted in the engine across restarts) stays visible as
   cancelled history instead of disappearing from the list. */
export function qdmStatusToTaskState(status: QdmStatus): "queued" | "downloading" | "paused" | "cancelled" | "complete" | "error" {
  if (status === "completed") return "complete"
  if (status === "failed") return "error"
  if (status === "paused") return "paused"
  if (status === "queued") return "queued"
  if (status === "stopped") return "cancelled"
  return "downloading"
}

/* Engine error strings can carry protocol-specific prefixes; surface them as
   something the user can act on while keeping unknown messages verbatim. */
export function friendlyQdmError(error: string | null | undefined): string {
  if (!error) return "The download failed."
  if (error.startsWith("auth_required:")) return "The server requires credentials, which this build does not support yet."
  if (error === "link_expired") return "The download link expired. Open the model page again and retry."
  if (error === "assembling_failed") return "Download finished but the parts could not be assembled."
  return error
}

export const addQdmDownload = (request: QdmNewDownloadRequest): Promise<QdmDownloadItem> =>
  invoke<QdmDownloadItem>("download_add", { request })

export const pauseQdmDownload = (id: string): Promise<unknown> => invoke("download_pause", { id })

export const resumeQdmDownload = (id: string): Promise<unknown> => invoke("download_resume", { id })

/* Stops the transfer but keeps the engine record (`stopped`), so the row
   survives as struck-through history; `removeQdmDownload` purges it. */
export const cancelQdmDownload = (id: string): Promise<unknown> => invoke("download_cancel", { id })

export const removeQdmDownload = (id: string, deleteFile = false): Promise<unknown> =>
  invoke("download_remove", { id, deleteFile })

export const listQdmDownloads = (): Promise<QdmDownloadItem[]> => invoke<QdmDownloadItem[]>("download_get_all")

/* Engine records whose completed file no longer exists at its save
   location — the UI strikes those rows through but keeps them. */
export const missingQdmFiles = (): Promise<string[]> => invoke<string[]>("download_missing_files")

/* Files currently in the model storage folder, newest first (desktop shell
   only). The Installed tab lists this instead of trusting metadata. */
export const listStorageFiles = (): Promise<StorageFileEntry[]> =>
  invoke<StorageFileEntry[]>("storage_list_files")

export const getQdmConfig = (): Promise<QdmConfig> => invoke<QdmConfig>("config_get")

/* `config_set` merges each provided key into the stored config, so callers can
   send a partial patch such as `{ downloadDir }`. */
export const setQdmConfig = (config: Partial<QdmConfig>): Promise<QdmConfig> =>
  invoke<QdmConfig>("config_set", { config })

export const pickQdmFolder = (): Promise<string | null> => invoke<string | null>("dialog_select_folder")

export interface QdmEventHandlers {
  onProgress?: (progress: QdmProgress) => void
  onStarted?: (id: string) => void
  onPaused?: (item: QdmDownloadItem) => void
  onCancelled?: (id: string) => void
  onRemoved?: (id: string) => void
  onCompleted?: (item: QdmDownloadItem) => void
  onFailed?: (id: string, error: string | null | undefined) => void
}

const noop: UnlistenFn = () => {}

/* Subscribes to the engine's event stream. Events the UI does not handle
   (`download:added`, auth/link dialogs, notifications) are deliberately not
   wired: rows are only ever inserted by the caller that started the download,
   so engine-side additions can never duplicate a row. */
export async function listenQdmEvents(handlers: QdmEventHandlers): Promise<UnlistenFn> {
  const unlisteners = await Promise.all([
    handlers.onProgress
      ? listen<QdmProgress>("download:progress", (event) => handlers.onProgress?.(event.payload))
      : Promise.resolve(noop),
    handlers.onStarted
      ? listen<{ id: string }>("download:started", (event) => handlers.onStarted?.(event.payload.id))
      : Promise.resolve(noop),
    handlers.onPaused
      ? listen<QdmDownloadItem>("download:paused", (event) => handlers.onPaused?.(event.payload))
      : Promise.resolve(noop),
    handlers.onCancelled
      ? listen<{ id: string }>("download:cancelled", (event) => handlers.onCancelled?.(event.payload.id))
      : Promise.resolve(noop),
    handlers.onRemoved
      ? listen<{ id: string }>("download:removed", (event) => handlers.onRemoved?.(event.payload.id))
      : Promise.resolve(noop),
    handlers.onCompleted
      ? listen<QdmDownloadItem>("download:completed", (event) => handlers.onCompleted?.(event.payload))
      : Promise.resolve(noop),
    handlers.onFailed
      ? listen<{ id: string; error?: string | null }>("download:failed", (event) => handlers.onFailed?.(event.payload.id, event.payload.error))
      : Promise.resolve(noop),
  ])
  return () => unlisteners.forEach((unlisten) => unlisten())
}
