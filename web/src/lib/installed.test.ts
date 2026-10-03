import { describe, expect, it } from "vitest"

import { installedEntries, installingGroups, type StorageFileEntry } from "./installed"
import type { DownloadTask, ModelMeta } from "./syntara-state"

function model(overrides: Partial<ModelMeta> & Pick<ModelMeta, "id">): ModelMeta {
  return {
    name: overrides.id,
    provider: "Test provider",
    architecture: "transformer",
    parameters: "7B",
    formats: ["GGUF"],
    quantizations: ["Q4_K_M"],
    capabilities: ["chat"],
    context: "32k",
    sourceUrl: "https://example.test/model",
    recommendedRam: "8 GB",
    recommendedVram: "4 GB",
    disk: "4 GB",
    status: "available",
    ...overrides,
  }
}

function task(overrides: Partial<DownloadTask> & Pick<DownloadTask, "id">): DownloadTask {
  return {
    modelId: "qwen-local",
    name: `${overrides.id}.gguf`,
    url: "https://example.test/file.gguf",
    state: "complete",
    progress: 100,
    receivedBytes: 1000,
    totalBytes: 1000,
    createdAt: 10,
    updatedAt: 20,
    ...overrides,
  }
}

describe("installingGroups", () => {
  it("collapses a checkpoint's shards into one row named after the model", () => {
    const groups = installingGroups(
      [
        task({ id: "dl_1", modelId: "qwen-local", name: "qwen-part1.gguf", state: "downloading" }),
        task({ id: "dl_2", modelId: "qwen-local", name: "qwen-part2.gguf", state: "paused" }),
      ],
      [model({ id: "qwen-local", name: "Qwen 2.5 7B" })],
    )
    expect(groups).toHaveLength(1)
    expect(groups[0].key).toBe("qwen-local")
    expect(groups[0].name).toBe("Qwen 2.5 7B")
    expect(groups[0].tasks.map((item) => item.id)).toEqual(["dl_1", "dl_2"])
  })

  it("groups engine rows without a model id by their own id and keeps the file name", () => {
    const groups = installingGroups(
      [task({ id: "engine_9", modelId: "", name: "orphan.bin", state: "queued" })],
      [model({ id: "qwen-local" })],
    )
    expect(groups).toEqual([
      { key: "engine_9", name: "orphan.bin", modelId: null, tasks: [expect.anything() as DownloadTask] },
    ])
  })

  it("returns nothing when no transfer is active", () => {
    expect(installingGroups([], [model({ id: "qwen-local" })])).toEqual([])
  })
})

describe("installedEntries", () => {
  const file = (name: string, extra: Partial<StorageFileEntry> = {}): StorageFileEntry => ({
    name,
    bytes: 4_000_000_000,
    modifiedMs: 500,
    ...extra,
  })

  it("lists storage files first and marks them verified, matched to their model", () => {
    const entries = installedEntries({
      models: [
        model({ id: "qwen-local", name: "Qwen 2.5 7B", status: "installed", localPath: "/models/qwen.gguf" }),
        model({ id: "llama-local", name: "Llama", status: "available" }),
      ],
      downloads: [],
      storageFiles: [file("qwen.gguf"), file("stray.gguf", { modifiedMs: 900 })],
    })
    expect(entries.map((entry) => entry.key)).toEqual(["file:stray.gguf", "file:qwen.gguf"])
    expect(entries.every((entry) => entry.verified)).toBe(true)
    const matched = entries.find((entry) => entry.modelId === "qwen-local")
    expect(matched?.name).toBe("Qwen 2.5 7B")
    expect(entries.find((entry) => entry.key === "file:stray.gguf")?.modelId).toBeNull()
  })

  it("matches paths with either separator and lowercases the comparison", () => {
    const entries = installedEntries({
      models: [model({ id: "m1", status: "installed", localPath: "C:\\models\\Weights.GGUF" })],
      downloads: [],
      storageFiles: [file("weights.gguf")],
    })
    expect(entries).toHaveLength(1)
    expect(entries[0].modelId).toBe("m1")
    expect(entries[0].verified).toBe(true)
  })

  it("covers completed history rows the listing does not have, skipping missing files", () => {
    const entries = installedEntries({
      models: [],
      downloads: [
        task({ id: "dl_ok", name: "kept.gguf" }),
        task({ id: "dl_gone", name: "deleted.gguf", fileMissing: true }),
        task({ id: "dl_running", name: "running.gguf", state: "downloading" }),
        task({ id: "dl_cancelled", name: "cancelled.gguf", state: "cancelled" }),
      ],
      storageFiles: [],
    })
    expect(entries.map((entry) => entry.key)).toEqual(["row:dl_ok"])
    expect(entries[0].verified).toBe(false)
  })

  it("never renders the same file twice across listing, rows and imports", () => {
    const entries = installedEntries({
      models: [model({ id: "qwen-local", status: "installed", localPath: "qwen.gguf", installedAt: 40 })],
      downloads: [task({ id: "dl_1", name: "qwen.gguf" })],
      storageFiles: [file("qwen.gguf")],
    })
    expect(entries).toHaveLength(1)
    expect(entries[0].verified).toBe(true)
  })

  it("falls back to metadata in the browser (no storage listing)", () => {
    const entries = installedEntries({
      models: [
        model({ id: "import-1", name: "My GGUF", status: "installed", localPath: "my.gguf", installedAt: 700 }),
        model({ id: "available-1", status: "available" }),
        model({ id: "detached-1", status: "detached" }),
      ],
      downloads: [task({ id: "dl_1", name: "history.gguf", updatedAt: 300 })],
      storageFiles: null,
    })
    expect(entries.map((entry) => entry.key)).toEqual(["model:import-1", "row:dl_1"])
    expect(entries.every((entry) => !entry.verified)).toBe(true)
  })

  it("keeps an installed model with no row visible", () => {
    const entries = installedEntries({
      models: [model({ id: "import-9", status: "installed", localPath: "big.gguf" })],
      downloads: [],
      storageFiles: [],
    })
    expect(entries.map((entry) => entry.modelId)).toEqual(["import-9"])
  })

  it("returns nothing for an empty library", () => {
    expect(installedEntries({ models: [], downloads: [], storageFiles: [] })).toEqual([])
    expect(installedEntries({ models: [], downloads: [], storageFiles: null })).toEqual([])
  })
})
