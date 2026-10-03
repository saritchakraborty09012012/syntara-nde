export type ThemeMode = "dark" | "light" | "system"

export interface StoredMessage {
  id: string
  role: "system" | "user" | "assistant"
  content: string
  images?: string[]
  /* Text documents attached to a user turn (name + full text). Sent verbatim in
     every request that includes this message, so regenerations stay faithful. */
  docs?: Array<{ name: string; content: string }>
  /* Generation ended before completion (stopped by the user, or the
     runtime failed mid-answer) - the transcript keeps the partial text
     and the UI offers Continue (track 2c). */
  stopped?: boolean
}

export interface Conversation {
  id: string
  title: string
  model: string
  messages: StoredMessage[]
  createdAt: number
  updatedAt: number
  /* Optional per-conversation instructions, injected as the system message on
     every request for this conversation only. Never persisted into the stored
     transcript, so edits apply to the whole conversation. */
  systemPrompt?: string
  /* Optional shared KV cache slot; undefined means the runtime decides. */
  cacheSlot?: number
}

export interface MemoryItem {
  id: string
  content: string
  category: "preference" | "fact" | "project" | "instruction" | "other"
  createdAt: number
  updatedAt: number
}

export interface ProjectItem {
  id: string
  name: string
  description: string
  memoryIds: string[]
  createdAt: number
  updatedAt: number
  /* Agent mode (phase 4): the folder the agent may touch. Paths in tool
     calls are resolved underneath it in the desktop shell. */
  rootPath?: string
  /* Tool names this project has an `always` grant for (phase 4 permission
     system; plain tool-name list, e.g. ["fs_write", "proc_run"]). */
  permissions?: string[]
}

export interface AgentConfig {
  id: string
  name: string
  systemPrompt: string
  tools: string[]
  createdAt: number
  updatedAt: number
}

/* One compatibility verdict from the local GGUF inspector (`syntara inspect`),
   shown as a chip on the model card. Levels mirror the Python badge levels. */
export interface InspectBadge {
  id: string
  level: "ok" | "warn" | "error"
  message: string
}

export interface ModelMeta {
  id: string
  name: string
  provider: string
  architecture: string
  parameters: string
  activeParameters?: string
  formats: string[]
  quantizations: string[]
  capabilities: string[]
  context: string
  sourceUrl: string
  downloadUrl?: string
  recommendedRam: string
  recommendedVram: string
  disk: string
  /* `partial` = the file on disk is truncated (local inspector verdict);
     it must never be offered for loading until the download is completed. */
  status: "available" | "installed" | "detached" | "partial"
  localPath?: string
  installedAt?: number
  /* Filled in by the shell's auto-inspect after a download completes (or
     on first load): inspector badges, offline library id and the
     completeness verdict. Absent = never inspected - honest placeholders. */
  badges?: InspectBadge[]
  libraryId?: string
  dataComplete?: boolean
}

export interface DownloadTask {
  id: string
  modelId: string
  name: string
  url: string
  state: "queued" | "downloading" | "paused" | "cancelled" | "complete" | "error"
  progress: number
  receivedBytes: number
  totalBytes?: number
  createdAt: number
  updatedAt: number
  error?: string
  /* Estimated transfer rate and remaining time, recomputed on every progress event. */
  speedBps?: number
  etaMs?: number
  /* A completed row whose file no longer exists at the storage location
     (verified against disk): shown struck through, but never auto-removed. */
  fileMissing?: boolean
  /* Absolute path of the finished file, learned when the desktop engine
     reports completion (save path + file name). Browser sessions never
     get one - inspect and load only run inside the desktop shell. */
  filePath?: string
}

/* A finished download Syntara has seen before. Kept separately from the
   download list (rows get trashed) so a repeat install can warn the user they
   are about to pull a large file they already fetched once. */
export interface DownloadedModelRecord {
  name: string
  at: number
  bytes?: number
}

export interface AppSettings {
  theme: ThemeMode
  baseUrl: string
  model: string
  performanceMode: "maximum" | "balanced" | "efficiency" | "battery"
  autoStart: boolean
  tray: boolean
  reducedMotion: boolean
  memoryEnabled: boolean
  /* Kept for agent-mode per-project settings; chat no longer selects
     projects (Phase 2 removed the workspace concept from the UI). */
  selectedProjectId: string | null
  /* UI chrome: sidebar rail collapsed (logo stays visible) and
     conversation-history panel collapsed. Persisted like other settings. */
  navCollapsed: boolean
  historyCollapsed: boolean
  /* Phase 5: the first-run hardware-based model suggestion shows until the
     user acts on or dismisses it. */
  starterSuggestionSeen: boolean
}

