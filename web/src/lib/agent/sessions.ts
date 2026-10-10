/* Agent session model and per-session persistence (phase 3).

   The sidebar shows sessions from a small manifest while every transcript
   lives under its own key (`syntara.session.<id>`), so opening one session
   never loads the others and a single oversized transcript cannot evict
   the rest. Saves are size-capped with explicit, deterministic trimming —
   localStorage is a shared ~5 MB budget and old runs carry large tool
   outputs. */

import { chatOnce } from "../api"
import { createId } from "../syntara-state"
import type { AgentEvent } from "./loop"

export type AgentMode = "plan" | "build" | "explain" | "chat" | "debug"

export interface AgentModeInfo {
  id: AgentMode
  label: string
  hint: string
}

/* Composer dropdown order: the default (build) first, then read-only and
   no-tool variants so a mis-click can never enable writes by surprise. */
export const AGENT_MODES: AgentModeInfo[] = [
  { id: "build", label: "Build", hint: "Full tools: read, write and run inside the project folder" },
  { id: "plan", label: "Plan", hint: "Read-only: inspect files and propose a plan, no writes" },
  { id: "explain", label: "Explain", hint: "Answer questions with reasoning, no tools" },
  { id: "chat", label: "Chat", hint: "Plain conversation, no tools" },
  { id: "debug", label: "Debug", hint: "Full tools with emphasis on diagnosing failures" },
]

export interface AgentTurn {
  id: string
  task: string
  mode: AgentMode
  events: AgentEvent[]
  status: "running" | "done" | "stopped" | "error"
  at: number
}

export interface AgentSession {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  model: string | null
  turns: AgentTurn[]
}

export interface SessionManifestEntry {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  /* Capped join of the session's task texts so the sidebar can search
     without loading every transcript. Older entries simply lack it. */
  text?: string
}

export interface SessionManifest {
  activeId: string | null
  entries: SessionManifestEntry[]
}

export interface ModePolicy {
  /* Which tools the mode may bind at all (the permission gate still applies
     on top for writes/processes). */
  tools: "full" | "read-only" | "none"
  /* Extra system-prompt instruction for the mode. */
  prompt: string
}

export const SESSIONS_MANIFEST_KEY = "syntara.agent.sessions.v1"
export const SESSION_KEY_PREFIX = "syntara.session."

export const MAX_SESSIONS = 50
export const MAX_SAVE_BYTES = 1_500_000
export const MAX_EVENTS_PER_TURN = 400
export const MIN_KEPT_EVENTS = 5

export function sessionKey(id: string): string {
  return `${SESSION_KEY_PREFIX}${id}`
}

export function modePolicy(mode: AgentMode): ModePolicy {
  switch (mode) {
    case "build":
      return { tools: "full", prompt: "Work directly in the project folder: inspect files with tools, make the requested changes, and verify your work before finishing." }
    case "plan":
      return { tools: "read-only", prompt: "Plan mode: inspect the project with read-only tools, then produce a concrete step-by-step plan. Do not modify files and do not run commands." }
    case "explain":
      return { tools: "none", prompt: "Explain mode: answer the user's question with clear reasoning. Do not call tools." }
    case "chat":
      return { tools: "none", prompt: "Chat mode: converse naturally and helpfully. Do not call tools." }
    case "debug":
      return { tools: "full", prompt: "Debug mode: reproduce and diagnose the failure first (reads, listings, diagnostic commands), explain what you found, then apply the smallest fix and re-verify." }
  }
}

/* First non-empty line, whitespace collapsed, capped — used as the sidebar
   title and the sticky stage header. */
export function titleFromTask(task: string): string {
  const line = task.split("\n").map((part) => part.trim()).find((part) => part.length > 0)
  if (!line) return "New session"
  return line.length > 48 ? `${line.slice(0, 48)}…` : line
}

