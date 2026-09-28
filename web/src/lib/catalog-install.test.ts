import { describe, expect, it } from "vitest"
import { catalogFileTarget, downloadableCheckpoints } from "./catalog-install"
import { modelCatalog } from "./model-catalog"

describe("catalog install helpers", () => {
  it("never offers gated, missing or empty checkpoints as installs", () => {
    const blocked = Object.entries(modelCatalog).flatMap(([family, models]) =>
      models
        .filter((model) => model.gated || model.missing || !model.files.length)
        .map((model) => `${family}::${model.repo}`),
    )
    expect(blocked.length).toBeGreaterThan(0)
    for (const family of Object.keys(modelCatalog)) {
      const allowed = new Set(downloadableCheckpoints(family).map((model) => `${family}::${model.repo}`))
      for (const entry of blocked.filter((item) => item.startsWith(`${family}::`))) {
        expect(allowed.has(entry), `${entry} must not be installable`).toBe(false)
      }
    }
  })

  it("gives every shard a unique repo-prefixed save name", () => {
    const sharded = modelCatalog["gpt-oss-local"].find((model) => model.files.length > 1)
    expect(sharded).toBeDefined()
    if (!sharded) return
    const names = sharded.files.map((file) => catalogFileTarget(sharded, file).filename)
    expect(new Set(names).size).toBe(sharded.files.length)
    for (const [index, file] of sharded.files.entries()) {
      const segment = decodeURIComponent((file.url.split("/").pop() || "").split("?")[0])
      expect(names[index]).toBe(`${sharded.repo.replace(/\//g, "_")}_${segment}`)
    }
    expect(catalogFileTarget(sharded, sharded.files[0]).name).toContain(sharded.repo)
  })

  it("labels a single-file checkpoint with the repo itself", () => {
    const single = modelCatalog["gpt2-local"][0]
    expect(catalogFileTarget(single, single.files[0]).name).toBe(single.repo)
  })
})
