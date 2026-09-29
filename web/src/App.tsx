import { useEffect, useMemo, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  ArrowUp,
  Bot,
  BrainCircuit,
  Boxes,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  Copy,
  Cpu,
  Database,
  Download,
  FileDown,
  FileUp,
  FolderOpen,
  Gauge,
  HardDrive,
  Link2,
  LoaderCircle,
  MemoryStick,
  MessageSquare,
  Moon,
  Package,
  PanelLeft,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Terminal,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react"
import { getHealth, listModels, streamChat, type ChatMessage, type HealthResponse, type StreamChatResult } from "@/lib/api"
import { createStreamedDownload, supportsSavePicker, type DownloadControl } from "@/lib/download"
import {
  addQdmDownload,
  friendlyQdmError,
  getQdmConfig,
  listenQdmEvents,
  listQdmDownloads,
  pauseQdmDownload,
  pickQdmFolder,
  qdmAvailable,
  qdmStatusToTaskState,
  removeQdmDownload,
  resumeQdmDownload,
  setQdmConfig,
} from "@/lib/native-download"
import { detectHardware, recommendationLabel, scoreModel } from "@/lib/model-hub"
import { formatBytes, formatEta } from "@/lib/format"
import { activeRequests, supportsCacheSlots } from "@/lib/runtime"
import { Markdown } from "@/components/Markdown"
import { ModelFamilyPage } from "@/components/ModelFamilyPage"
import { DownloadProgress, activeTasksFor } from "@/components/DownloadProgress"
import { catalogFileTarget, downloadableCheckpoints } from "@/lib/catalog-install"
import { modelCatalog } from "@/lib/model-catalog"
import {
  clearState,
  createId,
  defaultState,
  loadState,
  makeBackup,
  restoreBackup,
  saveState,
  type AppSettings,
  type Conversation,
  type DownloadTask,
  type MemoryItem,
  type ModelMeta,
  type ProjectItem,
  type StoredMessage,
  type SyntaraState,
} from "@/lib/syntara-state"
import { cn } from "@/lib/utils"

const message = (role: ChatMessage["role"], content: string, images?: string[]): ChatMessage => {
  let id: string
  try { id = crypto.randomUUID() } catch { id = `m_${Date.now()}_${Math.random().toString(16).slice(2)}` }
  return images?.length ? { id, role, content, images } : { id, role, content }
}

type View = "chat" | "agents" | "models" | "downloads" | "projects" | "memory" | "performance" | "developer" | "settings"
type ThemeMode = AppSettings["theme"]

const NAV: Array<{ id: View; label: string; icon: typeof MessageSquare }> = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "models", label: "Models", icon: Boxes },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "memory", label: "Memory", icon: BrainCircuit },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "developer", label: "Developer", icon: Code2 },
  { id: "settings", label: "Settings", icon: Settings2 },
]

/* Every workspace view is an addressable page (#models, #downloads, …) so
   deep links, refresh and browser back/forward work. Each model family is
   its own page too (#models/qwen-local). Hash routing keeps the links valid
   wherever the app is served (site /app/ subdir, Vercel, local preview)
   without server rewrites. */
function routeFromHash(): { view: View; family: string | null } {
  const [head, ...rest] = window.location.hash.replace(/^#\/?/, "").split("/")
  const view = NAV.some((item) => item.id === head) ? (head as View) : "chat"
  return { view, family: view === "models" && rest.length ? decodeURIComponent(rest.join("/")) : null }
}

const defaultAgent = {
  name: "Local Coding Agent",
  systemPrompt: "You are a careful local coding agent. Explain actions, request approval for risky operations, and keep changes inside the user workspace.",
  tools: ["filesystem", "terminal", "git", "tests"],
}

type RunMetrics = { kind: "chat" | "agent"; tokensPerSec: number; firstTokenMs: number; totalMs: number; tokens: number }

const helpItems: Array<{ q: string; a: string }> = [
  {
    q: "What is a runtime?",
    a: "A runtime is the local inference engine that loads a model and generates text. Syntara talks to it over a local OpenAI-compatible API. Start it from the desktop app or the `syntara serve` CLI; this dashboard is a client of that runtime, never a cloud.",
  },
  {
    q: "A model is not a runtime.",
    a: "Model files come in formats (GGUF, Safetensors, Hugging Face checkpoints) that different runtimes load differently. Check the model format and quantization against the runtime you have before installing a multi-gigabyte file.",
  },
  {
    q: "Where should my models live?",
    a: "On your own disk. The Downloads view streams files to a location you choose. Syntara never uploads your models or prompts anywhere by default.",
  },
  {
    q: "Why is my model slow?",
    a: "Usually CPU-only inference on a model larger than your memory budget. Re-run the GPU when available, prefer quantized builds (Q4–Q6), and watch the Performance view. A CPU fallback always works, it is just slower.",
  },
  {
    q: "How do I choose a compatible model?",
    a: "The Model Hub scores models against your detected hardware, but the score is guidance, not a guarantee. Confirm the format and quantization are loadable by your runtime before downloading.",
  },
  {
    q: "How do I remove a model?",
    a: "In Models, Detach removes the reference from your local hub. Delete removes its metadata. Files you already saved to disk are never auto-deleted by the web app.",
  },
  {
    q: "The runtime won't connect.",
    a: "Make sure a runtime is actually serving, that Settings → Local API base URL points at it (default http://127.0.0.1:8000/v1), and that no firewall blocks localhost. Runtimes bind to localhost by default for privacy.",
  },
]

function usePersistentState() {
  const [state, setState] = useState<SyntaraState>(() => loadState())
  const saveTimer = useRef<number | undefined>(undefined)
  useEffect(() => {
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => saveState(state), 150)
    return () => window.clearTimeout(saveTimer.current)
  }, [state])
  return [state, setState] as const
}

