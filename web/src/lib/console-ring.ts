/* Console ring (phase 4): a bounded in-memory capture of this window's
   console output, surfaced to the agent through the console_read tool.

   Scope is honest and explicit: only the Syntara window's own console is
   captured — a cross-origin preview page's console cannot be reached from
   here (preview-window capture arrives with the native WebviewWindow
   work). Install once; the original console methods keep working. */

const MAX_LINES = 200
const MAX_LINE_CHARS = 500

const ring: string[] = []
let installed = false

function format(value: unknown): string {
  if (typeof value === "string") return value
  if (value instanceof Error) return `${value.name}: ${value.message}`
  try {
    const json = JSON.stringify(value)
    return typeof json === "string" ? json : String(value)
  } catch {
    return String(value)
  }
}

function push(level: string, args: unknown[]): void {
  const line = `[${level}] ${args.map(format).join(" ")}`
  ring.push(line.length > MAX_LINE_CHARS ? `${line.slice(0, MAX_LINE_CHARS)}…` : line)
  if (ring.length > MAX_LINES) ring.splice(0, ring.length - MAX_LINES)
}

/** Idempotent: safe to call from an effect that re-runs. */
export function installConsoleRing(): void {
  if (installed || typeof console === "undefined") return
  installed = true
  for (const level of ["log", "info", "warn", "error"] as const) {
    const original = console[level].bind(console)
    console[level] = (...args: unknown[]) => {
      try {
        push(level, args)
      } catch {
        /* Capture must never break logging itself. */
      }
      original(...args)
    }
  }
}

/** Newest last. */
export function getConsoleLines(): string[] {
  return [...ring]
}

/** Test seam: clear the ring between assertions. */
export function resetConsoleRing(): void {
  ring.length = 0
}
