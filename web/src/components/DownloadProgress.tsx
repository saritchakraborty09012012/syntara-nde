import { Pause, Play, X } from "lucide-react"
import type { DownloadTask } from "@/lib/syntara-state"
import { formatBytes, formatEta } from "@/lib/format"
import { cn } from "@/lib/utils"

/* Rows that still represent live transfers; complete and error rows are
   history and never belong in an inline progress strip. */
export function activeTasksFor(tasks: DownloadTask[]): DownloadTask[] {
  return tasks.filter((task) => task.state === "queued" || task.state === "downloading" || task.state === "paused")
}

/* One strip can cover a whole checkpoint (many shards downloading in
   parallel), so the numbers are rolled up: bytes and speed add up, while the
   ETA is remaining-bytes over aggregate-speed — the slowest transfer governs
   when totals are unknown. */
export function aggregateDownloads(tasks: DownloadTask[]) {
  const received = tasks.reduce((sum, task) => sum + task.receivedBytes, 0)
  const totalsKnown = tasks.length > 0 && tasks.every((task) => (task.totalBytes ?? 0) > 0)
  const total = totalsKnown ? tasks.reduce((sum, task) => sum + (task.totalBytes ?? 0), 0) : null
  const progress = total
    ? Math.min(100, (received / total) * 100)
    : tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length
  const speed = tasks.reduce((sum, task) => sum + (task.speedBps || 0), 0)
  const taskEtas = tasks.map((task) => task.etaMs).filter((value): value is number => !!value && value > 0)
  const eta = total && speed > 0 && received < total
    ? ((total - received) / speed) * 1000
    : taskEtas.length ? Math.max(...taskEtas) : undefined
  const anyDownloading = tasks.some((task) => task.state === "downloading")
  const anyPaused = tasks.some((task) => task.state === "paused")
  const phase = anyDownloading ? "downloading" : anyPaused ? "paused" : "queued"
  return { received, total, progress, speed, eta, phase, anyDownloading, anyPaused }
}

interface DownloadProgressProps {
  tasks: DownloadTask[]
  onPause: () => void
  onResume: () => void
  onCancel: () => void
  className?: string
}

/* Inline transfer summary shown right where the user clicked Install — on a
   model card or a family header — so leaving the Downloads view never means
   losing sight of progress, speed and remaining time. */
export function DownloadProgress({ tasks, onPause, onResume, onCancel, className }: DownloadProgressProps) {
  if (!tasks.length) return null
  const agg = aggregateDownloads(tasks)
  return (
    <div className={cn("dl-inline", className)} role="status" aria-label="Download progress">
      <div className="progress-track">
        <span style={{ width: `${Math.min(100, agg.progress)}%` }} />
      </div>
      <div className="dl-inline-meta">
        <span className={cn("download-state", agg.phase)}>{agg.phase}</span>
        <span>{Math.round(agg.progress)}%</span>
        <span>
          {agg.total
            ? `${formatBytes(agg.received)} / ${formatBytes(agg.total)}`
            : formatBytes(agg.received)}
        </span>
        {agg.anyDownloading && agg.speed > 0 ? <span>{formatBytes(agg.speed)}/s</span> : null}
        {agg.anyDownloading && agg.eta ? <span>{formatEta(agg.eta)} left</span> : null}
        <span className="dl-inline-actions">
          {agg.anyDownloading ? (
            <button className="icon-btn" onClick={onPause} title="Pause download" aria-label="Pause download">
              <Pause size={14} />
            </button>
          ) : null}
          {agg.anyPaused ? (
            <button className="icon-btn" onClick={onResume} title="Resume download" aria-label="Resume download">
              <Play size={14} />
            </button>
          ) : null}
          <button className="icon-btn" onClick={onCancel} title="Cancel download" aria-label="Cancel download">
            <X size={14} />
          </button>
        </span>
      </div>
    </div>
  )
}