/* Model-assisted session naming (phase 4): one cheap, bounded request that
   asks for a short title. Best-effort by design — any failure keeps the
   deterministic titleFromTask fallback. */
export async function suggestSessionTitle(options: {
  baseUrl: string
  model: string
  task: string
  signal?: AbortSignal
}): Promise<string | null> {
  try {
    const result = await chatOnce({
      baseUrl: options.baseUrl,
      model: options.model,
      messages: [
        {
          role: "user",
          content: `Title this coding-agent session in at most six words. Reply with the title only, no quotes, no trailing punctuation.\n\nTask: ${options.task.slice(0, 600)}`,
        },
      ],
      maxTokens: 20,
      temperature: 0,
      signal: options.signal,
    })
    const title = result.content?.trim().split("\n")[0]?.replace(/^["'“”']+|["'“”'.…]+$/g, "").trim()
    if (!title || title.length > 60) return null
    return title
  } catch {
    return null
  }
}

export function createSession(model: string | null, now = Date.now()): AgentSession {
  return { id: createId("sess"), title: "New session", createdAt: now, updatedAt: now, model, turns: [] }
}

export function createTurn(task: string, mode: AgentMode, now = Date.now()): AgentTurn {
  return { id: createId("turn"), task, mode, events: [], status: "running", at: now }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function parseSession(raw: string | null): AgentSession | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<AgentSession>
    if (!value || typeof value.id !== "string" || !Array.isArray(value.turns)) return null
    const turns: AgentTurn[] = value.turns.filter((turn): turn is AgentTurn => {
      if (!turn || typeof turn.id !== "string" || typeof turn.task !== "string") return false
      if (!Array.isArray(turn.events)) return false
      return true
    })
    return {
      id: value.id,
      title: typeof value.title === "string" && value.title ? value.title : "New session",
      createdAt: isFiniteNumber(value.createdAt) ? value.createdAt : Date.now(),
      updatedAt: isFiniteNumber(value.updatedAt) ? value.updatedAt : Date.now(),
      model: typeof value.model === "string" ? value.model : null,
      turns,
    }
  } catch {
    return null
  }
}

export function loadSession(id: string, storage: Storage = localStorage): AgentSession | null {
  try {
    return parseSession(storage.getItem(sessionKey(id)))
  } catch {
    return null
  }
}

export function loadManifest(storage: Storage = localStorage): SessionManifest {
  try {
    const raw = storage.getItem(SESSIONS_MANIFEST_KEY)
    if (!raw) return { activeId: null, entries: [] }
    const value = JSON.parse(raw) as Partial<SessionManifest>
    const entries = Array.isArray(value.entries)
      ? value.entries.filter((entry): entry is SessionManifestEntry =>
          !!entry && typeof entry.id === "string" && typeof entry.title === "string" && isFiniteNumber(entry.updatedAt))
      : []
    return {
      activeId: typeof value.activeId === "string" ? value.activeId : null,
      entries,
    }
  } catch {
    return { activeId: null, entries: [] }
  }
}

export function saveManifest(manifest: SessionManifest, storage: Storage = localStorage): void {
  storage.setItem(SESSIONS_MANIFEST_KEY, JSON.stringify(manifest))
}

export interface TrimResult {
  session: AgentSession
  droppedTurns: number
}

/* Deterministic size guard: per-turn event caps first, then drop the oldest
   finished turns (never the running one) until the JSON fits the budget;
   if one turn alone is too big, its event payloads are halved down to a
   minimal keep so the conversation text always survives. */
