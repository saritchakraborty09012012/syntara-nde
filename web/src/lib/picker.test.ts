import { describe, expect, it } from "vitest"
import { mergePickerOptions, pickerBadges } from "./picker"
import type { ModelMeta } from "./syntara-state"

const model = (over: Partial<ModelMeta> = {}): ModelMeta => ({
  id: "qwen-local",
  name: "Qwen local",
  provider: "local",
  architecture: "transformer",
  capabilities: [],
  status: "installed",
  quantizations: ["Q4_K_M"],
  context: "8k",
  localPath: "D:/models/qwen.gguf",
  libraryId: "lib-qwen",
  ...over,
} as ModelMeta)

describe("mergePickerOptions", () => {
  it("lists served ids first and dedupes installed entries by library id", () => {
    const rows = mergePickerOptions({ served: ["lib-qwen"], installed: [model()] })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ id: "lib-qwen", label: "Qwen local", loaded: true })
  })

  it("offers installed local models that are not served yet", () => {
    const rows = mergePickerOptions({ served: [], installed: [model()] })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ id: "lib-qwen", loaded: false, loadable: true })
  })

  it("drops everything that is not an installed entry, even if passed in", () => {
    const rows = mergePickerOptions({
      served: ["served-1"],
      installed: [model(), model({ id: "catalog", status: "available", localPath: undefined, libraryId: undefined })],
    })
    expect(rows.map((row) => row.id)).toEqual(["served-1", "lib-qwen"])
  })

  it("marks entries without a local path as not loadable", () => {
    const rows = mergePickerOptions({ served: [], installed: [model({ localPath: undefined })] })
    expect(rows[0].loadable).toBe(false)
  })

  it("falls back to the id when the gateway serves a model with no library entry", () => {
    const rows = mergePickerOptions({ served: ["mystery"], installed: [] })
    expect(rows[0]).toMatchObject({ id: "mystery", label: "mystery", meta: null, loaded: true })
  })
})

describe("pickerBadges", () => {
  it("shows quantization and context length", () => {
    expect(pickerBadges(model())).toEqual(["Q4_K_M", "8k ctx"])
  })

  it("returns nothing for missing metadata", () => {
    expect(pickerBadges(null)).toEqual([])
  })

  it("skips catalog placeholder context strings", () => {
    expect(pickerBadges(model({ context: "Architecture dependent" }))).toEqual(["Q4_K_M"])
    expect(pickerBadges(model({ context: "—" }))).toEqual(["Q4_K_M"])
  })

  it("caps at two badges", () => {
    expect(pickerBadges(model({ quantizations: ["Q4_K_M"], context: "32k" })).length).toBeLessThanOrEqual(2)
  })
})
