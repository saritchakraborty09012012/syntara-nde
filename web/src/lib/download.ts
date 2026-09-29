/* Streaming model download helper.
 *
 * Models are large, so this module never holds the whole artifact in browser
 * memory when the File System Access API is available: the bytes stream
 * straight into a file the user picks. Where that API is missing we fall back
 * to buffering the response and triggering a classic download at the end —
 * still progress-reported, but explicitly buffered.
 *
 * Pause and resume are honest about the protocol: a paused download remembers
 * how much arrived and retries with a Range request. If the server answers
 * 206 we continue; if it answers 200 it ignored the range and we restart from
 * zero, because appending to a full re-send would corrupt the file.
 */

export type DownloadState = "downloading" | "paused" | "restarting" | "complete" | "error" | "cancelled"

export interface DownloadHooks {
  onProgress?: (received: number, total: number | null) => void
  onState?: (state: DownloadState, note?: string) => void
}

/** Methods to drive one download from the UI. */
export interface DownloadControl {
  pause(): void
  resume(): void
  cancel(): void
  /** Resolves true when the artifact was fully saved, false on cancellation or failure. */
  done: Promise<boolean>
}

/** Upper bound for the in-memory fallback before we refuse to continue buffering. */
const MAX_BUFFERED_BYTES = 1.5 * 1024 ** 3

interface PickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName?: string
    types?: Array<{ description?: string; accept: Record<string, string[]> }>
  }) => Promise<{ createWritable: () => Promise<FileSystemWritableFileStream> }>
}

interface Session {
  control: DownloadControl | null
  controller: AbortController
  url: string
  filename: string
  total: number | null
  received: number
  mode: "picker" | "blob"
  writer: FileSystemWritableFileStream | null
  chunks: Uint8Array[]
  cancelled: boolean
  resumeSignal: (() => void) | null
  /* A resume can land between the pause abort and the loop parking on
     resumeSignal; remember it so the request is not swallowed. */
  resumePending: boolean
}

export function supportsSavePicker() {
  return typeof window !== "undefined" && typeof (window as PickerWindow).showSaveFilePicker === "function"
}

async function pickWriter(filename: string): Promise<FileSystemWritableFileStream | null> {
  const picker = (window as PickerWindow).showSaveFilePicker
  if (typeof picker !== "function") return null
  const handle = await picker({
    suggestedName: filename,
    types: [{ description: "Model file", accept: { "application/octet-stream": [".gguf", ".safetensors", ".bin", ".bin.zst"] } }],
  })
  return handle.createWritable()
}