export function trimSessionForSave(session: AgentSession, maxBytes = MAX_SAVE_BYTES): TrimResult {
  let droppedTurns = 0
  let turns = session.turns.map((turn) =>
    turn.events.length > MAX_EVENTS_PER_TURN && turn.status !== "running"
      ? { ...turn, events: turn.events.slice(-MAX_EVENTS_PER_TURN) }
      : turn,
  )
  let json = JSON.stringify({ ...session, turns })

  while (json.length > maxBytes) {
    if (turns.length > 1) {
      const dropIndex = turns.findIndex((turn) => turn.status !== "running")
      if (dropIndex !== -1) {
        turns = [...turns.slice(0, dropIndex), ...turns.slice(dropIndex + 1)]
        droppedTurns += 1
        json = JSON.stringify({ ...session, turns })
        continue
      }
    }
    let target = -1
    let largest = 0
    turns.forEach((turn, index) => {
      if (turn.events.length > largest) {
        largest = turn.events.length
        target = index
      }
    })
    if (target === -1 || largest <= MIN_KEPT_EVENTS) break
    const keep = Math.max(MIN_KEPT_EVENTS, Math.floor(largest / 2))
    if (keep >= largest) break
    turns = turns.map((turn, index) => (index === target ? { ...turn, events: turn.events.slice(-keep) } : turn))
    json = JSON.stringify({ ...session, turns })
  }
  return { session: { ...session, turns }, droppedTurns }
}

/* Saves the transcript under its own key and refreshes the manifest entry.
   Oldest sessions beyond the cap are removed from both. */
export function saveSession(session: AgentSession, storage: Storage = localStorage): SessionManifest {
  const manifest = loadManifest(storage)
  const { session: trimmed } = trimSessionForSave(session)
  try {
    storage.setItem(sessionKey(trimmed.id), JSON.stringify(trimmed))
  } catch {
    /* Hard quota: keep the conversation text with only the last few event
       payloads so the session survives instead of vanishing. */
    const minimal = { ...trimmed, turns: trimmed.turns.map((turn) => ({ ...turn, events: turn.events.slice(-MIN_KEPT_EVENTS) })) }
    storage.setItem(sessionKey(minimal.id), JSON.stringify(minimal))
  }

  const entry: SessionManifestEntry = {
    id: trimmed.id,
    title: trimmed.title,
    createdAt: trimmed.createdAt,
    updatedAt: trimmed.updatedAt,
    /* Search blob: every task in the session, capped so the manifest
       itself stays small (it is loaded on every sidebar render). */
    text: trimmed.turns.map((turn) => turn.task).join("\n").slice(0, 2000),
  }
  const others = manifest.entries.filter((item) => item.id !== trimmed.id)
  /* Manifest stays newest-first regardless of which session was saved, so
     the sidebar order survives a reload. */
  const entries = [entry, ...others].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_SESSIONS)
  for (const stale of others.slice(MAX_SESSIONS - 1)) {
    try {
      storage.removeItem(sessionKey(stale.id))
    } catch {
      /* Best-effort cleanup — a failed removal only wastes space. */
    }
  }
  const next: SessionManifest = { activeId: trimmed.id, entries }
  saveManifest(next, storage)
  return next
}

export function deleteSession(id: string, storage: Storage = localStorage): SessionManifest {
  try {
    storage.removeItem(sessionKey(id))
  } catch {
    /* Ignore — the manifest entry still goes away below. */
  }
  const manifest = loadManifest(storage)
  const next: SessionManifest = {
    activeId: manifest.activeId === id ? (manifest.entries.find((entry) => entry.id !== id)?.id ?? null) : manifest.activeId,
    entries: manifest.entries.filter((entry) => entry.id !== id),
  }
  saveManifest(next, storage)
  return next
}

export function setActiveSession(id: string | null, storage: Storage = localStorage): SessionManifest {
  const manifest = loadManifest(storage)
  const next = { ...manifest, activeId: id }
  saveManifest(next, storage)
  return next
}

export interface SessionGroup {
  label: "Today" | "Yesterday" | "Older"
  entries: SessionManifestEntry[]
}

