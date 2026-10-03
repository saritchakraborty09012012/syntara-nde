/* Where model files go, and what the picker says about each drive.

   The desktop shell reports the machine's volumes (storage_list_volumes); the
   rules that turn that report into a UI - which row is "(recommended)", which
   rows deserve a warning - live here so they are testable without a shell and
   without a second hard-coded "20 GB" next to the Rust one that decides.

   What the product asks for, in one place:
   - the roomiest drive is prescribed and labelled "(recommended)";
   - a drive with less than 20 GB free is flagged before a download is
     started, not after it fails halfway;
   - nothing is ever chosen silently: a first run asks, every later change
     happens in Settings. */

export interface Volume {
  path: string
  label: string
  totalBytes: number
  freeBytes: number
  kind: string
}

export interface VolumeReport {
  volumes: Volume[]
  recommended: string | null
  minFreeBytes: number
}

export const GIB = 1024 * 1024 * 1024

/** Model folders Syntara creates next to a chosen volume. */
export const MODELS_SUBDIR = "Syntara/models"

export const volumeName = (volume: Volume): string => {
  const tail = volume.path.split(/[\\/]/).filter(Boolean).pop()
  return volume.label || tail || volume.path
}

/** Byte counts in the units people read on a disk. */
export function formatFree(bytes: number): string {
  if (bytes >= 1024 * GIB) return `${(bytes / (1024 * GIB)).toFixed(1)} TB`
  if (bytes >= GIB) return `${(bytes / GIB).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`
  return `${Math.round(bytes / 1024)} KB`
}

export type VolumeSeverity = "ok" | "tight" | "full"

export function volumeSeverity(volume: Volume, requiredBytes = 0, minFreeBytes = 20 * GIB): VolumeSeverity {
  if (volume.freeBytes < requiredBytes || volume.freeBytes <= 0) return "full"
  if (volume.freeBytes < minFreeBytes) return "tight"
  return "ok"
}

/** The folder Syntara would use on a given volume. `C:\` -> `C:\Syntara\models`. */
export const modelsPathFor = (volume: Volume): string => {
  const base = volume.path.replace(/[\\/]+$/, "")
  const separator = /\\$/.test(volume.path) || base.includes("\\") ? "\\" : "/"
  return `${base}${separator}${MODELS_SUBDIR.replace(/\//g, separator)}`
}

/**
 * The picker rows, roomiest first, with the recommendation resolved.
 *
 * The shell already ranks the volumes (storage.rs recommends the roomiest
 * writable one); this recomputes nothing about the order and only attaches the
 * flags, so the UI cannot disagree with the engine about which row to
 * preselect.
 */
export interface VolumeRow {
  volume: Volume
  name: string
  path: string
  modelsPath: string
  freeLabel: string
  recommended: boolean
  severity: VolumeSeverity
  warning: string
}

export function volumeRows(
  report: VolumeReport | null,
  requiredBytes = 0,
): VolumeRow[] {
  if (!report) return []
  return report.volumes
    .map((volume) => {
      const recommended = report.recommended === volume.path
      const severity = volumeSeverity(volume, requiredBytes, report.minFreeBytes)
      return {
        volume,
        name: volumeName(volume),
        path: volume.path,
        modelsPath: modelsPathFor(volume),
        freeLabel: `${formatFree(volume.freeBytes)} free`,
        recommended,
        severity,
        warning: warningFor(volume, severity),
      }
    })
    .sort((a, b) => {
      if (a.recommended !== b.recommended) return a.recommended ? -1 : 1
      return b.volume.freeBytes - a.volume.freeBytes
    })
}

/** The sentence under a row. Empty when there is nothing to warn about. */
export function warningFor(volume: Volume, severity: VolumeSeverity): string {
  if (severity === "full") {
    return `${formatFree(volume.freeBytes)} left — a model download here will fail.`
  }
  if (severity === "tight") {
    return `${formatFree(volume.freeBytes)} free. Model downloads will outgrow this drive.`
  }
  return ""
}

/** Can the import/download start here? `false` only when the drive cannot
    hold the file at all; "tight" is a warning the user may accept. */
export const canStore = (row: VolumeRow): boolean => row.severity !== "full"