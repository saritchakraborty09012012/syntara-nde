/* Checkpoint-level install helpers shared by the model card and the family
   page. Kept out of model-catalog.ts because that file is generated and must
   never be edited by hand.

   A "checkpoint" is one catalog entry (one repo, possibly sharded into several
   files). Installing a checkpoint means queueing every one of its files — a
   model with a missing shard is not a model. */

import { modelCatalog, type CatalogFile, type CatalogModel } from "@/lib/model-catalog"

/* Checkpoints in a family that can be downloaded anonymously: gated repos
   (HF license/login) and missing repos (404) are excluded, as are empty
   entries with no files. */
export function downloadableCheckpoints(familyId: string): CatalogModel[] {
  return (modelCatalog[familyId] ?? []).filter((model) => !model.gated && !model.missing && model.files.length > 0)
}

/* Row label and save filename for one catalog file. The repo-prefixed filename
   keeps two families from colliding on "model.safetensors". */
export function catalogFileTarget(model: CatalogModel, file: CatalogFile): { name: string; filename: string } {
  const segment = decodeURIComponent((file.url.split("/").pop() || "model.bin").split("?")[0])
  return {
    name: model.files.length === 1 ? model.repo : `${model.repo} · ${file.label}`,
    filename: `${model.repo.replace(/\//g, "_")}_${segment}`,
  }
}
