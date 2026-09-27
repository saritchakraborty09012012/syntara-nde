import { describe, expect, it } from "vitest"
import { modelCatalog } from "./model-catalog"

/* The 23 seed families from syntara-state.ts. Every family must be present
   in the catalog object (even when empty) so the family page always has a
   key to render, and no family from the seed list is silently missing. */
const SEED_FAMILIES = [
  "qwen-local",
  "deepseek-local",
  "glm-local",
  "llama-local",
  "gemma-local",
  "mistral-local",
  "phi-local",
  "falcon-local",
  "bloom-local",
  "starcoder-local",
  "olmo-local",
  "yi-local",
  "chatglm-local",
  "granite-local",
  "aya-local",
  "gpt-oss-local",
  "gpt2-local",
  "pythia-local",
  "grok-local",
  "colibri-local",
  "openbmb-local",
  "ltx-local",
  "other-open-weight-local",
]

describe("model catalog", () => {
  it("covers every seed family with download data", () => {
    for (const family of SEED_FAMILIES) {
      const models = modelCatalog[family]
      expect(models, `family ${family} missing from catalog`).toBeDefined()
      expect(models.length, `family ${family} has no models`).toBeGreaterThan(0)
    }
  })

  it("keeps every file URL a direct Hugging Face download", () => {
    const urls = Object.values(modelCatalog)
      .flat()
      .flatMap((model) => model.files.map((file) => file.url))
    expect(urls.length).toBeGreaterThan(400)
    for (const url of urls) {
      expect(url.startsWith("https://huggingface.co/")).toBe(true)
      expect(url.endsWith("?download=true")).toBe(true)
    }
  })

  it("resolves sharded checkpoints into every required file", () => {
    const byRepo = (family: string, repo: string) =>
      modelCatalog[family].find((model) => model.repo === repo)

    expect(byRepo("glm-local", "zai-org/GLM-5")?.files).toHaveLength(282)
    expect(byRepo("qwen-local", "Qwen/Qwen3.6-35B-A3B")?.files).toHaveLength(26)
    expect(byRepo("olmo-local", "allenai/OLMoE-1B-7B-0125")?.files).toHaveLength(6)
    expect(byRepo("qwen-local", "Qwen/Qwen-Image-2.1")?.files).toHaveLength(5)

    const glm5 = byRepo("glm-local", "zai-org/GLM-5")
    expect(glm5?.bRating).toBe("744B")
    expect(glm5?.parameters).toBe("744B")
    expect(glm5?.size).toBe("≈1.49 TB (BF16 estimate)")
    expect(glm5?.files[0].url).toBe(
      "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00001-of-00282.safetensors?download=true",
    )
    expect(glm5?.files[281].url).toBe(
      "https://huggingface.co/zai-org/GLM-5/resolve/main/model-00282-of-00282.safetensors?download=true",
    )
  })

  it("routes a model to the family its org/name belongs to", () => {
    const deepseekRepos = modelCatalog["deepseek-local"].map((model) => model.repo)
    expect(deepseekRepos).toContain("deepseek-ai/DeepSeek-R1-Distill-Qwen-7B")
    expect(deepseekRepos).toContain("deepseek-ai/DeepSeek-V4.1-Flash")

    const chatglmRepos = modelCatalog["chatglm-local"].map((model) => model.repo)
    expect(chatglmRepos).toEqual(["THUDM/chatglm3-6b"])
  })

  it("preserves size and parameter metadata per model", () => {
    const llama8b = modelCatalog["llama-local"].find((model) => model.repo === "meta-llama/Llama-3.1-8B")
    expect(llama8b).toMatchObject({
      bRating: "8B",
      parameters: "8B",
      size: "≈16.0 GB (BF16 estimate)",
      files: [{ label: "model.safetensors", url: "https://huggingface.co/meta-llama/Llama-3.1-8B/resolve/main/model.safetensors?download=true" }],
    })

    const unknown = modelCatalog["mistral-local"].find((model) => model.repo === "mistralai/Mixtral-8x7B-v0.1")
    expect(unknown?.bRating).toBe("Unknown")
    expect(unknown?.size).toBe("Unknown / repository-dependent")
  })

  it("holds no duplicate file URLs inside a family", () => {
    for (const models of Object.values(modelCatalog)) {
      const urls = models.flatMap((model) => model.files.map((file) => file.url))
      expect(new Set(urls).size).toBe(urls.length)
    }
  })
})
