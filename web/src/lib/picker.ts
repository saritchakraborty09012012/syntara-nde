/* Chat model picker (track 2a): one local-only list for the chat toolbar.

   The picker must only ever offer what runs on this machine:
   - ids the local gateway is serving right now (`GET /v1/models`), and
   - installed library entries with a real file on disk.
   Catalog models that are not installed never appear, and there are no
   API-key or remote-endpoint fields anywhere near it. */

import type { ModelMeta } from "./syntara-state"

export interface PickerRow {
  /* The value stored as the selected model: the id the gateway serves,
     which for installed entries is their offline library id. */
  id: string
  label: string
  meta: ModelMeta | null
  /* Served by the gateway right now. */
  loaded: boolean
  /* Installed with a local path, so the desktop shell can load it. */
  loadable: boolean
}

export interface MergePickerInput {
  served: readonly string[]
  installed: readonly ModelMeta[]
  /* The one-click load in flight (id + phase), if any. */
  loading?: { id: string; phase: string } | null
}

const libraryKey = (model: ModelMeta): string => model.libraryId ?? model.id

/* Merge gateway-served ids with installed local entries, de-duplicating by
   library id. Served rows come first (they are what a send would hit),
   then loadable installed rows. Anything that is not `installed` is
   dropped even if a caller passes it: the picker is local-only by
   construction. Pure: no network, no state. */
export function mergePickerOptions({ served, installed }: MergePickerInput): PickerRow[] {
  const rows: PickerRow[] = []
  const seen = new Set<string>()
  const local = installed.filter((model) => model.status === "installed")
  const byKey = new Map<string, ModelMeta>()
  for (const model of local) byKey.set(libraryKey(model), model)

  for (const id of served) {
    if (seen.has(id)) continue
    seen.add(id)
    const meta = byKey.get(id) ?? null
    rows.push({
      id,
      label: meta?.name || id,
      meta,
      loaded: true,
      loadable: Boolean(meta?.localPath),
    })
  }
  for (const model of local) {
    const key = libraryKey(model)
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({
      id: key,
      label: model.name || key,
      meta: model,
      loaded: false,
      loadable: Boolean(model.localPath),
    })
  }
  return rows
}

/* Compact badges for one picker row: quantization and context length are
   the two numbers that decide whether a local model fits the machine.
   Placeholder strings the catalog uses ("—", "Architecture dependent")
   are not badges and are left out. */
export function pickerBadges(meta: ModelMeta | null): string[] {
  if (!meta) return []
  const badges: string[] = []
  const quant = meta.quantizations?.[0]
  if (quant && quant !== "Automatic inspection") badges.push(quant)
  const ctx = typeof meta.context === "string" ? meta.context.trim() : ""
  if (ctx && ctx !== "—" && !/architecture dependent|unknown/i.test(ctx)) badges.push(`${ctx} ctx`)
  return badges.slice(0, 2)
}