export interface SyntaraState {
  schema: 1
  conversations: Conversation[]
  memories: MemoryItem[]
  /* Project records persist for agent mode (per-project permissions);
     the Projects view itself was removed in Phase 2, so existing rows
     are preserved but not rendered. */
  projects: ProjectItem[]
  agents: AgentConfig[]
  models: ModelMeta[]
  downloads: DownloadTask[]
  downloadedModels: Record<string, DownloadedModelRecord>
  settings: AppSettings
}

const STORAGE_KEY = "syntara.state.v1"
/* Download history (rows + re-download memory) lives under its own key with
   no size cap: rows stay in local storage until the user explicitly deletes
   them, even when the heavier chat state cannot be written this round. */
const DOWNLOADS_KEY = "syntara.downloads.v1"
const MAX_PERSIST_BYTES = 2_000_000

/* Empty families are catalog placeholders: their metadata is filled in as
   checkpoints, health checks and runtime support are added. Keeping the entry
   means the catalogue already curates the family for local use. */
const emptyFamily = (id: string, name: string, provider: string, sourceUrl: string): ModelMeta => ({
  id,
  name,
  provider,
  architecture: "To be defined",
  parameters: "—",
  formats: [],
  quantizations: [],
  capabilities: [],
  context: "—",
  sourceUrl,
  downloadUrl: undefined,
  recommendedRam: "—",
  recommendedVram: "—",
  disk: "—",
  status: "available",
})

