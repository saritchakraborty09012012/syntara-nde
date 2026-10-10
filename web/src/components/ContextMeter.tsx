/* Topbar context meter: a compact ring showing how full the active model's
   context window is, with a popover explaining auto-summary behaviour.
   Colors step from accent → warn → danger as the window fills. */

import { useEffect, useRef, useState } from "react"
import { Gauge } from "lucide-react"
import type { ContextUsage } from "@/lib/context"

interface ContextMeterProps {
  usage: ContextUsage | null
  autoCompactAt: number
  lastCompactedAt?: number | null
}

function ringColor(percent: number): string {
  if (percent >= 90) return "var(--danger)"
  if (percent >= 70) return "var(--warn)"
  return "var(--accent)"
}

export function ContextMeter({ usage, autoCompactAt, lastCompactedAt }: ContextMeterProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (!usage) return null
  const { percent, usedTokens, limitTokens } = usage
  const color = ringColor(percent)
  const radius = 8
  const circumference = 2 * Math.PI * radius
  const dash = (Math.min(percent, 100) / 100) * circumference
  const compacted = lastCompactedAt
    ? new Date(lastCompactedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null

  return (
    <div className="context-meter" ref={wrapRef}>
      <button
        className="context-meter-btn"
        onClick={() => setOpen((value) => !value)}
        title={`Context window: ${percent}% used`}
        aria-label={`Context window ${percent} percent used`}
        aria-expanded={open}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <circle cx="11" cy="11" r={radius} fill="none" stroke="var(--line-strong)" strokeWidth="2.5" />
          <circle
            cx="11" cy="11" r={radius} fill="none" stroke={color} strokeWidth="2.5"
            strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round"
            transform="rotate(-90 11 11)"
            style={{ transition: "stroke-dasharray .3s ease, stroke .3s ease" }}
          />
        </svg>
        <span className="context-meter-pct" style={{ color }}>{percent}%</span>
      </button>
      {open ? (
        <div className="context-meter-pop" role="dialog" aria-label="Context window details">
          <div className="context-meter-pop-head"><Gauge size={13} /> Context window</div>
          <div className="context-meter-pop-row">
            <span>Estimated usage</span>
            <strong>{usedTokens.toLocaleString()} / {limitTokens.toLocaleString()} tokens</strong>
          </div>
          <div className="context-meter-pop-row">
            <span>Auto-summary</span>
            <strong>at {autoCompactAt}%</strong>
          </div>
          <p>
            When the conversation nears the model's limit, older messages are folded into a
            short summary automatically and the task continues — nothing is sent to a server.
          </p>
          {compacted ? <p className="context-meter-pop-note">Last summarized at {compacted}.</p> : null}
        </div>
      ) : null}
    </div>
  )
}
