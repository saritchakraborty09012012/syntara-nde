import { describe, expect, it } from "vitest"
import { formatBytes } from "./format"
import {
  badgeLabel,
  formatContextLength,
  formatParamsBillion,
  groupComplete,
  metaFromInspect,
  pickInspectTarget,
  type LibraryInspectResult,
} from "./inspect"
import type { DownloadTask, ModelMeta } from "./syntara-state"

const model = (over: Partial<ModelMeta> = {}): ModelMeta => ({
  id: "m1",
  name: "Qwen2 8B",
  provider: "Qwen",
  architecture: "unknown",
  parameters: "Unknown until inspected",
  formats: ["GGUF"],
  quantizations: ["Automatic inspection"],
  capabilities: [],
  context: "Unknown",
  sourceUrl: "local://import",
  recommendedRam: "Analyze locally",
  recommendedVram: "Analyze locally",
  disk: "1 GB",
  status: "available",
  ...over,
})

const row = (over: Partial<DownloadTask> = {}): DownloadTask => ({
  id: "r1",
  modelId: "m1",
  name: "qwen-8b.gguf",
  url: "https://example.invalid/qwen-8b.gguf",
  state: "complete",
  progress: 100,
  receivedBytes: 1024,
  createdAt: 1,
  updatedAt: 1,
  ...over,
})

const report = (over: Partial<LibraryInspectResult> = {}): LibraryInspectResult => ({
  outcome: "registered",
  libraryId: "qwen-8b",
  path: "D:/models/qwen-8b.gguf",
  sizeBytes: 5242880,
  architecture: "qwen2",
  modelName: "Qwen2 8B",
  contextLength: 32768,
  quantizations: ["Q4_K_M", "F16"],
  paramsBillion: 8.03,
  ramGbMin: 10.04,
  fileMb: 4768.4,
  tensorCount: 200,
  tensorParameters: 8030000000,
  tokens: 151936,
  hasChatTemplate: true,
  badges: [{ id: "runtime-support", level: "ok", message: "loadable through the built-in GGUF runtime" }],
  dataComplete: true,
  warnings: [],
  error: null,
  ...over,
})

describe("groupComplete", () => {
  it("is false until every row of the checkpoint has finished", () => {
    const downloads = [
      row({ id: "a", state: "complete" }),
      row({ id: "b", state: "downloading" }),
    ]
    expect(groupComplete(downloads, "m1")).toBe(false)
    downloads[1] = { ...downloads[1], state: "complete" }
    expect(groupComplete(downloads, "m1")).toBe(true)
  })

  it("treats cancelled, paused and failed siblings as unfinished", () => {
    for (const state of ["cancelled", "paused", "error", "queued"] as const) {
      expect(groupComplete([row(), row({ id: "b", state })], "m1")).toBe(false)
    }
  })

  it("never counts rows of other models or an empty model id", () => {
    expect(groupComplete([row({ modelId: "other" })], "m1")).toBe(false)
    expect(groupComplete([], "m1")).toBe(false)
    expect(groupComplete([row()], "")).toBe(false)
  })
})

describe("pickInspectTarget", () => {
  it("prefers the GGUF over companion files", () => {
    const target = pickInspectTarget(["D:/m/params.json", "D:/m/model-00001.gguf"])
    expect(target).toBe("D:/m/model-00001.gguf")
  })

  it("is case-insensitive and falls back to the first real path", () => {
    expect(pickInspectTarget(["D:/m/MODEL.GGUF"])).toBe("D:/m/MODEL.GGUF")
    expect(pickInspectTarget(["D:/m/model.safetensors"])).toBe("D:/m/model.safetensors")
    expect(pickInspectTarget([null, undefined, ""])).toBe(null)
  })
})

