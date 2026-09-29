/* Pure derivations behind the Models tabs.

   Installing: live transfers grouped per model, so a multi-shard checkpoint
   (N rows) shows up as one entry with its inline progress strip.

   Installed: what actually counts as installed — storage files listed from
   the app's model folder (desktop shell) are the source of truth, completed
   download rows cover browser sessions and history, and imported models that
   only exist as metadata still have a place to show up. Everything is
   deduplicated so one file never renders twice. */

import type { DownloadTask, ModelMeta } from "./syntara-state"

/* One file present in the model storage folder, as reported by the desktop
   engine's `storage_list_files` command. Browser sessions never have one. */
export interface StorageFileEntry {
  name: string
  bytes: number
  modifiedMs: number
}

export interface InstalledEntry {
  key: string
  modelId: string | null
  name: string
  detail: string
  bytes: number
  modifiedMs: number
  /* True when the file was seen on disk in this session, false when the entry
     rests on metadata (history row or import). */
  verified: boolean
}

export interface InstallingGroup {
  key: string
  name: string
  modelId: string | null
  tasks: DownloadTask[]
}

const basename = (path: string): string => path.split(/[\\/]/).pop() || path
const lower = (value: string): string => value.toLowerCase()

/* `activeTasks` is expected to be pre-filtered to queued/downloading/paused
   rows (see `activeTasksFor`); grouping keys fall back to the row id for
   engine-owned rows that carry no model id. */
export function installingGroups(activeTasks: DownloadTask[], models: ModelMeta[]): InstallingGroup[] {
  const groups = new Map<string, InstallingGroup>()
  for (const task of activeTasks) {
    const key = task.modelId || task.id
    const existing = groups.get(key)
    if (existing) {
      existing.tasks.push(task)
      continue
    }
    groups.set(key, {
      key,
      name: models.find((model) => model.id === task.modelId)?.name ?? task.name,
      modelId: task.modelId || null,
      tasks: [task],
    })
  }
  return [...groups.values()]
}

export function installedEntries(input: {
  models: ModelMeta[]
  downloads: DownloadTask[]
  storageFiles: StorageFileEntry[] | null
}): InstalledEntry[] {
  const { models, downloads, storageFiles } = input
  const entries: InstalledEntry[] = []
  const seenNames = new Set<string>()
  const seenModels = new Set<string>()

  const modelByFile = new Map<string, ModelMeta>()
  for (const model of models) {
    if (model.localPath) modelByFile.set(lower(basename(model.localPath)), model)
  }
  const rowsByFile = new Map<string, DownloadTask>()
  for (const task of downloads) {
    if (task.state === "complete" && !task.fileMissing) rowsByFile.set(lower(task.name), task)
  }

  /* 1. Files physically in the storage folder (desktop shell). */
  if (storageFiles) {
    for (const file of storageFiles) {
      const key = lower(file.name)
      const model = modelByFile.get(key)
      const row = rowsByFile.get(key)
      seenNames.add(key)
      if (model) seenModels.add(model.id)
      entries.push({
        key: `file:${key}`,
        modelId: model?.id ?? row?.modelId ?? null,
        name: model?.name ?? row?.name ?? file.name,
        detail: model ? `${model.provider} · ${model.architecture}` : "Model file in storage",
        bytes: file.bytes,
        modifiedMs: file.modifiedMs,
        verified: true,
      })
    }
  }

  /* 2. Completed history rows the listing does not already cover — browser
        sessions have no listing at all, and a row survives its file until
        the user deletes it (missing files are excluded via `fileMissing`). */
  for (const task of downloads) {
    if (task.state !== "complete" || task.fileMissing) continue
    const key = lower(task.name)
    if (seenNames.has(key)) continue
    if (task.modelId && seenModels.has(task.modelId)) continue
    const model = models.find((item) => item.id === task.modelId)
    seenNames.add(key)
    if (task.modelId) seenModels.add(task.modelId)
    entries.push({
      key: `row:${task.id}`,
      modelId: task.modelId || null,
      name: model?.name ?? task.name,
      detail: model ? `${model.provider} · ${model.architecture}` : "Downloaded file",
      bytes: task.totalBytes || task.receivedBytes || 0,
      modifiedMs: task.updatedAt,
      verified: false,
    })
  }

  /* 3. Imported models that only exist as metadata (never a download row). */
  for (const model of models) {
    if (model.status !== "installed" || seenModels.has(model.id)) continue
    const key = model.localPath ? lower(basename(model.localPath)) : ""
    if (key && seenNames.has(key)) continue
    if (key) seenNames.add(key)
    seenModels.add(model.id)
    entries.push({
      key: `model:${model.id}`,
      modelId: model.id,
      name: model.name,
      detail: `${model.provider} · ${model.architecture}`,
      bytes: 0,
      modifiedMs: model.installedAt ?? 0,
      verified: false,
    })
  }

  /* Files on disk first (they are the ground truth), then newest first. */
  return entries.sort((a, b) => Number(b.verified) - Number(a.verified) || b.modifiedMs - a.modifiedMs)
}
