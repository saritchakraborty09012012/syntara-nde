export type ThemeMode = "dark" | "light" | "system"

export interface StoredMessage {
  id: string
  role: "system" | "user" | "assistant"
  content: string
  images?: string[]
  /* Text documents attached to a user turn (name + full text). Sent verbatim in
     every request that includes this message, so regenerations stay faithful. */
  docs?: Array<{ name: string; content: string }>
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
}

export interface AgentConfig {
  id: string
  name: string
  systemPrompt: string
  tools: string[]
  createdAt: number
  updatedAt: number
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
  status: "available" | "installed" | "detached"
  localPath?: string
  installedAt?: number
}

export interface DownloadTask {
  id: string
  modelId: string
  name: string
  url: string
  state: "queued" | "downloading" | "paused" | "complete" | "error"
  progress: number
  receivedBytes: number
  totalBytes?: number
  createdAt: number
  updatedAt: number
  error?: string
  /* Estimated transfer rate and remaining time, recomputed on every progress event. */
  speedBps?: number
  etaMs?: number
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
  selectedProjectId: string | null
}

export interface SyntaraState {
  schema: 1
  conversations: Conversation[]
  memories: MemoryItem[]
  projects: ProjectItem[]
  agents: AgentConfig[]
  models: ModelMeta[]
  downloads: DownloadTask[]
  settings: AppSettings
}

const STORAGE_KEY = "syntara.state.v1"
const MAX_PERSIST_BYTES = 2_000_000

const seedModels: ModelMeta[] = [
  {
    id: "qwen-local",
    name: "Qwen family",
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
    id: "llama-local",
    name: "Llama family",
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
    id: "deepseek-local",
    name: "DeepSeek family",
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
    id: "mistral-local",
    name: "Mistral family",
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
  {
    id: "gemma-local",
    name: "Gemma family",
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
    id: "glm-local",
    name: "GLM family",
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
]

export function defaultState(): SyntaraState {
  return {
    schema: 1,
    conversations: [],
    memories: [],
    projects: [],
    agents: [],
    models: seedModels,
    downloads: [],
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
    },
  }
}

export function loadState(storage: Storage = localStorage): SyntaraState {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<SyntaraState>
    const base = defaultState()
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      models: parsed.models?.length ? parsed.models as ModelMeta[] : base.models,
      conversations: parsed.conversations || [],
      memories: parsed.memories || [],
      projects: parsed.projects || [],
      agents: parsed.agents || [],
      downloads: parsed.downloads || [],
    }
  } catch {
    return defaultState()
  }
}

export function saveState(state: SyntaraState, storage: Storage = localStorage) {
  try {
    const serialized = JSON.stringify(state)
    if (serialized.length <= MAX_PERSIST_BYTES) storage.setItem(STORAGE_KEY, serialized)
  } catch {
    // Restricted storage, quota, or private mode: local session continues.
  }
}

export function clearState(storage: Storage = localStorage) {
  try { storage.removeItem(STORAGE_KEY) } catch {}
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
    settings: { ...base.settings, ...(parsed.data.settings || {}) },
  }
}

export { STORAGE_KEY }
