/* Byte and duration display helpers shared by the download rows and the
   inline progress strips, so both places render identical numbers. */

export function formatBytes(value?: number) {
  if (!value || !Number.isFinite(value)) return "—"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let n = value
  let i = 0
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(i > 1 ? 1 : 0)} ${units[i]}`
}

export function formatEta(value?: number) {
  if (!value || !Number.isFinite(value) || value <= 0) return ""
  const seconds = Math.round(value / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}
