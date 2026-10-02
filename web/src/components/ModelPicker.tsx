/* Local-model picker for the chat toolbar (track 2a).

   A styled button + listbox instead of a native <select>, because each
   option needs to carry its badges (quantization, context) and its load
   state (loaded / installed / loading). The list is local-only by
   construction - `mergePickerOptions` never offers anything that does
   not run on this machine - and there is deliberately no API-key or
   endpoint field anywhere in it. */

import { useEffect, useRef, useState } from "react"
import { ChevronDown, LoaderCircle, Package } from "lucide-react"
import { pickerBadges, type PickerRow } from "@/lib/picker"
import { cn } from "@/lib/utils"

export interface ModelPickerProps {
  rows: PickerRow[]
  value: string
  /* One-click load in flight: id + phase, shown on its row. */
  loading?: { id: string; phase: string } | null
  onSelect: (row: PickerRow) => void
}

export function ModelPicker({ rows, value, loading, onSelect }: ModelPickerProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const selected = rows.find((row) => row.id === value) ?? null
  const label = selected?.label ?? (value || (rows.length ? "Select a model" : "No local models"))
  const selectedBadges = pickerBadges(selected?.meta ?? null)

  return (
    <div className="model-selector model-picker" ref={rootRef}>
      <Package size={15} />
      <button
        type="button"
        className="picker-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={!rows.length}
        onClick={() => setOpen((current) => !current)}
        title={rows.length ? "Choose a local model" : "Install a model from the Models view first"}
      >
        <span className="picker-label">{label}</span>
        {selectedBadges.map((badge) => <span key={badge} className="picker-badge">{badge}</span>)}
        {!selected && rows.length ? <span className="picker-badge muted">local only</span> : null}
      </button>
      <ChevronDown size={14} className={cn("picker-chevron", open && "open")} />
      {open ? (
        <div className="model-menu" role="listbox" aria-label="Local models">
          {rows.map((row) => {
            const badges = pickerBadges(row.meta)
            const isLoading = loading?.id === row.id || loading?.id === row.meta?.id
            const disabled = !row.loaded && !row.loadable
            return (
              <button
                key={row.id}
                type="button"
                role="option"
                aria-selected={row.id === value}
                className={cn("model-menu-row", row.id === value && "selected", disabled && "disabled")}
                disabled={disabled}
                title={disabled ? "This entry has no local file to load" : undefined}
                onClick={() => { onSelect(row); setOpen(false) }}
              >
                <span className={cn("picker-dot", row.loaded ? "loaded" : "idle")} aria-hidden />
                <span className="picker-row-main">
                  <span className="picker-row-label">{row.label}</span>
                  <span className="picker-row-id">{row.id}</span>
                </span>
                {isLoading ? (
                  <span className="picker-state busy"><LoaderCircle size={12} className="spin" /> {loading?.phase ?? "Loading"}</span>
                ) : (
                  <span className={cn("picker-state", row.loaded && "loaded")}>{row.loaded ? "Loaded" : row.loadable ? "Installed" : "No file"}</span>
                )}
                {badges.map((badge) => <span key={badge} className="picker-badge">{badge}</span>)}
              </button>
            )
          })}
          <div className="model-menu-note">Local models only · inference runs on this machine</div>
        </div>
      ) : null}
    </div>
  )
}