export default function App() {
  const [state, setState] = usePersistentState()
  const [route, setRoute] = useState(() => routeFromHash())
  const view = route.view
  /* Captured as a const so narrowing flows into the ModelFamilyPage callback. */
  const familyId = route.family
  const navigate = (target: View, family: string | null = null) => {
    const hash = family ? `${target}/${family}` : target
    setRoute({ view: target, family })
    if (window.location.hash.replace(/^#\/?/, "") !== hash) window.location.hash = hash
  }
  const setView = (next: View) => navigate(next)
  const openFamily = (id: string) => navigate("models", id)
  useEffect(() => {
    const sync = () => setRoute(routeFromHash())
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [])
  useEffect(() => {
    if (route.view === "models" && route.family) {
      const family = state.models.find((item) => item.id === route.family)
      document.title = family ? `${family.name} · Syntara` : "Model family · Syntara"
      return
    }
    const label = NAV.find((item) => item.id === route.view)?.label
    document.title = label && route.view !== "chat" ? `${label} · Syntara` : "Syntara"
  }, [route, state.models])
  const [apiKey, setApiKey] = useState("")
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [runtimeError, setRuntimeError] = useState("")
  const [models, setModels] = useState<string[]>([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [maxTokens, setMaxTokens] = useState(4096)
  const [temperature, setTemperature] = useState(0.7)
  const [query, setQuery] = useState("")
  const [modelSearch, setModelSearch] = useState("")
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null)
  const [memoryDraft, setMemoryDraft] = useState("")
  const [memorySearch, setMemorySearch] = useState("")
  const [agentPrompt, setAgentPrompt] = useState("")
  const [agentBusy, setAgentBusy] = useState(false)
  const [agentLog, setAgentLog] = useState<string[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [pendingDocs, setPendingDocs] = useState<Array<{ name: string; content: string }>>([])
  const [copied, setCopied] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const modelImportRef = useRef<HTMLInputElement>(null)
  const memoryImportRef = useRef<HTMLInputElement>(null)
  const backupRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const queryRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const downloadControls = useRef(new Map<string, DownloadControl>())
  /* Ids owned by the desktop engine's download queue (native rows never get a
     browser DownloadControl, so this set is what tells the controls apart). */
  const nativeDownloadIds = useRef(new Set<string>())
  const storageDirRef = useRef("")
  const [storageDir, setStorageDir] = useState("")
  const [setupOpen, setSetupOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  /* Re-download warning: a model this workspace finished downloading before
     gets one confirmation instead of silently pulling gigabytes again. */
  const [redownload, setRedownload] = useState<{ modelId: string; name: string } | null>(null)
  const redownloadResolver = useRef<((approved: boolean) => void) | null>(null)
  const redownloadPending = useRef<Promise<boolean> | null>(null)
  /* Once the user explicitly approves a repeat, later files of the same
     install (multi-shard checkpoints queue N rows) must not re-ask. */
  const redownloadApproved = useRef(new Set<string>())
  const [dragging, setDragging] = useState(false)
  const [metrics, setMetrics] = useState<RunMetrics | null>(null)

  const conversation = state.conversations.find((item) => item.id === selectedConversationId) || state.conversations[0]
  const activeConversation = conversation || null
  const selectedModel = state.settings.model || models[0] || ""
  const hardware = useMemo(() => detectHardware(health), [health])
  const filteredModels = useMemo(() => state.models.filter((model) => {
    const needle = modelSearch.trim().toLowerCase()
    return !needle || `${model.name} ${model.provider} ${model.architecture} ${model.capabilities.join(" ")}`.toLowerCase().includes(needle)
  }), [modelSearch, state.models])
  /* Live transfers of the open family page, rolled into one list for its
     header strip. */
  const familyActiveTasks = useMemo(() => familyId ? activeTasksFor(state.downloads.filter((task) => task.modelId === familyId)) : [], [familyId, state.downloads])

  const filteredMemories = useMemo(() => {
    const needle = memorySearch.trim().toLowerCase()
    if (!needle) return state.memories
    return state.memories.filter((item) => `${item.content} ${item.category}`.toLowerCase().includes(needle))
  }, [memorySearch, state.memories])

  const visibleConversations = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return state.conversations
    return state.conversations.filter((item) =>
      item.title.toLowerCase().includes(needle) ||
      item.messages.some((item) => item.content.toLowerCase().includes(needle)),
    )
  }, [query, state.conversations])

  const effectiveModel = activeConversation?.model || selectedModel

  useEffect(() => {
    const theme = state.settings.theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : state.settings.theme
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.reducedMotion = state.settings.reducedMotion ? "true" : "false"
  }, [state.settings.theme, state.settings.reducedMotion])

  useEffect(() => {
    if (!state.conversations.length) {
      const now = Date.now()
      setState((current) => ({
        ...current,
        conversations: [{ id: createId("chat"), title: "New conversation", model: selectedModel, messages: [], createdAt: now, updatedAt: now }],
      }))
    }
  }, [selectedModel, setState, state.conversations.length])

  const updateSettings = (patch: Partial<AppSettings>) => {
    setState((current) => ({ ...current, settings: { ...current.settings, ...patch } }))
  }

  const connect = async () => {
    if (!state.settings.baseUrl) return
    setConnecting(true)
    setRuntimeError("")
    try {
      const found = await listModels(state.settings.baseUrl, apiKey)
      setModels(found)
      if (!state.settings.model && found[0]) updateSettings({ model: found[0] })
      setHealth(await getHealth(state.settings.baseUrl, apiKey))
      setConnected(true)
      setRuntimeError("")
    } catch (error) {
      setConnected(false)
      setRuntimeError(error instanceof Error ? error.message : "Runtime unavailable")
    } finally {
      setConnecting(false)
    }
  }

  useEffect(() => {
    if (!connected) return
    const timer = window.setInterval(async () => {
      try { setHealth(await getHealth(state.settings.baseUrl, apiKey)) } catch { setConnected(false) }
    }, 5000)
    return () => window.clearInterval(timer)
  }, [connected, state.settings.baseUrl, apiKey])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.key >= "1" && event.key <= "9") {
        const target = NAV[Number(event.key) - 1]
        if (target) { event.preventDefault(); setView(target.id) }
        return
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        const active = document.activeElement
        if (active && /INPUT|TEXTAREA|SELECT/.test(active.tagName) && active !== queryRef.current) return
        event.preventDefault()
        if (state.settings.historyCollapsed) {
          updateSettings({ historyCollapsed: false })
          window.requestAnimationFrame(() => queryRef.current?.focus())
        } else {
          queryRef.current?.focus()
        }
        return
      }
      if (event.key === "Escape") {
        if (redownload) { settleRedownload(false); return }
        if (confirmReset) { setConfirmReset(false); return }
        if (selectedMemory) { setSelectedMemory(null); return }
        if (setupOpen) setSetupOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [confirmReset, redownload, selectedMemory, setupOpen, state.settings.historyCollapsed])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  /* Desktop shell only: restore the engine's persisted download list and pipe
     its events into local state. Rows are inserted here and in
     startUrlDownload; every engine event merely patches an existing row, so a
     record the UI never asked for can never duplicate or resurrect itself. */
  useEffect(() => {
    if (!qdmAvailable()) return
    let disposed = false
    let unlisten: (() => void) | undefined
    const forgetDownload = (id: string) => {
      nativeDownloadIds.current.delete(id)
      setState((current) => ({ ...current, downloads: current.downloads.filter((item) => item.id !== id) }))
    }
    void listenQdmEvents({
      onProgress: (progress) => patchDownloadIfPresent(progress.id, {
        state: qdmStatusToTaskState(progress.status),
        receivedBytes: progress.downloaded,
        progress: Math.min(100, Math.round(progress.progress)),
        speedBps: progress.speed > 0 ? progress.speed : undefined,
        etaMs: progress.eta > 0 ? progress.eta * 1000 : undefined,
      }),
      onStarted: (id) => patchDownloadIfPresent(id, { state: "downloading", error: undefined }),
      onPaused: (paused) => patchDownloadIfPresent(paused.id, { state: "paused", speedBps: undefined, etaMs: undefined }),
      onCancelled: forgetDownload,
      onRemoved: forgetDownload,
      onCompleted: (completed) => {
        setState((current) => {
          const row = current.downloads.find((entry) => entry.id === completed.id)
          const modelId = row?.modelId ?? ""
          const canMark = !!modelId && current.models.some((model) => model.id === modelId)
          const localPath = `${completed.savePath.replace(/[\\/]+$/, "")}/${completed.fileName}`
          const bytes = completed.downloaded > 0 ? completed.downloaded : completed.fileSize > 0 ? completed.fileSize : undefined
          return {
            ...current,
            downloads: current.downloads.map((entry) => entry.id === completed.id ? {
              ...entry,
              state: "complete" as const,
              progress: 100,
              receivedBytes: completed.downloaded || completed.fileSize,
              totalBytes: completed.fileSize > 0 ? completed.fileSize : entry.totalBytes,
              speedBps: undefined,
              etaMs: undefined,
              error: undefined,
              updatedAt: Date.now(),
            } : entry),
            models: canMark
              ? current.models.map((model) => model.id === modelId ? { ...model, status: "installed" as const, localPath, installedAt: Date.now() } : model)
              : current.models,
            downloadedModels: modelId
              ? { ...current.downloadedModels, [modelId]: { name: row?.name ?? completed.fileName, at: Date.now(), ...(bytes ? { bytes } : {}) } }
              : current.downloadedModels,
          }
        })
      },
      onFailed: (id, error) => patchDownloadIfPresent(id, { state: "error", error: friendlyQdmError(error), speedBps: undefined, etaMs: undefined }),
    }).then((fn) => { if (disposed) fn(); else unlisten = fn })

    void (async () => {
      try {
        const config = await getQdmConfig()
        if (disposed) return
        storageDirRef.current = config.downloadDir
        setStorageDir(config.downloadDir)
        const items = await listQdmDownloads()
        if (disposed) return
        /* `stopped` records are cancelled leftovers with nothing to resume. */
        items.filter((item) => item.status === "stopped").forEach((item) => { void removeQdmDownload(item.id, false).catch(() => {}) })
        const active = items.filter((item) => item.status !== "stopped")
        active.forEach((item) => nativeDownloadIds.current.add(item.id))
        setState((current) => {
          const activeById = new Map(active.map((item) => [item.id, item] as const))
          const engineIds = new Set(items.map((item) => item.id))
          const synced: DownloadTask[] = []
          for (const prior of current.downloads) {
            if (!engineIds.has(prior.id)) { synced.push(prior); continue }
            const engineItem = activeById.get(prior.id)
            if (!engineItem) continue
            synced.push({
              ...prior,
              name: engineItem.fileName,
              url: engineItem.url,
              state: qdmStatusToTaskState(engineItem.status),
              progress: Math.min(100, Math.round(engineItem.progress)),
              receivedBytes: engineItem.downloaded,
              totalBytes: engineItem.fileSize > 0 ? engineItem.fileSize : prior.totalBytes,
              error: engineItem.error ?? undefined,
              speedBps: engineItem.status === "downloading" && engineItem.speed > 0 ? engineItem.speed : undefined,
              etaMs: engineItem.status === "downloading" && engineItem.eta > 0 ? engineItem.eta * 1000 : undefined,
              updatedAt: Date.now(),
            })
          }
          for (const engineItem of active) {
            if (current.downloads.some((row) => row.id === engineItem.id)) continue
            synced.push({
              id: engineItem.id,
              modelId: "",
              name: engineItem.fileName,
              url: engineItem.url,
              state: qdmStatusToTaskState(engineItem.status),
              progress: Math.min(100, Math.round(engineItem.progress)),
              receivedBytes: engineItem.downloaded,
              totalBytes: engineItem.fileSize > 0 ? engineItem.fileSize : undefined,
              error: engineItem.error ?? undefined,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            })
          }
          return { ...current, downloads: synced }
        })
      } catch { /* engine unreachable — browser-mode rows stay untouched */ }
    })()

    return () => {
      disposed = true
      unlisten?.()
    }
  }, [])

  const saveConversation = (next: Conversation) => {
    setState((current) => ({
      ...current,
      conversations: current.conversations.map((item) => item.id === next.id ? next : item),
    }))
  }

  const startConversation = () => {
    const now = Date.now()
    const next: Conversation = { id: createId("chat"), title: "New conversation", model: selectedModel, messages: [], createdAt: now, updatedAt: now }
    setState((current) => ({ ...current, conversations: [next, ...current.conversations] }))
  }

  const sendAs = async (text: string, images: string[], base?: Conversation, docs: Array<{ name: string; content: string }> = pendingDocs) => {
    if (loading) return
    const current = base || activeConversation || state.conversations[0]
    if (!current) return
    let textOut = text.trim()
    let imagesOut = images
    let docsOut = docs
    if (!textOut && !imagesOut.length && !docsOut.length) {
      if (!base) return
      // Regenerate mode: re-send the last user turn without a new draft.
      const lastUser = [...current.messages].reverse().find((item) => item.role === "user")
      if (!lastUser) return
      textOut = lastUser.content
      imagesOut = lastUser.images || []
      docsOut = lastUser.docs || []
    }
    const model = current.model || selectedModel
    if (!model) {
      setRuntimeError("Choose a model before sending. Inference runs entirely on your machine.")
      return
    }
    const userMessage: StoredMessage = { ...message("user", textOut, imagesOut), docs: docsOut.length ? docsOut : undefined }
    const assistantMessage = message("assistant", "")
    const systemPreamble: ChatMessage[] = current.systemPrompt?.trim() ? [message("system", current.systemPrompt.trim())] : []
    const memoryContext: ChatMessage[] = state.settings.memoryEnabled && state.memories.length
      ? [message("system", `The following are user-approved local memories. Use them only when relevant and never invent additional memories:\n${state.memories.slice(0, 50).map((item) => `- ${item.content}`).join("\n")}`)]
      : []
    // Attached documents travel verbatim in the request; the stored transcript keeps
    // them on the message so regenerations can resend the exact same content.
    const expandDocs = (item: StoredMessage): ChatMessage => {
      const content = item.docs?.length
        ? `${item.content}\n\n${item.docs.map((doc) => `[Attached file: ${doc.name}]\n${doc.content}`).join("\n\n")}`
        : item.content
      return item.images?.length ? { id: item.id, role: item.role, content, images: item.images } : { id: item.id, role: item.role, content }
    }
    const requestMessages: ChatMessage[] = [...systemPreamble, ...memoryContext, ...current.messages.map(expandDocs), expandDocs(userMessage)]
    const storedMessages: StoredMessage[] = [...current.messages, userMessage, assistantMessage]
    const initial: Conversation = {
      ...current,
      model,
      title: current.messages.length ? current.title : (textOut.slice(0, 48) || "Image conversation"),
      messages: storedMessages,
      updatedAt: Date.now(),
    }
    saveConversation(initial)
    setDraft("")
    setPendingImages([])
    setPendingDocs([])
    setLoading(true)
    const started = performance.now()
    let tokenCount = 0
    let firstTokenAt: number | null = null
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const result: StreamChatResult = await streamChat({
        baseUrl: state.settings.baseUrl,
        apiKey,
        model,
        messages: requestMessages,
        temperature,
        maxTokens,
        enableThinking: thinking,
        cacheSlot: current.cacheSlot,
        signal: controller.signal,
        onDelta: (delta) => {
          if (firstTokenAt === null) firstTokenAt = performance.now()
          tokenCount += 1
          setRuntimeError("")
          saveConversation({
            ...initial,
            messages: initial.messages.map((item) => item.id === assistantMessage.id ? { ...item, content: `${item.content}${delta}` } : item),
            updatedAt: Date.now(),
          })
        },
      })
      const totalMs = performance.now() - started
      const tokensPerSec = totalMs > 100 && tokenCount > 0 ? Math.round((tokenCount / (totalMs / 1000)) * 10) / 10 : 0
      setMetrics({ kind: "chat", tokensPerSec, firstTokenMs: firstTokenAt !== null ? firstTokenAt - started : 0, totalMs, tokens: tokenCount })
      if (result.usage) {
        setAgentLog((currentLog) => currentLog.slice(-29).concat(`Last chat: ${result.usage?.completion_tokens ?? 0} completion tokens`))
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setRuntimeError(error instanceof Error ? error.message : "Request failed")
        saveConversation({
          ...initial,
          messages: initial.messages.map((item) => item.id === assistantMessage.id ? { ...item, content: "I couldn't reach the local runtime. Check Developer → Runtime or Settings." } : item),
          updatedAt: Date.now(),
        })
      }
    } finally {
      abortRef.current = null
      setLoading(false)
    }
  }

  const send = () => void sendAs(draft.trim(), pendingImages, undefined, pendingDocs)

  const abortGeneration = () => abortRef.current?.abort()

  const regenerateLast = (conversationId: string, messageId: string) => {
    const conv = state.conversations.find((item) => item.id === conversationId)
    if (!conv) return
    const index = conv.messages.findIndex((item) => item.id === messageId)
    if (index < 1) return
    const target = conv.messages[index - 1]
    if (target.role !== "user") return
    const history = conv.messages.slice(0, index - 1)
    setSelectedConversationId(conv.id)
    void sendAs(target.content, target.images || [], { ...conv, messages: history, updatedAt: Date.now() }, target.docs || [])
  }

  const editMessage = (conversationId: string, messageId: string) => {
    const conv = state.conversations.find((item) => item.id === conversationId)
    if (!conv) return
    const index = conv.messages.findIndex((item) => item.id === messageId)
    if (index === -1) return
    const target = conv.messages[index]
    const base: Conversation = { ...conv, messages: conv.messages.slice(0, index), updatedAt: Date.now() }
    saveConversation(base)
    setSelectedConversationId(conv.id)
    setDraft(target.content)
    setPendingImages(target.images || [])
    setPendingDocs(target.docs || [])
    setSetupOpen(false)
    window.setTimeout(() => messageRef.current?.focus(), 0)
  }

  const exportConversation = (conv: Conversation) => {
    const slug = conv.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "conversation"
    const payload = {
      kind: "syntara-conversation",
      schema: 1,
      exportedAt: new Date().toISOString(),
      title: conv.title,
      model: conv.model,
      systemPrompt: conv.systemPrompt || "",
      cacheSlot: conv.cacheSlot ?? null,
      messages: conv.messages.map((item) => ({ id: item.id, role: item.role, content: item.content, images: item.images, docs: item.docs })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `syntara-${slug}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const attachImages = async (files: FileList | File[] | null) => {
    const images = Array.from(files || []).filter((file) => file.type.startsWith("image/"))
    if (!images.length) return
    const read = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
    try { const urls = await Promise.all(images.map(read)); setPendingImages((current) => [...current, ...urls]) } catch { setRuntimeError("Image import failed") }
  }

  const TEXT_DOC_EXTENSIONS = /\.(txt|md|markdown|csv|json|log|py|js|jsx|ts|tsx|html|htm|css|scss|yml|yaml|toml|ini|xml|sh|sql)$/i
  const MAX_DOC_BYTES = 262_144

  const isTextDocument = (file: File) => TEXT_DOC_EXTENSIONS.test(file.name) || file.type === "text/plain" || file.type.startsWith("text/")

  const attachDocuments = async (files: File[]) => {
    const accepted = files.filter(isTextDocument)
    const docs: Array<{ name: string; content: string }> = []
    for (const file of accepted) {
      if (file.size > MAX_DOC_BYTES) { setRuntimeError(`Attachment "${file.name}" is larger than 256 KB; skipped.`); continue }
      try { docs.push({ name: file.name, content: await file.text() }) } catch { setRuntimeError(`Could not read attachment "${file.name}".`) }
    }
    if (docs.length) setPendingDocs((current) => [...current, ...docs])
  }

  const handleAttach = (files: FileList | null) => {
    const list = Array.from(files || [])
    void attachImages(list.filter((file) => file.type.startsWith("image/")))
    void attachDocuments(list.filter((file) => !file.type.startsWith("image/")))
  }

  const createMemory = () => {
    const text = memoryDraft.trim()
    if (!text) return
    const now = Date.now()
    setState((current) => ({
      ...current,
      memories: [{ id: createId("mem"), content: text, category: "other", createdAt: now, updatedAt: now }, ...current.memories],
    }))
    setMemoryDraft("")
  }

  const updateMemory = () => {
    if (!selectedMemory || !memoryDraft.trim()) return
    setState((current) => ({ ...current, memories: current.memories.map((item) => item.id === selectedMemory.id ? { ...item, content: memoryDraft.trim(), updatedAt: Date.now() } : item) }))
    setSelectedMemory(null)
    setMemoryDraft("")
  }

  const removeMemory = (id: string) => setState((current) => ({ ...current, memories: current.memories.filter((item) => item.id !== id) }))

  const exportMemories = () => {
    const payload = {
      kind: "syntara-memory-export",
      schema: 1,
      exportedAt: new Date().toISOString(),
      memories: state.memories,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `syntara-memories-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importMemories = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as { memories?: Array<{ id: string; content: string; category?: MemoryItem["category"]; createdAt?: number; updatedAt?: number }> }
      if (!Array.isArray(parsed.memories) || !parsed.memories.every((item) => item && typeof item.id === "string" && typeof item.content === "string")) {
        throw new Error("Invalid memory export file")
      }
      const now = Date.now()
      const imported = parsed.memories.map((item) => ({ id: item.id, content: item.content, category: item.category ?? "other", createdAt: item.createdAt ?? now, updatedAt: item.updatedAt ?? now }))
      setState((current) => ({ ...current, memories: [...imported, ...current.memories] }))
      setMemorySearch("")
      setRuntimeError("")
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : "Memory import failed")
    }
  }

  const createProject = () => {
    const now = Date.now()
    const project: ProjectItem = { id: createId("project"), name: `Project ${state.projects.length + 1}`, description: "Local AI workspace", memoryIds: [], createdAt: now, updatedAt: now }
    setState((current) => ({ ...current, projects: [project, ...current.projects], settings: { ...current.settings, selectedProjectId: project.id } }))
    updateSettings({ selectedProjectId: project.id })
  }

  const createAgent = () => {
    const now = Date.now()
    setState((current) => ({ ...current, agents: [{ id: createId("agent"), ...defaultAgent, createdAt: now, updatedAt: now }, ...current.agents] }))
  }

  const runAgent = async () => {
    const text = agentPrompt.trim()
    const model = activeConversation?.model || selectedModel
    if (!text || agentBusy) return
    if (!model) {
      setRuntimeError("Choose a model before running the agent.")
      return
    }
    setAgentBusy(true)
    const started = performance.now()
    setAgentLog((log) => [
      `Task received: ${text.slice(0, 96)}${text.length > 96 ? "…" : ""}`,
      `Model: ${model}`,
      "Web agent scope: the local model plans and answers here; file, shell and git tools stay gated to the desktop runtime.",
      ...log,
    ].slice(0, 40))
    const agent = state.agents[0]
    let acc = ""
    const controller = new AbortController()
    abortRef.current = controller
    const pushStream = (delta: string) => {
      acc += delta
      const lines = acc.split("\n")
      acc = lines.pop() ?? ""
      if (lines.length) setAgentLog((log) => [...lines.filter((line) => line.trim() !== "").map((line) => `  ${line.trimEnd()}`), ...log].slice(0, 40))
    }
    try {
      const result: StreamChatResult = await streamChat({
        baseUrl: state.settings.baseUrl,
        apiKey,
        model,
        messages: [message("system", agent?.systemPrompt || defaultAgent.systemPrompt), message("user", text)],
        temperature: 0.2,
        maxTokens,
        enableThinking: true,
        signal: controller.signal,
        onDelta: pushStream,
      })
      if (acc.trim()) setAgentLog((log) => [`  ${acc.trimEnd()}`, ...log].slice(0, 40))
      const totalMs = performance.now() - started
      const tokens = result.usage?.completion_tokens ?? 0
      const tokensPerSec = totalMs > 100 && tokens > 0 ? Math.round((tokens / (totalMs / 1000)) * 10) / 10 : 0
      setMetrics({ kind: "agent", tokensPerSec, firstTokenMs: 0, totalMs, tokens })
      setAgentLog((log) => [
        `Completed in ${(totalMs / 1000).toFixed(1)}s${tokensPerSec > 0 ? ` · ${tokensPerSec} tok/s (${tokens} tokens)` : ""}. Next step: open the desktop runtime to approve real file, shell and git tools.`,
        ...log,
      ].slice(0, 40))
    } catch (error) {
      if (!controller.signal.aborted) {
        setAgentLog((log) => [`Error: ${error instanceof Error ? error.message : "Request failed"}`, ...log].slice(0, 40))
      }
    } finally {
      abortRef.current = null
      setAgentBusy(false)
    }
  }

  const patchDownload = (id: string, partial: Partial<DownloadTask>) => {
    setState((current) => ({
      ...current,
      downloads: current.downloads.map((item) => item.id === id ? { ...item, ...partial, updatedAt: Date.now() } : item),
    }))
  }

  /* Engine events can arrive for rows this session never created (records
     restored from disk, rows already trashed); those must not resurrect. */
  const patchDownloadIfPresent = (id: string, partial: Partial<DownloadTask>) => {
    setState((current) => current.downloads.some((item) => item.id === id)
      ? { ...current, downloads: current.downloads.map((item) => item.id === id ? { ...item, ...partial, updatedAt: Date.now() } : item) }
      : current)
  }

  const dropDownload = (id: string) => {
    const current = downloadControls.current.get(id)
    downloadControls.current.delete(id)
    current?.cancel()
    if (nativeDownloadIds.current.has(id)) {
      nativeDownloadIds.current.delete(id)
      /* deleteFile=false keeps completed files on disk; the engine cancels any
         running transfer itself and purges only its segment records. */
      void removeQdmDownload(id, false).catch(() => {})
    }
    setState((currentState) => ({ ...currentState, downloads: currentState.downloads.filter((item) => item.id !== id) }))
  }

  /* Model Hub installs pass through here once per batch: a model this
     workspace already finished downloading asks for confirmation, and every
     shard queued after an approval reuses that answer. */
  const guardRedownload = (modelId: string, name: string): Promise<boolean> => {
    if (!state.downloadedModels[modelId] || redownloadApproved.current.has(modelId)) return Promise.resolve(true)
    if (redownloadPending.current) return redownloadPending.current
    redownloadPending.current = new Promise<boolean>((resolve) => {
      redownloadResolver.current = resolve
      setRedownload({ modelId, name })
    })
    return redownloadPending.current
  }

  const settleRedownload = (approved: boolean) => {
    const target = redownload
    if (approved && target) redownloadApproved.current.add(target.modelId)
    const resolve = redownloadResolver.current
    redownloadResolver.current = null
    redownloadPending.current = null
    setRedownload(null)
    resolve?.(approved)
  }

  /* Recorded the moment a transfer finishes, so the memory survives trashing
     the download row and can warn before a duplicate pull. */
  const markDownloaded = (modelId: string, name: string, bytes?: number) => {
    if (!modelId) return
    setState((current) => ({
      ...current,
      downloadedModels: { ...current.downloadedModels, [modelId]: { name, at: Date.now(), ...(bytes ? { bytes } : {}) } },
    }))
  }

  /* Every download funnels through here: callers pass a URL they read from
     catalog data, so no view ever has to render a direct download link. The
     save name comes from the caller (repo-prefixed) or the URL itself. */
  const startUrlDownload = async (modelId: string, name: string, url: string, filename?: string) => {
    if (!url) return
    const id = createId("dl")
    const fromUrl = decodeURIComponent((url.split("/").pop() || "model.bin").split("?")[0]) || "model.bin"
    const file = filename || fromUrl

    /* Desktop shell: hand the transfer to the native engine. A temp row shows
       immediately; its id is swapped for the engine's id once add resolves,
       and engine events only ever patch rows — never insert them. */
    if (qdmAvailable()) {
      setState((current) => ({
        ...current,
        downloads: [{ id, modelId, name, url, state: "queued" as const, progress: 0, receivedBytes: 0, createdAt: Date.now(), updatedAt: Date.now() }, ...current.downloads],
      }))
      try {
        const item = await addQdmDownload({ url, fileName: file, savePath: storageDirRef.current || undefined, autoStart: true })
        nativeDownloadIds.current.add(item.id)
        patchDownload(id, { id: item.id, state: qdmStatusToTaskState(item.status), receivedBytes: item.downloaded, totalBytes: item.fileSize > 0 ? item.fileSize : undefined })
      } catch (error) {
        patchDownload(id, { state: "error", error: error instanceof Error ? error.message : friendlyQdmError(String(error)) })
      }
      return
    }
    setState((current) => ({
      ...current,
      downloads: [{ id, modelId, name, url, state: "downloading" as const, progress: 0, receivedBytes: 0, createdAt: Date.now(), updatedAt: Date.now() }, ...current.downloads],
    }))
    try {
      let lastSampleAt = Date.now()
      let lastSampleBytes = 0
      const control = await createStreamedDownload(url, file, {
        onProgress: (received, total) => {
          const now = Date.now()
          const dt = now - lastSampleAt
          let speed: number | undefined
          let eta: number | undefined
          if (dt > 0 && received >= lastSampleBytes && received > 0) {
            speed = ((received - lastSampleBytes) * 1000) / dt
            lastSampleAt = now
            lastSampleBytes = received
          }
          if (speed && total && received < total && speed > 0) eta = ((total - received) / speed) * 1000
          patchDownload(id, { receivedBytes: received, totalBytes: total ?? undefined, progress: total ? Math.min(100, Math.round((received / total) * 100)) : 0, speedBps: speed, etaMs: eta })
        },
        onState: (state, note) => {
          if (state === "downloading") patchDownload(id, { state: "downloading", error: undefined })
          else if (state === "paused") patchDownload(id, { state: "paused", speedBps: undefined, etaMs: undefined })
          else if (state === "restarting") patchDownload(id, { receivedBytes: 0, progress: 0 })
          else if (state === "complete") { patchDownload(id, { state: "complete", progress: 100, error: undefined, speedBps: undefined, etaMs: undefined }); markDownloaded(modelId, name); downloadControls.current.delete(id) }
          else if (state === "error") { patchDownload(id, { state: "error", error: note, speedBps: undefined, etaMs: undefined }); downloadControls.current.delete(id) }
          else if (state === "cancelled") dropDownload(id)
        },
      })
      if (!control) {
        patchDownload(id, { state: "error", error: "No file location was chosen, so nothing was downloaded." })
        return
      }
      downloadControls.current.set(id, control)
    } catch (error) {
      patchDownload(id, { state: "error", error: error instanceof Error ? error.message : "Could not start the download." })
    }
  }

  /* Card Install: a family with exactly one downloadable checkpoint queues all
     of its files in one click and shows live progress right on the card; larger
     families open the family page so the user picks a checkpoint instead of
     pulling every variant in the catalog. Families without catalog data keep
     the legacy direct-URL download. */
  const startDownload = async (model: ModelMeta) => {
    if (!(await guardRedownload(model.id, model.name))) return
    if (!modelCatalog[model.id]?.length) {
      void startUrlDownload(model.id, model.name, model.downloadUrl || model.sourceUrl)
      return
    }
    const checkpoints = downloadableCheckpoints(model.id)
    if (checkpoints.length !== 1) { openFamily(model.id); return }
    const [checkpoint] = checkpoints
    checkpoint.files.forEach((file) => {
      const { name, filename } = catalogFileTarget(checkpoint, file)
      void startUrlDownload(model.id, name, file.url, filename)
    })
  }

  const pauseDownload = (id: string) => {
    const control = downloadControls.current.get(id)
    if (control) { control.pause(); return }
    /* Native rows get their state back from `download:paused`. */
    if (nativeDownloadIds.current.has(id)) void pauseQdmDownload(id).catch(() => {})
  }
  const resumeDownload = (id: string) => {
    const control = downloadControls.current.get(id)
    if (control) { control.resume(); return }
    if (nativeDownloadIds.current.has(id)) void resumeQdmDownload(id).catch(() => {})
  }
  const cancelDownload = (id: string) => {
    downloadControls.current.get(id)?.cancel()
    dropDownload(id)
  }

  const changeStorageDir = async () => {
    if (!qdmAvailable()) return
    try {
      const picked = await pickQdmFolder()
      if (!picked) return
      const config = await setQdmConfig({ downloadDir: picked })
      storageDirRef.current = config.downloadDir
      setStorageDir(config.downloadDir)
    } catch { /* dialog dismissed or engine unavailable */ }
  }

  const installImportedModel = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    const now = Date.now()
    const id = createId("import")
    const model: ModelMeta = {
      id,
      name: file.name,
      provider: "Imported locally",
      architecture: "Auto-detect at runtime",
      parameters: "Unknown until inspected",
      formats: [file.name.endsWith(".gguf") ? "GGUF" : file.name.endsWith(".safetensors") ? "Safetensors" : "Detected on import"],
      quantizations: ["Automatic inspection"],
      capabilities: ["Compatibility analysis pending"],
      context: "Unknown",
      sourceUrl: "local://import",
      recommendedRam: "Analyze locally",
      recommendedVram: "Analyze locally",
      disk: formatBytes(file.size),
      status: "installed",
      localPath: file.name,
      installedAt: now,
    }
    setState((current) => ({ ...current, models: [model, ...current.models] }))
    setView("models")
  }

  const detachModel = (id: string) => {
    setState((current) => ({ ...current, models: current.models.map((item) => item.id === id ? { ...item, status: "detached" } : item) }))
  }

  const deleteModel = (id: string) => {
    setState((current) => ({
      ...current,
      models: current.models.filter((item) => item.id !== id),
      settings: current.settings.model === id ? { ...current.settings, model: "" } : current.settings,
    }))
  }

  const exportBackup = () => {
    const backup = makeBackup(state)
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `syntara-${new Date().toISOString().slice(0, 10)}.syntara-backup`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importBackup = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    try {
      const restored = await restoreBackup(file)
      setState(restored)
      setRuntimeError("")
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : "Backup restore failed")
    }
  }

  const copy = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); window.setTimeout(() => setCopied(null), 1200) } catch {}
  }

  const runtimeStatus = connected ? "Running locally" : "Not connected"

  return (
    <div className={cn("syntara-shell", state.settings.navCollapsed && "nav-collapsed")}>
      <aside className="syntara-sidebar">
        <div className="brand-lockup">
          <img src="/syntara-logo.png" alt="Syntara" className="brand-mark" />
          <div><div className="brand-name">Syntara</div><div className="brand-by">By NDe</div></div>
        </div>

        <button className="new-chat" onClick={startConversation}><Plus size={16} /> <span>New chat</span></button>
        <div className="nav-section">
          <div className="nav-label">Workspace</div>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} className={cn("nav-item", view === id && "active")} onClick={() => setView(id)}>
              <Icon size={16} /> <span>{label}</span>
              {id === "downloads" && state.downloads.some((item) => item.state === "downloading") ? <span className="nav-dot" /> : null}
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <button className="runtime-chip" onClick={() => setView("developer")} title="Open runtime controls" aria-label="Open runtime controls">
            <span className={cn("status-light", connected && "on")} />
            <div><strong>{runtimeStatus}</strong><small>localhost only by default</small></div>
          </button>
          <div className="sidebar-mini-actions">
            <button onClick={() => updateSettings({ theme: state.settings.theme === "dark" ? "light" : "dark" })} title={state.settings.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} aria-label={state.settings.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
              {state.settings.theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={() => setView("settings")} title="Settings" aria-label="Settings"><Settings2 size={15} /></button>
          </div>
        </div>
      </aside>

      <main className="syntara-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn" onClick={() => updateSettings({ navCollapsed: !state.settings.navCollapsed })} title={state.settings.navCollapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label={state.settings.navCollapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!state.settings.navCollapsed}>
              <PanelLeft size={17} />
            </button>
            <div>
              <span className="eyebrow">{NAV.find((item) => item.id === view)?.label}</span>
              <div className="runtime-inline"><span className={cn("status-light", connected && "on")} /> {selectedModel || "No model selected"}</div>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="ghost-btn" onClick={connect} disabled={connecting}><RefreshCw className={connecting ? "spin" : ""} size={15} /> {connecting ? "Connecting" : "Connect runtime"}</button>
            <button className="icon-btn" onClick={() => setView("settings")} title="Settings" aria-label="Settings"><Settings2 size={17} /></button>
          </div>
        </header>

        {runtimeError && <div className="error-strip"><span><CircleHelp size={15} /> {runtimeError}</span><button onClick={() => setRuntimeError("")}><X size={14} /></button></div>}

        {view === "chat" && (
          <section className={cn("view chat-view", state.settings.historyCollapsed && "history-collapsed")}>
            <div className="chat-toolbar">
              <div className="toolbar-left">
                <button className="icon-btn" onClick={() => updateSettings({ historyCollapsed: !state.settings.historyCollapsed })} title={state.settings.historyCollapsed ? "Show conversation history" : "Hide conversation history"} aria-label={state.settings.historyCollapsed ? "Show conversation history" : "Hide conversation history"} aria-expanded={!state.settings.historyCollapsed}>
                  <PanelLeft size={16} />
                </button>
                <div className="model-selector">
                <Package size={15} />
                <select value={effectiveModel} onChange={(event) => { updateSettings({ model: event.target.value }); if (activeConversation) saveConversation({ ...activeConversation, model: event.target.value }) }}>
                  <option value="">Select a model</option>
                  {models.map((item) => <option key={item} value={item}>{item}</option>)}
                  {state.models.filter((item) => item.status === "installed").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                  <ChevronDown size={14} />
                </div>
              </div>
              <div className="chat-tools">
                <button className={cn("tool-pill", thinking && "selected")} onClick={() => setThinking((value) => !value)}><Sparkles size={14} /> Reasoning</button>
                <button className="tool-pill" onClick={() => fileRef.current?.click()}><Upload size={14} /> Attach</button><button className={cn("tool-pill", setupOpen && "selected")} onClick={() => setSetupOpen((value) => !value)}><Settings2 size={14} /> Setup</button>{activeConversation ? <button className="tool-pill" onClick={() => exportConversation(activeConversation)}><FileDown size={14} /> Export</button> : null}
                <input ref={fileRef} hidden type="file" accept="image/*,.txt,.md,.markdown,.csv,.json,.log,.py,.js,.jsx,.ts,.tsx,.html,.htm,.css,.scss,.yml,.yaml,.toml,.ini,.xml,.sh,.sql" multiple onChange={(event) => handleAttach(event.target.files)} />
              </div>
            </div>

            {setupOpen && activeConversation ? (
              <div className="setup-panel">
                <label className="field-label">System prompt<textarea className="setup-prompt" value={activeConversation.systemPrompt ?? ""} onChange={(e) => saveConversation({ ...activeConversation, systemPrompt: e.target.value })} placeholder="Optional model-level instructions for this conversation only. Applied on every request." /></label>
                <label className="field-label">KV cache slot<input type="number" min={0} step={1} value={activeConversation.cacheSlot ?? ""} placeholder="Auto" onChange={(e) => saveConversation({ ...activeConversation, cacheSlot: e.target.value === "" ? undefined : Math.max(0, Math.floor(Number(e.target.value))) })} /></label>
                <label className="field-label">Temperature<span className="range-value">{temperature.toFixed(2)}</span><input type="range" min={0} max={2} step={0.05} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} /></label>
                <label className="field-label">Max tokens<input type="number" min={1} step={1} value={maxTokens} onChange={(e) => setMaxTokens(Math.max(1, Math.floor(Number(e.target.value) || 1)))} /></label>
                <p className="panel-note">KV slots share the runtime's prompt cache. Temperature and token limits apply to this conversation's next generation.</p>
              </div>
            ) : null}

            <div className="conversation-list">
              <div className="conversation-search"><Search size={13} /><input ref={queryRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conversations… (Ctrl+K)" /></div>
              {visibleConversations.slice(0, 24).map((item) => (
                <button key={item.id} className={cn("conversation-card", activeConversation?.id === item.id && "selected")} onClick={() => {
                  setSelectedConversationId(item.id)
                }}>
                  <MessageSquare size={15} /> <span>{item.title}</span>
                </button>
              ))}
              {query.trim() && !visibleConversations.length ? <div className="empty-mini">No matching conversations.</div> : null}
            </div>

            <div className="chat-stage">
              {!activeConversation?.messages.length ? (
                <div className="welcome">
                  <img src="/syntara-logo.png" alt="" className="welcome-logo" />
                  <div className="welcome-kicker">Local AI, engineered around your machine.</div>
                  <h1>Build, chat, and run AI <span>locally.</span></h1>
                  <p>Universal model workflows, memory-aware execution, and agent tooling — with no account required.</p>
                  <div className="suggestion-grid">
                    {["Explain a hard concept simply", "Review a codebase architecture", "Plan a local AI workflow", "Compare two model configurations"].map((prompt) => <button key={prompt} onClick={() => setDraft(prompt)}>{prompt}<ArrowUp size={13} /></button>)}
                  </div>
                </div>
              ) : (
                <div className="messages">
                  {activeConversation.messages.map((item) => (
                    <article key={item.id} className={cn("message", item.role)}>
                      <div className="message-avatar">{item.role === "assistant" ? <img src="/syntara-logo.png" alt="" /> : "You"}</div>
                      <div className="message-body">
                        <div className="message-role">{item.role === "assistant" ? "Syntara" : "You"}</div>
                        {item.images?.length ? <div className="image-strip">{item.images.map((url) => <img key={url} src={url} alt="Attached" />)}</div> : null}
                        {item.docs?.length ? <div className="pending-strip docs-inline">{item.docs.map((doc) => <span key={doc.name} className="doc-chip"><FileUp size={11} /> {doc.name}</span>)}</div> : null}
                        <div className={cn("message-content", item.role === "assistant" && "md-wrap")}>{item.content
                          ? item.role === "assistant" ? <Markdown text={item.content} /> : item.content
                          : (loading && item.role === "assistant" ? <span className="typing"><i /><i /><i /></span> : "")}</div>
                        {item.content ? (
                          <div className="message-actions">
                            <button className="icon-btn" onClick={() => copy(item.content, `mc_${item.id}`)} title="Copy message" aria-label="Copy message">{copied === `mc_${item.id}` ? <Check size={13} /> : <Copy size={13} />}</button>
                            {item.role === "assistant" ? <button className="icon-btn" onClick={() => regenerateLast(activeConversation.id, item.id)} title="Regenerate answer" aria-label="Regenerate answer"><RefreshCw size={13} /></button> : null}
                            {item.role === "user" ? <button className="icon-btn" onClick={() => editMessage(activeConversation.id, item.id)} title="Edit and resend" aria-label="Edit and resend"><Pencil size={13} /></button> : null}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="composer-area">
              {pendingImages.length ? <div className="pending-strip">{pendingImages.map((url) => <div key={url} className="pending-image"><img src={url} alt="" /><button onClick={() => setPendingImages((items) => items.filter((item) => item !== url))}><X size={12} /></button></div>)}</div> : null}
              {pendingDocs.length ? <div className="pending-strip">{pendingDocs.map((doc) => <div key={doc.name} className="pending-doc"><FileUp size={12} /><span>{doc.name}</span><button onClick={() => setPendingDocs((items) => items.filter((item) => item.name !== doc.name))}><X size={12} /></button></div>)}</div> : null}
              <div className="composer">
                <textarea ref={messageRef} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={selectedModel ? "Message Syntara…" : "Choose a model to start"} aria-label="Message" disabled={!selectedModel || loading} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send() } }} />
                <div className="composer-foot">
                  <div className="composer-hint"><SlidersHorizontal size={12} /> {thinking ? "Reasoning on" : "Direct generation"} · {maxTokens.toLocaleString()} max tokens · {temperature.toFixed(2)} temp{metrics && metrics.tokensPerSec > 0 ? ` · ${metrics.tokensPerSec.toFixed(1)} tok/s` : ""}</div>
                  <button className={cn("send-btn", loading && "stop")} onClick={() => { if (loading) abortGeneration(); else void send() }} disabled={!selectedModel || (!loading && !draft.trim() && !pendingImages.length && !pendingDocs.length)} aria-label={loading ? "Stop generating" : "Send message"}>{loading ? <X size={17} /> : <ArrowUp size={17} />}</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "agents" && <section className="view scroll-view">
          <div className="hero-panel agent-hero"><div><span className="section-kicker">AGENT MODE</span><h2>Local agents that can actually work.</h2><p>Build Codex/Claude-Code/Qwen-Code-style workflows around your local models, with explicit permissions and a controlled workspace.</p></div><button className="primary-btn" onClick={createAgent}><Plus size={15} /> New agent</button></div>
          <div className="two-col">
            <div className="card-panel"><div className="panel-title"><span>Task</span><span className="permission-chip"><ShieldCheck size={13} /> Permission-gated</span></div><textarea className="large-input" value={agentPrompt} onChange={(e) => setAgentPrompt(e.target.value)} placeholder="e.g. Audit this repository, propose fixes, run tests, and show me the diff." /><button className="primary-btn" onClick={() => void runAgent()} disabled={!agentPrompt.trim() || agentBusy}>{agentBusy ? <LoaderCircle className="spin" size={15} /> : <Play size={15} />} {agentBusy ? "Planning…" : "Run agent"}</button></div>
            <div className="card-panel"><div className="panel-title"><span>Execution log</span><Activity size={15} /></div><div className="agent-log">{agentLog.length ? agentLog.map((line, i) => <div key={`${line}-${i}`}><span>{String(i + 1).padStart(2, "0")}</span>{line}</div>) : <div className="empty-mini">No agent runs yet.</div>}</div></div>
          </div>
          <div className="card-grid">{(state.agents.length ? state.agents : [{ id: "seed", ...defaultAgent, createdAt: Date.now(), updatedAt: Date.now() }]).map((agent) => <div className="feature-card" key={agent.id}><div className="feature-icon"><Bot size={18} /></div><strong>{agent.name}</strong><p>{agent.systemPrompt}</p><div className="chip-row">{agent.tools.map((tool) => <span key={tool}>{tool}</span>)}</div></div>)}</div>
        </section>}

        {view === "models" && familyId && <ModelFamilyPage family={state.models.find((item) => item.id === familyId)} familyId={familyId} onBack={() => setView("models")} onDownload={(file) => { void guardRedownload(familyId, state.models.find((item) => item.id === familyId)?.name || file.name).then((approved) => { if (approved) void startUrlDownload(familyId, file.name, file.url, file.filename) }) }} activeTasks={familyActiveTasks} onPause={() => familyActiveTasks.forEach((task) => pauseDownload(task.id))} onResume={() => familyActiveTasks.forEach((task) => resumeDownload(task.id))} onCancel={() => familyActiveTasks.forEach((task) => cancelDownload(task.id))} />}
        {view === "models" && !route.family && <section className={cn("view scroll-view", dragging && "drop-zone-active")} onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); installImportedModel(event.dataTransfer.files) }}><div className="section-head"><div><span className="section-kicker">MODEL HUB</span><h2>Discover, import, install, manage.</h2><p>Formats, architectures, backends and hardware are evaluated independently.</p></div><div className="head-actions"><button className="ghost-btn" onClick={() => modelImportRef.current?.click()}><Upload size={15} /> Import local model</button><input ref={modelImportRef} hidden type="file" onChange={(event) => installImportedModel(event.target.files)} /></div></div><div className="search-row"><div className="search-box"><Search size={15} /><input value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} placeholder="Search models, providers, capabilities…" /></div><div className="hardware-pill"><Cpu size={14} /> {hardware.cpu} · {hardware.ramGb ? `${hardware.ramGb} GB RAM` : "hardware scan"}</div></div><div className="model-grid">{filteredModels.map((model) => { const score = scoreModel(model, hardware); const catalogCount = modelCatalog[model.id]?.length ?? 0; const installableCount = downloadableCheckpoints(model.id).length; const tasks = activeTasksFor(state.downloads.filter((task) => task.modelId === model.id)); return <article key={model.id} className="model-card"><div className="model-card-top"><div className="model-icon"><Package size={18} /></div><div><div className="model-title">{model.name}</div><div className="model-provider">{model.provider} · {model.architecture}</div></div><span className={cn("compat-pill", score >= 75 ? "good" : score >= 55 ? "mid" : "heavy")}>{recommendationLabel(score)}</span></div><div className="model-specs"><span><MemoryStick size={13} /> {model.recommendedRam}</span><span><HardDrive size={13} /> {model.disk}</span><span><Zap size={13} /> {model.parameters}</span><span><Database size={13} /> Context: {model.context}</span></div><div className="chip-row">{model.quantizations.map((tag) => <span key={tag} className="quant-tag">{tag}</span>)}{model.formats.map((tag) => <span key={tag}>{tag}</span>)}{model.capabilities.slice(0, 4).map((tag) => <span key={tag}>{tag.replace("*", "")}</span>)}</div>{tasks.length ? <DownloadProgress tasks={tasks} onPause={() => tasks.forEach((task) => pauseDownload(task.id))} onResume={() => tasks.forEach((task) => resumeDownload(task.id))} onCancel={() => tasks.forEach((task) => cancelDownload(task.id))} /> : null}<div className="model-footer"><a href={model.sourceUrl} target="_blank" rel="noreferrer"><Link2 size={13} /> Source</a>{catalogCount > 0 && <span className="model-count">{catalogCount} checkpoints</span>}{state.downloadedModels[model.id] && model.status === "available" && !tasks.length ? <span className="downloaded-flag">Downloaded before</span> : null}<div className="row-actions">{model.status === "installed" && <><span className="installed-label"><Check size={13} /> Installed</span><button className="icon-btn" title="Detach model" onClick={() => detachModel(model.id)}><Link2 size={13} /></button><button className="icon-btn danger" title="Delete model metadata" onClick={() => deleteModel(model.id)}><Trash2 size={13} /></button></>}{model.status === "detached" && <button className="ghost-btn small" onClick={() => setState((current) => ({ ...current, models: current.models.map((item) => item.id === model.id ? { ...item, status: "available" } : item) }))}>Attach</button>}{model.status === "available" && !tasks.length && (!catalogCount || installableCount === 1) && <button className="primary-btn small" onClick={() => void startDownload(model)}><Download size={13} /> Install</button>}{catalogCount > 0 && <button className="primary-btn small" onClick={() => openFamily(model.id)}><Boxes size={13} /> Browse models</button>}</div></div></article> })}</div></section>}

        {view === "downloads" && <section className="view scroll-view"><div className="section-head"><div><span className="section-kicker">DOWNLOADS</span><h2>Model installation without friction.</h2><p>{qdmAvailable() ? "Seamless and hassle-free downloads through Quantum Download Manager — no stuck transfers, no unnecessary restarts. Transfers run natively with multiple parallel connections, resume after a restart and stay cancellable." : <>Files stream to a location you choose, with progress, pause, resume and cancel. {supportsSavePicker() ? "Direct-to-disk streaming is active in this browser." : "This browser buffers in memory; Chromium-based browsers can stream straight to disk."}</>}</p>{qdmAvailable() ? <p className="panel-note">Model storage: {storageDir || "…"} <button className="ghost-btn" onClick={() => void changeStorageDir()}><FolderOpen size={14} /> Change folder</button></p> : null}</div></div><div className="download-list">{state.downloads.length ? state.downloads.map((task) => <div className="download-row" key={task.id}><div className="download-icon"><Download size={16} /></div><div className="download-main"><strong>{task.name}</strong><span>{task.url}</span><div className="progress-track"><span style={{ width: `${Math.min(100, task.progress)}%` }} /></div></div><div className="download-status"><span className={cn("download-state", task.state)}>{task.state}{task.state === "complete" ? " ✓" : ""}</span><span>{task.totalBytes ? `${formatBytes(task.receivedBytes)} / ${formatBytes(task.totalBytes)}` : task.receivedBytes ? formatBytes(task.receivedBytes) : ""}</span>{task.state === "downloading" && task.speedBps ? <span className="download-meta">{formatBytes(task.speedBps)}/s{task.etaMs ? ` · ${formatEta(task.etaMs)} left` : ""}</span> : null}{task.error ? <span className="download-error">{task.error}</span> : null}</div><div className="row-actions">{task.state === "downloading" ? <button className="icon-btn" onClick={() => pauseDownload(task.id)} title="Pause download"><Pause size={14} /></button> : null}{task.state === "paused" ? <button className="icon-btn" onClick={() => resumeDownload(task.id)} title="Resume download"><Play size={14} /></button> : null}{(task.state === "downloading" || task.state === "paused") ? <button className="icon-btn" onClick={() => cancelDownload(task.id)} title="Cancel download"><X size={14} /></button> : null}<button className="icon-btn danger" onClick={() => dropDownload(task.id)} title="Remove from list"><Trash2 size={14} /></button></div></div>) : <div className="empty-state-card"><Download size={22} /><strong>No downloads yet</strong><p>Install a model from Model Hub to populate the queue.</p></div>}</div></section>}

        {view === "projects" && <section className="view scroll-view"><div className="section-head"><div><span className="section-kicker">PROJECTS</span><h2>Persistent local workspaces.</h2><p>Projects bundle files, conversations, memory and agent settings without requiring an account.</p></div><button className="primary-btn" onClick={createProject}><Plus size={15} /> New project</button></div><div className="project-grid">{state.projects.map((project) => <article className="project-card" key={project.id}><div className="project-top"><FolderOpen size={20} /><span>{new Date(project.updatedAt).toLocaleDateString()}</span></div><h3>{project.name}</h3><p>{project.description}</p><div className="project-foot"><span>{project.memoryIds.length} memory links</span><button className="ghost-btn" onClick={() => { updateSettings({ selectedProjectId: project.id }); setView("chat") }}>Open</button></div></article>)}{!state.projects.length && <div className="empty-state-card"><FolderOpen size={22} /><strong>No projects yet</strong><p>Create one to tie chats, memories and agents together.</p></div>}</div></section>}

        {view === "memory" && <section className="view scroll-view"><div className="section-head"><div><span className="section-kicker">LOCAL MEMORY</span><h2>User-controlled memory, always on-device.</h2><p>View, edit, delete or export every persistent memory Syntara keeps.</p></div><div className="head-actions"><button className="ghost-btn" onClick={exportMemories}><FileDown size={15} /> Export memories</button><button className="ghost-btn" onClick={() => memoryImportRef.current?.click()}><Upload size={15} /> Import memories</button><input ref={memoryImportRef} hidden type="file" accept="application/json,.json" onChange={(event) => void importMemories(event.target.files)} /><label className="toggle-row"><span>Memory enabled</span><input type="checkbox" checked={state.settings.memoryEnabled} onChange={(e) => updateSettings({ memoryEnabled: e.target.checked })} /></label></div></div><div className="memory-create"><textarea value={memoryDraft} onChange={(e) => setMemoryDraft(e.target.value)} placeholder="Add a memory manually, e.g. ‘Prefer concise technical explanations.’" /><button className="primary-btn" onClick={createMemory}><Plus size={15} /> Add memory</button></div><div className="memory-search"><Search size={13} /><input value={memorySearch} onChange={(e) => setMemorySearch(e.target.value)} placeholder="Search memories…" /></div><div className="memory-list">{filteredMemories.map((memory) => <div className="memory-row" key={memory.id}><div className="memory-copy"><span className="memory-tag">{memory.category}</span><strong>{memory.content}</strong><small>Updated {new Date(memory.updatedAt).toLocaleString()}</small></div><div className="row-actions"><button className="icon-btn" onClick={() => { setSelectedMemory(memory); setMemoryDraft(memory.content) }}><Pencil size={14} /></button><button className="icon-btn danger" onClick={() => removeMemory(memory.id)}><Trash2 size={14} /></button></div></div>)}{!filteredMemories.length && (state.memories.length ? <div className="empty-mini">No matching memories.</div> : <div className="empty-state-card"><BrainCircuit size={22} /><strong>No persistent memories</strong><p>Syntara will keep only what you explicitly allow it to retain.</p></div>)}</div>{selectedMemory && <div className="modal-backdrop" onMouseDown={() => setSelectedMemory(null)}><div className="modal-card" onMouseDown={(e) => e.stopPropagation()}><div className="panel-title"><strong>Edit memory</strong><button className="icon-btn" onClick={() => setSelectedMemory(null)}><X size={15} /></button></div><textarea className="large-input" value={memoryDraft} onChange={(e) => setMemoryDraft(e.target.value)} /><div className="modal-actions"><button className="ghost-btn" onClick={() => setSelectedMemory(null)}>Cancel</button><button className="primary-btn" onClick={updateMemory}><Save size={15} /> Save</button></div></div></div>}</section>}

        {view === "performance" && <section className="view scroll-view"><div className="section-head"><div><span className="section-kicker">PERFORMANCE OBSERVATORY</span><h2>See what your machine is doing.</h2><p>Runtime telemetry stays local and focuses on the measurements that matter.</p></div><button className="ghost-btn" onClick={connect}><RefreshCw size={15} /> Refresh</button></div><div className="metric-grid"><Metric icon={Zap} label="Tokens / sec" value={metrics?.tokensPerSec ? `${metrics.tokensPerSec.toFixed(1)}` : "—"} /><Metric icon={TimerIcon} label="Time to first token" value={metrics?.firstTokenMs ? `${Math.round(metrics.firstTokenMs)} ms` : "—"} /><Metric icon={Cpu} label="CPU" value={health?.hwinfo?.cores ? `${health.hwinfo.cores} cores` : "—"} /><Metric icon={MemoryStick} label="RAM" value={health?.hwinfo?.ram_total_gb ? `${health.hwinfo.ram_total_gb} GB` : "—"} /><Metric icon={Database} label="KV slots" value={`${health?.kv_slots ?? "—"}${supportsCacheSlots(health) ? " shared" : ""}`} /><Metric icon={HardDrive} label="VRAM" value={hardware.vramGb ? `${hardware.vramGb} GB` : health?.hwinfo?.vram_total_gb ? `${health.hwinfo.vram_total_gb} GB` : "—"} /></div><div className="two-col"><div className="card-panel"><div className="panel-title"><span>Execution plan</span><Activity size={15} /></div><div className="plan-stack"><PlanRow label="Backend" value={connected ? "Local OpenAI-compatible runtime" : "Not connected"} /><PlanRow label="Memory topology" value={hardware.vramGb ? "CPU + GPU + RAM + SSD" : "CPU + RAM + SSD"} /><PlanRow label="Optimization mode" value={state.settings.performanceMode} /><PlanRow label="Active requests" value={connected ? String(activeRequests(health)) : "—"} /><PlanRow label="Context manager" value={connected ? "Runtime-controlled" : "Not connected"} /></div></div><div className="card-panel"><div className="panel-title"><span>Runtime health</span><span className={cn("status-pill", connected && "good")}>{connected ? "Healthy" : "Offline"}</span></div><pre className="health-json">{JSON.stringify(health || { status: "offline", message: "Connect to a local runtime to view live telemetry." }, null, 2)}</pre></div></div></section>}

        {view === "developer" && <section className="view scroll-view"><div className="section-head"><div><span className="section-kicker">DEVELOPER PLATFORM</span><h2>One local API for everything.</h2><p>Desktop, CLI, Python, n8n and IDE integrations all use the same Syntara local control surface.</p></div></div><div className="dev-grid"><DevCard icon={Server} title="Local API" body="OpenAI-compatible HTTP endpoints on localhost by default." code={`${state.settings.baseUrl}`} onCopy={copy} copied={copied === "api"} copyKey="api" /><DevCard icon={Code2} title="Python SDK" body="Use locally installed models from Python without hosting weights anywhere." code={`from syntara import Syntara\nclient = Syntara()\nprint(client.chat(model="qwen", message="Hello"))`} onCopy={copy} copied={copied === "python"} copyKey="python" /><DevCard icon={Terminal} title="Developer CLI" body="Manage models, serve the runtime, create backups and run local agents." code={`syntara models list\nsyntara chat\nsyntara serve`} onCopy={copy} copied={copied === "cli"} copyKey="cli" /><DevCard icon={Zap} title="n8n" body="Point an HTTP Request/OpenAI node at localhost and keep inference on-device." code={`POST ${state.settings.baseUrl}/chat/completions`} onCopy={copy} copied={copied === "n8n"} copyKey="n8n" /></div><div className="integration-strip"><div><Code2 size={17} /><strong>VS Code</strong><span>Local chat + coding workflows through Syntara API.</span></div><div><Sparkles size={17} /><strong>Cursor-type IDEs</strong><span>Use OpenAI-compatible local endpoints.</span></div><div><Boxes size={17} /><strong>MCP / Plugins</strong><span>Permissioned tools and extensible integrations.</span></div></div></section>}

        {view === "settings" && <section className="view scroll-view"><div className="section-head"><div><span className="section-kicker">SETTINGS</span><h2>Your machine, your data, your controls.</h2><p>No account is required; settings and persistent state live locally.</p></div></div><div className="settings-grid"><div className="card-panel"><div className="panel-title"><span>About</span><Sparkles size={15} /></div><p className="panel-note">Syntara: The Universal Local AI Runtime by NDe: NoirDemons.</p><p className="panel-note">Local-first, privacy-first, open source. Your models run on your device.</p></div><div className="card-panel"><div className="panel-title"><span>Advanced</span><Terminal size={15} /></div><p className="panel-note">Reset removes chats, memories, projects, agent configs and imported-model metadata from this browser. Files you already saved to disk are untouched.</p><button className="ghost-btn danger-text" onClick={() => setConfirmReset(true)}><Trash2 size={15} /> Reset workspace</button></div><div className="card-panel"><div className="panel-title"><span>Help</span><CircleHelp size={15} /></div><div className="help-list">{helpItems.map((item) => <details key={item.q} className="help-item"><summary>{item.q}</summary><p>{item.a}</p></details>)}</div></div><div className="card-panel"><div className="panel-title"><span>Appearance</span><Settings2 size={15} /></div><label className="setting-row"><span>Theme</span><select value={state.settings.theme} onChange={(e) => updateSettings({ theme: e.target.value as ThemeMode })}><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select></label><label className="setting-row"><span>Reduced motion</span><input type="checkbox" checked={state.settings.reducedMotion} onChange={(e) => updateSettings({ reducedMotion: e.target.checked })} /></label></div><div className="card-panel"><div className="panel-title"><span>Runtime</span><Server size={15} /></div><label className="field-label">Local API base URL<input value={state.settings.baseUrl} onChange={(e) => updateSettings({ baseUrl: e.target.value })} /></label><label className="field-label">Default model<input value={state.settings.model} onChange={(e) => updateSettings({ model: e.target.value })} placeholder="Selected at runtime" /></label><label className="field-label">Performance mode<select value={state.settings.performanceMode} onChange={(e) => updateSettings({ performanceMode: e.target.value as AppSettings["performanceMode"] })}><option value="maximum">Maximum Performance</option><option value="balanced">Balanced</option><option value="efficiency">Efficiency</option><option value="battery">Battery Saving</option></select></label></div><div className="card-panel"><div className="panel-title"><span>Desktop behavior</span><SlidersHorizontal size={15} /></div><label className="setting-row"><span>Start with OS</span><input type="checkbox" checked={state.settings.autoStart} onChange={(e) => updateSettings({ autoStart: e.target.checked })} /></label><label className="setting-row"><span>Keep runtime in tray</span><input type="checkbox" checked={state.settings.tray} onChange={(e) => updateSettings({ tray: e.target.checked })} /></label></div><div className="card-panel"><div className="panel-title"><span>Backup & migration</span><FileDown size={15} /></div><p className="panel-note">Backups include chats, memories, projects, settings, agent configurations and model metadata — never model weights.</p><div className="backup-actions"><button className="primary-btn" onClick={exportBackup}><FileDown size={15} /> Create backup</button><button className="ghost-btn" onClick={() => backupRef.current?.click()}><FileUp size={15} /> Restore</button></div><input ref={backupRef} hidden type="file" accept=".syntara-backup,.json" onChange={(e) => void importBackup(e.target.files)} /></div></div></section>}
      {confirmReset ? (
          <div className="modal-backdrop" onMouseDown={() => setConfirmReset(false)}>
            <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
              <div className="panel-title"><strong>Reset workspace?</strong><button className="icon-btn" onClick={() => setConfirmReset(false)}><X size={15} /></button></div>
              <p className="panel-note">This clears all local state from this browser: chats, memories, projects, agents and imported-model metadata. It does not touch model files already saved on disk.</p>
              <div className="modal-actions"><button className="ghost-btn" onClick={() => setConfirmReset(false)}>Cancel</button><button className="primary-btn" onClick={() => { clearState(); setState(defaultState()); setConfirmReset(false); setSelectedConversationId(null); setView("chat") }}><Trash2 size={15} /> Reset</button></div>
            </div>
          </div>
        ) : null}
      {redownload ? (
        <div className="modal-backdrop" onMouseDown={() => settleRedownload(false)}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="panel-title"><strong>Download again?</strong><button className="icon-btn" onClick={() => settleRedownload(false)}><X size={15} /></button></div>
            <p className="panel-note">You already downloaded <strong>{redownload.name}</strong> before{state.downloadedModels[redownload.modelId]?.bytes ? ` (${formatBytes(state.downloadedModels[redownload.modelId]?.bytes)})` : ""} on {new Date(state.downloadedModels[redownload.modelId]?.at ?? Date.now()).toLocaleDateString()}. Downloading again will pull the full file a second time. Continue?</p>
            <div className="modal-actions"><button className="ghost-btn" onClick={() => settleRedownload(false)}>Cancel</button><button className="primary-btn" onClick={() => settleRedownload(true)}><Download size={15} /> Download again</button></div>
          </div>
        </div>
      ) : null}
      </main>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>; label: string; value: string }) {
  return <div className="metric-card"><Icon size={17} /><span>{label}</span><strong>{value}</strong></div>
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return <div className="plan-row"><span>{label}</span><strong>{value}</strong></div>
}

function DevCard({ icon: Icon, title, body, code, onCopy, copied, copyKey }: { icon: LucideIcon; title: string; body: string; code: string; onCopy: (text: string, key: string) => void; copied: boolean; copyKey: string }) {
  return <article className="dev-card"><div className="feature-icon"><Icon size={18} /></div><div className="dev-title"><strong>{title}</strong><button className="icon-btn" onClick={() => onCopy(code, copyKey)}>{copied ? <Check size={14} /> : <FileDown size={14} />}</button></div><p>{body}</p><pre>{code}</pre></article>
}

function TimerIcon(props: React.SVGProps<SVGSVGElement> & { size?: number | string }) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 3h6" /></svg> }
