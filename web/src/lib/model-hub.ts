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