const seedModels: ModelMeta[] = [
  {
    id: "qwen-local",
    name: "Qwen families and variants",
    provider: "Qwen",
    architecture: "Dense / MoE variants",
    parameters: "Various",
    formats: ["GGUF", "Safetensors", "Hugging Face"],
    quantizations: ["Q8", "Q6", "Q5", "Q4"],
    capabilities: ["text", "vision*", "tools*", "long-context*"],
    context: "Architecture dependent",
    sourceUrl: "https://huggingface.co/Qwen",
    downloadUrl: "https://huggingface.co/Qwen",
    recommendedRam: "8–64+ GB",
    recommendedVram: "0–24+ GB",
    disk: "1–500+ GB",
    status: "available",
  },
  {
    id: "deepseek-local",
    name: "DeepSeek",
    provider: "DeepSeek",
    architecture: "Dense / MoE variants",
    parameters: "Various",
    formats: ["GGUF", "Safetensors", "Hugging Face"],
    quantizations: ["FP8", "Q8", "Q6", "Q4"],
    capabilities: ["text", "vision*", "reasoning*", "tools*"],
    context: "Architecture dependent",
    sourceUrl: "https://huggingface.co/deepseek-ai",
    downloadUrl: "https://huggingface.co/deepseek-ai",
    recommendedRam: "16–128+ GB",
    recommendedVram: "0–48+ GB",
    disk: "5–500+ GB",
    status: "available",
  },
  {
    id: "glm-local",
    name: "GLM",
    provider: "Z.ai",
    architecture: "Dense / MoE variants",
    parameters: "Various",
    formats: ["GGUF", "Safetensors", "Hugging Face"],
    quantizations: ["FP8", "INT4", "Q4"],
    capabilities: ["text", "vision*", "tools*", "reasoning*"],
    context: "Architecture dependent",
    sourceUrl: "https://huggingface.co/THUDM",
    downloadUrl: "https://huggingface.co/THUDM",
    recommendedRam: "8–128+ GB",
    recommendedVram: "0–48+ GB",
    disk: "2–500+ GB",
    status: "available",
  },
  {
    id: "llama-local",
    name: "Llama",
    provider: "Meta",
    architecture: "Dense / MoE variants",
    parameters: "Various",
    formats: ["GGUF", "Safetensors", "Hugging Face"],
    quantizations: ["Q8", "Q6", "Q5", "Q4"],
    capabilities: ["text", "vision*", "tools*"],
    context: "Architecture dependent",
    sourceUrl: "https://huggingface.co/meta-llama",
    downloadUrl: "https://huggingface.co/meta-llama",
    recommendedRam: "8–64+ GB",
    recommendedVram: "0–24+ GB",
    disk: "1–500+ GB",
    status: "available",
  },
  {
    id: "gemma-local",
    name: "Gemma",
    provider: "Google",
    architecture: "Dense / multimodal variants",
    parameters: "Various",
    formats: ["GGUF", "Safetensors", "Hugging Face"],
    quantizations: ["Q8", "Q6", "Q5", "Q4"],
    capabilities: ["text", "vision*", "tools*"],
    context: "Architecture dependent",
    sourceUrl: "https://huggingface.co/google",
    downloadUrl: "https://huggingface.co/google",
    recommendedRam: "8–64+ GB",
    recommendedVram: "0–24+ GB",
    disk: "2–250+ GB",
    status: "available",
  },
  {
    id: "mistral-local",
    name: "Mistral / Mixtral",
    provider: "Mistral AI",
    architecture: "Dense / MoE variants",
    parameters: "Various",
    formats: ["GGUF", "Safetensors", "Hugging Face"],
    quantizations: ["Q8", "Q6", "Q5", "Q4"],
    capabilities: ["text", "vision*", "tools*"],
    context: "Architecture dependent",
    sourceUrl: "https://huggingface.co/mistralai",
    downloadUrl: "https://huggingface.co/mistralai",
    recommendedRam: "8–64+ GB",
    recommendedVram: "0–24+ GB",
    disk: "2–250+ GB",
    status: "available",
  },
  emptyFamily("phi-local", "Microsoft Phi", "Microsoft", "https://huggingface.co/microsoft"),
  emptyFamily("falcon-local", "Falcon", "TII", "https://huggingface.co/tiiuae"),
  emptyFamily("bloom-local", "BLOOM", "BigScience", "https://huggingface.co/bigscience"),
  emptyFamily("starcoder-local", "StarCoder", "BigCode", "https://huggingface.co/bigcode"),
  emptyFamily("olmo-local", "OLMo / OLMoE", "AI2", "https://huggingface.co/allenai"),
  emptyFamily("yi-local", "Yi", "01.AI", "https://huggingface.co/01-ai"),
  emptyFamily("chatglm-local", "ChatGLM", "Zhipu AI", "https://huggingface.co/zai-org"),
  emptyFamily("granite-local", "IBM Granite", "IBM", "https://huggingface.co/ibm"),
  emptyFamily("aya-local", "Cohere Aya", "Cohere", "https://huggingface.co/CohereAI"),
  emptyFamily("gpt-oss-local", "OpenAI GPT-OSS", "OpenAI", "https://huggingface.co/openai"),
  emptyFamily("gpt2-local", "GPT-2", "OpenAI", "https://huggingface.co/openai-community"),
  emptyFamily("pythia-local", "EleutherAI Pythia", "EleutherAI", "https://huggingface.co/EleutherAI"),
  emptyFamily("grok-local", "xAI Grok", "xAI", "https://huggingface.co/x-ai"),
  emptyFamily("inkling-int4-local", "Inkling int4 builds", "Community", "https://github.com/saritchakraborty09012012/syntara-nde"),
  emptyFamily("openbmb-local", "OpenBMB", "OpenBMB", "https://huggingface.co/OpenBMB"),
  emptyFamily("ltx-local", "LTX", "LTX", "https://huggingface.co/Lightricks"),
  emptyFamily("other-open-weight-local", "Other open-weight families", "Open-source community", "https://huggingface.co/models"),
]

/* Seed changes must reach installations that already have stored state.
   Stored models keep their runtime facts (installed/detached status, local
   path, install time); the seed supplies current catalogue metadata, so
   renamed families and newly added families appear after an update. Models
   the user imported are not seeds and are kept verbatim. */
function mergeSeedModels(stored: ModelMeta[]): ModelMeta[] {
  if (!stored.length) return seedModels
  const byId = new Map(stored.map((model) => [model.id, model]))
  const merged = seedModels.map((seed) => {
    const prior = byId.get(seed.id)
    if (!prior) return seed
    byId.delete(seed.id)
    return { ...seed, status: prior.status, localPath: prior.localPath, installedAt: prior.installedAt }
  })
  return [...merged, ...byId.values()]
}

export function defaultState(): SyntaraState {
  return {
    schema: 1,
    conversations: [],
    memories: [],
    projects: [],
    agents: [],
    models: seedModels,
    downloads: [],
    downloadedModels: {},
    settings: {
      theme: "dark",
      baseUrl: "http://127.0.0.1:8000/v1",
      model: "",
      performanceMode: "balanced",
      autoStart: false,
      tray: true,
      reducedMotion: false,
      memoryEnabled: true,
      selectedProjectId: null,
      navCollapsed: false,
      historyCollapsed: false,
      starterSuggestionSeen: false,
    },
  }
}