/* Sidebar grouping by local calendar day, newest first. */
export function groupSessions(entries: SessionManifestEntry[], now = Date.now()): SessionGroup[] {
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const todayMs = startOfToday.getTime()
  const yesterdayMs = todayMs - 24 * 60 * 60 * 1000

  const groups: SessionGroup[] = [
    { label: "Today", entries: [] },
    { label: "Yesterday", entries: [] },
    { label: "Older", entries: [] },
  ]
  for (const entry of [...entries].sort((a, b) => b.updatedAt - a.updatedAt)) {
    if (entry.updatedAt >= todayMs) groups[0].entries.push(entry)
    else if (entry.updatedAt >= yesterdayMs) groups[1].entries.push(entry)
    else groups[2].entries.push(entry)
  }
  return groups.filter((group) => group.entries.length > 0)
}

/* Sidebar search: every whitespace-separated term must appear in the
   title or the stored task text (case-insensitive AND). An empty query
   returns the entries unchanged. */
export function filterSessions(entries: SessionManifestEntry[], query: string): SessionManifestEntry[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return entries
  return entries.filter((entry) => {
    const haystack = `${entry.title}\n${entry.text ?? ""}`.toLowerCase()
    return terms.every((term) => haystack.includes(term))
  })
}

/* Capped Levenshtein distance: returns `max + 1` as soon as the distance
   cannot be within `max` — search stays fast on long manifests. */
function boundedEditDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
      rowMin = Math.min(rowMin, current[j])
    }
    if (rowMin > max) return max + 1
    previous = current
  }
  return previous[b.length]
}

function tokenize(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9_]+/).filter(Boolean)
}

/* Score one term against one word: exact > prefix > substring > typo.
   Returns 0 when nothing matches at all. */
function termScore(word: string, term: string): number {
  if (word === term) return 1
  if (term.length >= 3 && word.startsWith(term)) return 0.7
  if (term.length >= 3 && word.includes(term)) return 0.55
  if (term.length >= 4) {
    const allowed = term.length >= 7 ? 2 : 1
    if (boundedEditDistance(word, term, allowed) <= allowed) return 0.45
  }
  return 0
}

/* Smart session search (phase 4): typo/guess-tolerant re-ranking used when
   a model is attached. Every term must match something (AND semantics like
   filterSessions, but fuzzy), title hits weigh double, and results come
   back ordered by score instead of storage order. An empty query returns
   the entries unchanged. */
export function rankSessions(entries: SessionManifestEntry[], query: string): SessionManifestEntry[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return entries
  const scored = entries.map((entry) => {
    const titleWords = tokenize(entry.title)
    const textWords = tokenize(entry.text ?? "")
    let score = 0
    for (const term of terms) {
      let best = 0
      for (const word of titleWords) best = Math.max(best, termScore(word, term) * 2)
      if (best < 2) {
        for (const word of textWords) {
          best = Math.max(best, termScore(word, term))
          if (best >= 1) break
        }
      }
      if (best === 0) return { entry, score: 0 }
      score += best
    }
    return { entry, score }
  })
  return scored
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || b.entry.updatedAt - a.entry.updatedAt)
    .map((row) => row.entry)
}

/* Plan extraction fallback: numbered/bulleted lines from a plan-mode
   answer when the model never called submit_plan. Requires at least two
   list lines so a single bullet-pointed sentence is not mistaken for a
   plan. */
export function parsePlanItems(text: string): string[] {
  const items = text
    .split("\n")
    .map((line) => line.trim())
    .map((line) => {
      const numbered = /^\d+[.)]\s+(.*)$/.exec(line)
      if (numbered) return numbered[1].trim()
      const bulleted = /^[-*•]\s+(.*)$/.exec(line)
      if (bulleted) return bulleted[1].trim()
      return null
    })
    .filter((item): item is string => !!item)
  if (items.length < 2) return []
  return items.slice(0, 40)
}

/* Compact relative timestamp for session rows: "just now", "12m ago",
   "3h ago", "2d ago", then an absolute date beyond a week. */
export function relativeLabel(at: number, now = Date.now()): string {
  const diff = Math.max(0, now - at)
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(at).toLocaleDateString()
}