function saveBlobDownload(session: Session) {
  const size = session.chunks.reduce((n, chunk) => n + chunk.byteLength, 0)
  const buffer = new Uint8Array(size)
  let offset = 0
  for (const chunk of session.chunks) {
    buffer.set(chunk, offset)
    offset += chunk.byteLength
  }
  const blob = new Blob([buffer], { type: "application/octet-stream" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = session.filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function resetWriter(session: Session) {
  // The destination already holds bytes from the abandoned attempt; a server
  // that ignores Range forced a clean restart, so the file must start empty.
  session.writer?.seek(0)
  session.writer?.truncate(0)
  session.received = 0
  session.chunks.length = 0
}

type FetchOutcome = "complete" | "aborted"

async function fetchOnce(session: Session, hooks: DownloadHooks): Promise<FetchOutcome> {
  const headers: Record<string, string> = {}
  if (session.received > 0) headers.Range = `bytes=${session.received}-`

  const response = await fetch(session.url, { signal: session.controller.signal, headers })

  if (response.status === 416) {
    // Range is unsatisfiable. If the bytes we already hold cover the whole
    // file, the download is effectively complete.
    if (session.total !== null && session.received >= session.total) return "complete"
    throw new Error("The server rejected the resume range; cancel and start over.")
  }
  if (!response.ok) throw new Error(`Server responded ${response.status} ${response.statusText}`)
  if (!response.body) throw new Error("Server returned an empty body.")

  if (session.received > 0 && response.status === 200) {
    hooks.onState?.("restarting", "The server ignored the resume range; starting over.")
    resetWriter(session)
  }

  const rangeHeader = response.headers.get("content-range")
  const lengthHeader = response.headers.get("content-length")
  if (rangeHeader) {
    const match = /bytes \d+-\d+\/(\d+)/.exec(rangeHeader)
    if (match) session.total = Number(match[1])
  } else if (lengthHeader) {
    session.total = Number(lengthHeader) || null
  }

  const reader = response.body.getReader()
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    if (session.controller.signal.aborted) break
    session.received += value.length
    if (session.mode === "picker" && session.writer) {
      await session.writer.write(value)
    } else {
      session.chunks.push(value)
      // Blob mode holds the artifact in memory. Refuse snapshots that are
      // already unrealistically large; direct-to-disk streaming is the only
      // safe path for multi-gigabyte models.
      if (session.received > MAX_BUFFERED_BYTES) {
        throw new Error("This browser cannot buffer a model this large. Use a Chromium-based browser that supports direct-to-disk streaming.")
      }
    }
    hooks.onProgress?.(session.received, session.total)
  }

  if (session.controller.signal.aborted) return "aborted"

  if (session.total !== null && session.received < session.total) {
    throw new Error("Connection closed before the file was complete; resume the download.")
  }
  return "complete"
}

async function finalize(session: Session, hooks: DownloadHooks) {
  if (session.mode === "picker" && session.writer) {
    await session.writer.close()
    session.writer = null
  } else {
    saveBlobDownload(session)
  }
  hooks.onState?.("complete")
}

async function teardown(session: Session, hooks: DownloadHooks, state: "cancelled" | "error", note?: string) {
  session.control = null
  if (session.writer) {
    try { await session.writer.abort() } catch { /* destination already gone */ }
    session.writer = null
  }
  hooks.onState?.(state, note)
}

/* Park the transfer between pause and resume. Cancellation arriving during
   the wait must not deadlock on a signal that fired before we subscribed,
   and a resume that beat the subscription is honoured instead of dropped. */
async function waitForResume(session: Session) {
  if (session.cancelled) return
  if (session.resumePending) {
    session.resumePending = false
    session.controller = new AbortController()
    return
  }
  await new Promise<void>((notify) => { session.resumeSignal = notify })
  session.resumeSignal = null
  session.controller = new AbortController()
}

export async function createStreamedDownload(
  url: string,
  filename: string,
  hooks: DownloadHooks = {},
): Promise<DownloadControl | null> {
  let mode: Session["mode"] = "blob"
  let writer: FileSystemWritableFileStream | null = null
  if (supportsSavePicker()) {
    try { writer = await pickWriter(filename) } catch { return null }
    if (writer) mode = "picker"
  }

  const session: Session = {
    control: null,
    controller: new AbortController(),
    url,
    filename,
    total: null,
    received: 0,
    mode,
    writer,
    chunks: [],
    cancelled: false,
    resumeSignal: null,
    resumePending: false,
  }

  const control: DownloadControl = {
    pause: () => {
      if (session.control && !session.cancelled) {
        /* A fresh pause invalidates any stale resume from before it. */
        session.resumePending = false
        session.controller.abort()
        hooks.onState?.("paused")
      }
    },
    resume: () => {
      if (!session.control || session.cancelled) return
      if (session.resumeSignal) session.resumeSignal()
      else session.resumePending = true
    },
    cancel: () => {
      if (!session.control) return
      session.cancelled = true
      session.controller.abort()
      session.resumeSignal?.()
    },
    done: new Promise<boolean>((resolve) => {
      void (async () => {
        /* The loop owns pause, cancel and failure as three distinct outcomes.
           A user pause aborts the in-flight fetch too — that DOMException must
           be read as "paused" with the control kept alive, never as a failure
           that tears the session down and leaves the row unresumable. */
        let completed = false
        while (true) {
          if (session.cancelled) break
          try {
            hooks.onState?.("downloading")
            const outcome = await fetchOnce(session, hooks)
            if (outcome === "aborted") {
              await waitForResume(session)
              continue
            }
            await finalize(session, hooks)
            session.control = null
            completed = true
            break
          } catch (error) {
            if (session.cancelled) break
            if (session.controller.signal.aborted) {
              hooks.onState?.("paused")
              await waitForResume(session)
              continue
            }
            await teardown(session, hooks, "error", error instanceof Error ? error.message : "Download failed")
            break
          }
        }
        if (!completed && session.control) {
          /* The error path already tore the session down; a surviving control
             means the loop exited on cancellation and still owes the UI. */
          await teardown(session, hooks, "cancelled")
        }
        resolve(completed)
      })()
    }),
  }
  session.control = control
  return control
}