export function loadState(storage: Storage = localStorage): SyntaraState {
  const base = defaultState()
  let parsed: Partial<SyntaraState> = {}
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw) parsed = JSON.parse(raw) as Partial<SyntaraState>
  } catch {
    parsed = {}
  }
  /* The dedicated history key wins when present; older stores only have the
     rows inside the main state, so those keep loading from there. */
  let history: { downloads?: DownloadTask[]; downloadedModels?: Record<string, DownloadedModelRecord> } = {}
  try {
    const raw = storage.getItem(DOWNLOADS_KEY)
    if (raw) history = JSON.parse(raw) as typeof history
  } catch {
    history = {}
  }
  return {
    ...base,
    ...parsed,
    settings: { ...base.settings, ...(parsed.settings || {}) },
    models: mergeSeedModels(parsed.models || []),
    conversations: parsed.conversations || [],
    memories: parsed.memories || [],
    projects: parsed.projects || [],
    agents: parsed.agents || [],
    downloads: history.downloads || parsed.downloads || [],
    downloadedModels: history.downloadedModels || parsed.downloadedModels || {},
  }
}

export function saveState(state: SyntaraState, storage: Storage = localStorage) {
  try {
    const { downloads, downloadedModels, ...rest } = state
    const serialized = JSON.stringify(rest)
    if (serialized.length <= MAX_PERSIST_BYTES) storage.setItem(STORAGE_KEY, serialized)
  } catch {
    // Restricted storage, quota, or private mode: local session continues.
  }
  try {
    storage.setItem(DOWNLOADS_KEY, JSON.stringify({ downloads: state.downloads, downloadedModels: state.downloadedModels }))
  } catch {
    // Quota exceeded mid-session; the previous history snapshot stays put.
  }
}

export function clearState(storage: Storage = localStorage) {
  try {
    storage.removeItem(STORAGE_KEY)
    storage.removeItem(DOWNLOADS_KEY)
  } catch {}
}

/* Disk verification for completed rows: a file the user moved or deleted
   outside the app strikes its row through (the row itself is never removed
   here — only an explicit delete does that) and drops the re-download memory
   for models whose completed rows are all gone from disk. Returns the same
   state object when nothing changed. */
export function markMissingFiles(current: SyntaraState, missingIds: Set<string>): SyntaraState {
  let downloadsChanged = false
  const downloads = current.downloads.map((row) => {
    if (row.state !== "complete") return row
    const missing = missingIds.has(row.id)
    if (missing === !!row.fileMissing) return row
    downloadsChanged = true
    return { ...row, fileMissing: missing || undefined, updatedAt: Date.now() }
  })
  let memoryChanged = false
  const downloadedModels = { ...current.downloadedModels }
  for (const modelId of Object.keys(downloadedModels)) {
    const completed = downloads.filter((row) => row.modelId === modelId && row.state === "complete")
    if (completed.length && completed.every((row) => row.fileMissing)) {
      delete downloadedModels[modelId]
      memoryChanged = true
    }
  }
  if (!downloadsChanged && !memoryChanged) return current
  return { ...current, downloads, downloadedModels }
}

export function createId(prefix: string) {
  try { return `${prefix}_${crypto.randomUUID()}` } catch { return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}` }
}

export function makeBackup(state: SyntaraState) {
  return {
    kind: "syntara-backup",
    schema: 1,
    exportedAt: new Date().toISOString(),
    includesModelWeights: false,
    note: "Model weights are intentionally not included; model metadata is preserved for re-download and re-attachment.",
    data: state,
  }
}

export async function restoreBackup(file: File): Promise<SyntaraState> {
  const text = await file.text()
  const parsed = JSON.parse(text) as { kind?: string; schema?: number; data?: SyntaraState }
  if (parsed.kind !== "syntara-backup" || parsed.schema !== 1 || !parsed.data) throw new Error("Invalid Syntara backup file")
  const base = defaultState()
  return {
    ...base,
    ...parsed.data,
    schema: 1,
    downloadedModels: parsed.data.downloadedModels || {},
    settings: { ...base.settings, ...(parsed.data.settings || {}) },
  }
}

export { STORAGE_KEY, DOWNLOADS_KEY }