describe("formatters", () => {
  it("formats parameter counts like the catalogue does", () => {
    expect(formatParamsBillion(8.03)).toBe("8B")
    expect(formatParamsBillion(70.3)).toBe("70B")
    expect(formatParamsBillion(0.5)).toBe("0.5B")
    expect(formatParamsBillion(0.072)).toBe("72M")
    expect(formatParamsBillion(null)).toBe(null)
    expect(formatParamsBillion(0)).toBe(null)
  })

  it("formats context lengths in catalogue units", () => {
    expect(formatContextLength(131072)).toBe("128K")
    expect(formatContextLength(4096)).toBe("4K")
    expect(formatContextLength(2048)).toBe("2048")
    expect(formatContextLength(null)).toBe(null)
  })

  it("labels badges by verdict, falling back to the raw id", () => {
    expect(badgeLabel({ id: "runtime-support", level: "ok", message: "" })).toBe("Runtime ready")
    expect(badgeLabel({ id: "data", level: "error", message: "" })).toBe("Incomplete data")
    expect(badgeLabel({ id: "something-new", level: "warn", message: "" })).toBe("something-new")
  })
})

describe("metaFromInspect", () => {
  it("fills the card from a registered inspection without touching unknown fields", () => {
    const out = metaFromInspect(model(), report())
    expect(out.status).toBe("installed")
    expect(out.architecture).toBe("qwen2")
    expect(out.parameters).toBe("8B")
    expect(out.quantizations).toEqual(["Q4_K_M", "F16"])
    expect(out.context).toBe("32K")
    expect(out.recommendedRam).toBe("10.04 GB+")
    expect(out.disk).toBe(formatBytes(5242880))
    expect(out.localPath).toBe("D:/models/qwen-8b.gguf")
    expect(out.libraryId).toBe("qwen-8b")
    expect(out.dataComplete).toBe(true)
    expect(out.badges).toHaveLength(1)
    expect(out.capabilities).toEqual([])
  })

  it("marks a truncated file partial so the load button never offers it", () => {
    const out = metaFromInspect(
      model({ status: "installed", libraryId: "prev" }),
      report({
        outcome: "partial",
        libraryId: null,
        dataComplete: false,
        architecture: null,
        paramsBillion: null,
        quantizations: [],
        contextLength: null,
        ramGbMin: null,
        sizeBytes: null,
        error: "cannot add model.gguf: tensor data is incomplete",
        badges: [{ id: "data", level: "error", message: "tensor data is short by 4096 bytes" }],
      }),
    )
    expect(out.status).toBe("partial")
    expect(out.dataComplete).toBe(false)
    expect(out.libraryId).toBe("prev")
    // Unknown fields keep their previous values instead of being blanked.
    expect(out.architecture).toBe("unknown")
    expect(out.parameters).toBe("Unknown until inspected")
    expect(out.badges[0].level).toBe("error")
  })

  it("keeps the verdict and explains a failed inspection", () => {
    const out = metaFromInspect(
      model({ status: "installed", localPath: "D:/m/other.safetensors" }),
      report({
        outcome: "failed",
        libraryId: null,
        path: "D:/m/other.safetensors",
        architecture: null,
        paramsBillion: null,
        quantizations: [],
        contextLength: null,
        ramGbMin: null,
        sizeBytes: null,
        dataComplete: null,
        badges: [],
        error: "Not a GGUF file (bad magic)",
      }),
    )
    expect(out.status).toBe("installed")
    expect(out.badges).toEqual([{ id: "inspect", level: "warn", message: "Not a GGUF file (bad magic)" }])
    expect(out.libraryId).toBeUndefined()
    expect(out.dataComplete).toBeUndefined()
  })

  it("does not imply a library registration that did not happen", () => {
    const out = metaFromInspect(model(), report({ outcome: "inspected", libraryId: null, error: "index unwritable" }))
    expect(out.status).toBe("installed")
    expect(out.libraryId).toBeUndefined()
    expect(out.badges.some((badge) => badge.id === "library-index")).toBe(true)
    expect(badgeLabel(out.badges.find((badge) => badge.id === "library-index")!)).toBe("Not in library index")
  })
})
