/* Pure derivations behind track 1e (library UX): when a download group is
   really finished, how a local inspection result maps onto a model card,
   and the small formatters the card shows. Everything here is synchronous
   and side-effect free so vitest can pin the behaviour; the subprocess
   call itself lives in host-bridge.ts. */

import { formatBytes } from "./format"
import type { DownloadTask, InspectBadge, ModelMeta } from "./syntara-state"

/* Mirrors the `LibraryInspect` struct the desktop shell returns from its
   `library_inspect` command (serde camelCase, Options become null). */
export interface LibraryInspectResult {
  /** registered = in the offline library; inspected = readable but not
      indexed; partial = tensor data short; failed = not inspectable. */
  outcome: "registered" | "inspected" | "partial" | "failed"
  libraryId: string | null
  path: string | null
  sizeBytes: number | null
  architecture: string | null
  modelName: string | null
  contextLength: number | null
  /** Tensor types by frequency, e.g. ["Q4_K_M", "F16"]. */
  quantizations: string[]
  paramsBillion: number | null
  ramGbMin: number | null
  fileMb: number | null
  tensorCount: number | null
  tensorParameters: number | null
  tokens: number | null
  hasChatTemplate: boolean | null
  badges: InspectBadge[]
  dataComplete: boolean | null
  warnings: string[]
  error: string | null
}

/* A multi-file checkpoint is only installed once EVERY row for that model
   is complete: one shard finishing must not flip the card to "installed"
   while its siblings are still queued, paused or failed. */
export function groupComplete(downloads: DownloadTask[], modelId: string): boolean {
  if (!modelId) return false
  const rows = downloads.filter((task) => task.modelId === modelId)
  return rows.length > 0 && rows.every((task) => task.state === "complete")
}

/* The file worth inspecting when a group finishes: the GGUF if the group
   has one (that is what the runtime loads), otherwise whatever finished
   first so the caller still gets an honest not-a-GGUF verdict. */
export function pickInspectTarget(filePaths: Array<string | null | undefined>): string | null {
  const paths = filePaths.filter((path): path is string => !!path)
  return paths.find((path) => path.toLowerCase().endsWith(".gguf")) ?? paths[0] ?? null
}

/** 8.03 -> "8B", 70.3 -> "70B", 0.5 -> "0.5B", 0.072 -> "72M", null -> null. */
export function formatParamsBillion(value: number | null | undefined): string | null {
  if (value == null || !(value > 0)) return null
  if (value < 0.1) return `${Math.round(value * 1000)}M`
  if (value >= 10) return `${Math.round(value)}B`
  return `${Number(value.toFixed(1))}B`
}

/** 131072 -> "128K", 4096 -> "4K", 2048 -> "2048" (matches catalogue style). */
export function formatContextLength(value: number | null | undefined): string | null {
  if (value == null || !(value > 0)) return null
  if (value >= 4096 && value % 1024 === 0) return `${Math.round(value / 1024)}K`
  return `${value}`
}

/* Short chip label; the full sentence stays in the chip's tooltip. */
export function badgeLabel(badge: InspectBadge): string {
  const labels: Record<string, string> = {
    format: "GGUF format",
    data: badge.level === "error" ? "Incomplete data" : "Data verified",
    "dense-policy-architecture": badge.level === "ok" ? "Architecture in scope" : "Architecture unvalidated",
    "dense-policy-quantization": badge.level === "ok" ? "Approved quants" : "Quants unvalidated",
    "runtime-support": badge.level === "ok" ? "Runtime ready" : "Runtime unvalidated",
    "chat-template": badge.level === "ok" ? "Chat template" : "No chat template",
    "library-index": "Not in library index",
    inspect: "Inspect",
  }
  return labels[badge.id] ?? badge.id
}

/* Map an inspection result onto the model card. Field-by-field: only what
   the inspector actually read is overwritten, everything else keeps its
   previous (catalogue or placeholder) value - an inspection must never
   erase metadata it knows nothing about. */
export function metaFromInspect(model: ModelMeta, report: LibraryInspectResult): ModelMeta & { badges: InspectBadge[] } {
  const partial = report.outcome === "partial"
  const failed = report.outcome === "failed"

  let badges: InspectBadge[]
  if (report.badges.length) {
    badges = report.badges
  } else if (failed && report.error) {
    /* Not an inspectable GGUF (e.g. safetensors): say so instead of
       pretending the file was verified. */
    badges = [{ id: "inspect", level: "warn", message: report.error }]
  } else {
    badges = model.badges ?? []
  }
  if (report.outcome === "inspected" && report.error) {
    /* Readable and complete, but the index write was refused - the card
       must not imply the offline catalogue picked it up. */
    badges = [...badges, { id: "library-index", level: "warn", message: `Not added to the library index: ${report.error}` }]
  }

  return {
    ...model,
    /* Registered/inspected: the file is whole, so it is installable (and
       loading it re-attaches a detached entry on purpose). Partial stays
       partial; a failed inspect never changes an existing verdict. */
    status: partial ? "partial" : failed ? model.status : "installed",
    architecture: report.architecture || model.architecture,
    parameters: formatParamsBillion(report.paramsBillion) ?? model.parameters,
    quantizations: report.quantizations.length ? report.quantizations : model.quantizations,
    context: formatContextLength(report.contextLength) ?? model.context,
    recommendedRam: report.ramGbMin != null ? `${report.ramGbMin} GB+` : model.recommendedRam,
    disk: report.sizeBytes != null ? formatBytes(report.sizeBytes) : model.disk,
    localPath: report.path || model.localPath,
    badges,
    libraryId: report.libraryId ?? model.libraryId,
    dataComplete: report.dataComplete ?? model.dataComplete,
  }
}
