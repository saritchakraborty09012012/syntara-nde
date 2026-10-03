import { describe, expect, it } from "vitest"

import { bestStarterModel, recommendationLabel, scoreModel, type HardwareSnapshot } from "@/lib/model-hub"
import type { ModelMeta } from "@/lib/syntara-state"

function hw(overrides: Partial<HardwareSnapshot> = {}): HardwareSnapshot {
  return { cpu: "Test CPU", ramGb: 16, gpu: "iGPU", vramGb: 0, storageGb: 512, os: "test", ...overrides }
}

function model(id: string, status: ModelMeta["status"], overrides: Partial<ModelMeta> = {}): ModelMeta {
  return {
    id,
    name: id,
    provider: "test",
    architecture: "dense",
    parameters: "7B",
    formats: ["gguf"],
    quantizations: ["Q4_K_M"],
    capabilities: [],
    context: "32k",
    sourceUrl: "https://example.invalid",
    recommendedRam: "8 GB",
    recommendedVram: "0 GB",
    disk: "4 GB",
    status,
    ...overrides,
  }
}

describe("scoreModel", () => {
  it("rewards machines with enough RAM and penalizes ones without", () => {
    expect(scoreModel(model("ok", "available"), hw({ ramGb: 16 }))).toBe(80)
    expect(scoreModel(model("big", "available", { recommendedRam: "32 GB" }), hw({ ramGb: 16 }))).toBe(20)
  })

  it("leaves the score neutral when RAM is unknown", () => {
    expect(scoreModel(model("m", "available"), hw({ ramGb: 0 }))).toBe(50)
  })

  it("applies the vision, disk and MoE adjustments and clamps to 0..100", () => {
    expect(scoreModel(model("v", "available", { capabilities: ["vision*"] }), hw({ vramGb: 8 }))).toBe(85)
    expect(scoreModel(model("d", "available", { disk: "1500 GB" }), hw({ ramGb: 16 }))).toBe(70)
    expect(scoreModel(model("moe", "available", { architecture: "MoE-hybrid" }), hw({ ramGb: 16 }))).toBe(85)
    expect(scoreModel(model("huge", "available", { recommendedRam: "64 GB", disk: "500 GB" }), hw({ ramGb: 4 }))).toBe(10)
  })
})

describe("recommendationLabel", () => {
  it("maps score bands to labels", () => {
    expect(recommendationLabel(90)).toBe("Recommended")
    expect(recommendationLabel(75)).toBe("Recommended")
    expect(recommendationLabel(74)).toBe("Possible")
    expect(recommendationLabel(55)).toBe("Possible")
    expect(recommendationLabel(54)).toBe("Heavy")
  })
})

describe("bestStarterModel", () => {
  it("returns null for an empty library", () => {
    expect(bestStarterModel([], hw())).toBeNull()
  })

  it("prefers an installed model over a better-scoring available one", () => {
    const installed = model("installed-heavy", "installed", { recommendedRam: "64 GB" })
    const available = model("available-light", "available", { recommendedRam: "8 GB" })
    const pick = bestStarterModel([available, installed], hw({ ramGb: 8 }))
    expect(pick?.model.id).toBe("installed-heavy")
  })

  it("breaks ties inside a tier by hardware score", () => {
    const heavy = model("heavy", "installed", { recommendedRam: "32 GB" })
    const light = model("light", "installed", { recommendedRam: "8 GB" })
    const pick = bestStarterModel([heavy, light], hw({ ramGb: 8 }))
    expect(pick?.model.id).toBe("light")
    expect(pick?.score).toBe(80)
  })

  it("skips partial and detached rows entirely", () => {
    expect(bestStarterModel([model("broken", "partial")], hw())).toBeNull()
    expect(bestStarterModel([model("gone", "detached")], hw())).toBeNull()
    const ok = model("ok", "available")
    expect(bestStarterModel([model("broken", "partial"), model("gone", "detached"), ok], hw())?.model.id).toBe("ok")
  })
})
