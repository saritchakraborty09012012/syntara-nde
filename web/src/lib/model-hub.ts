import type { ModelMeta } from "./syntara-state"

export interface HardwareSnapshot {
  cpu: string
  ramGb: number
  gpu: string
  vramGb: number
  storageGb: number
  os: string
}

export function detectHardware(health?: { hwinfo?: { cpu?: string; ram_total_gb?: number; gpu?: string; vram_total_gb?: number } } | null): HardwareSnapshot {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  const ua = nav.userAgentData?.platform || navigator.platform || "Unknown"
  return {
    cpu: health?.hwinfo?.cpu || "Detecting…",
    ramGb: health?.hwinfo?.ram_total_gb || 0,
    gpu: health?.hwinfo?.gpu || "Integrated / unknown",
    vramGb: health?.hwinfo?.vram_total_gb || 0,
    storageGb: 0,
    os: ua,
  }
}

export function scoreModel(model: ModelMeta, hw: HardwareSnapshot) {
  let score = 50
  const ram = Number.parseFloat(model.recommendedRam.split(/[–-]/)[0]) || 8
  if (hw.ramGb) score += hw.ramGb >= ram ? 30 : -30
  if (model.capabilities.includes("vision*") && hw.vramGb > 0) score += 5
  if (model.disk.includes("500") && hw.ramGb < 32) score -= 10
  if (model.architecture.toLowerCase().includes("moe")) score += 5
  return Math.max(0, Math.min(100, score))
}

export function recommendationLabel(score: number) {
  if (score >= 75) return "Recommended"
  if (score >= 55) return "Possible"
  return "Heavy"
}

/* Phase 5: first-run starter suggestion. Prefers what the user can act on
   right now - an installed model beats an available one beats the rest -
   and breaks ties inside each tier by hardware score. Partial/detached rows
   are skipped (nothing runnable), and an empty library returns null so the
   welcome screen stays silent instead of guessing. */
export function bestStarterModel(models: ModelMeta[], hw: HardwareSnapshot): { model: ModelMeta; score: number } | null {
  const rank = (model: ModelMeta): number => (model.status === "installed" ? 2 : model.status === "available" ? 1 : 0)
  const usable = models.filter((model) => model.status !== "partial" && model.status !== "detached")
  let best: { model: ModelMeta; score: number } | null = null
  for (const model of usable) {
    const score = scoreModel(model, hw)
    const better =
      !best ||
      rank(model) > rank(best.model) ||
      (rank(model) === rank(best.model) && score > best.score)
    if (better) best = { model, score }
  }
  return best
}
