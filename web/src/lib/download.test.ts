import { afterEach, describe, expect, it, vi } from "vitest"

import { createStreamedDownload, type DownloadState } from "./download"

/* Regression cover for the browser download loop: pausing aborts the
   in-flight fetch, and that rejection used to escape as a fatal error which
   tore the session down — the row showed ERROR ("signal is aborted without
   reason") with no Resume button. The abort must read as "paused" and keep
   the control alive until the user resumes or cancels. */

const abortError = () => new DOMException("The operation was aborted.", "AbortError")

function until(check: () => boolean, timeoutMs = 2000): Promise<void> {
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (check()) return resolve()
      if (Date.now() - started > timeoutMs) return reject(new Error("condition not reached in time"))
      setTimeout(tick, 5)
    }
    tick()
  })
}

describe("streamed download pause/resume", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("reads a mid-transfer pause as paused (not error) and resumes with a Range request", async () => {
    const states: DownloadState[] = []
    let lastReceived = 0
    const fetchCalls: Array<Record<string, string>> = []
    let call = 0

    vi.stubGlobal("fetch", vi.fn(async (_input: unknown, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>
      fetchCalls.push(headers)
      call += 1
      if (call === 1) {
        /* First attempt: hand over 1000 of 4000 bytes, then stall until the
           abort listener errors the stream — exactly what a real fetch does
           when its signal fires. */
        let delivered = false
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            init?.signal?.addEventListener("abort", () => controller.error(abortError()))
          },
          pull(controller) {
            if (delivered) return
            delivered = true
            controller.enqueue(new Uint8Array(1000))
          },
        })
        return new Response(stream, { status: 200, headers: { "content-length": "4000" } })
      }
      /* Resume: server honours the Range header with the remaining bytes. */
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(3000))
          controller.close()
        },
      })
      return new Response(stream, { status: 206, headers: { "content-range": "bytes 1000-3999/4000" } })
    }))

    /* Node has no DOM: finalize() falls back to the anchor-download path. */
    const anchor = { click: vi.fn(), remove: vi.fn(), href: "", download: "" }
    vi.stubGlobal("document", { createElement: () => anchor, body: { appendChild: vi.fn() } })
    const createObjectURL = vi.fn(() => "blob:test")
    const revokeObjectURL = vi.fn()
    Object.assign(URL, { createObjectURL, revokeObjectURL })

    const control = await createStreamedDownload("https://example.test/model.gguf", "model.gguf", {
      onProgress: (received) => { lastReceived = received },
      onState: (state) => { states.push(state) },
    })
    expect(control).toBeTruthy()

    await until(() => lastReceived >= 1000)
    control!.pause()
    await until(() => states.includes("paused"))

    /* The core assertion: pause never degrades into a fatal error, and the
       control survives so Resume remains possible. */
    expect(states).not.toContain("error")
    expect(states).not.toContain("cancelled")

    control!.resume()
    const done = await control!.done

    expect(done).toBe(true)
    expect(states.at(-1)).toBe("complete")
    expect(states).not.toContain("error")
    expect(fetchCalls).toHaveLength(2)
    expect(fetchCalls[1].Range).toBe("bytes=1000-")
    expect(lastReceived).toBe(4000)
    expect(createObjectURL).toHaveBeenCalledTimes(1)
  })

  it("still reports genuine failures as error and resolves done false", async () => {
    const states: DownloadState[] = []
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("network down")
    }))

    const control = await createStreamedDownload("https://example.test/model.gguf", "model.gguf", {
      onState: (state) => { states.push(state) },
    })
    const done = await control!.done

    expect(done).toBe(false)
    expect(states).toContain("error")
    expect(states).not.toContain("paused")
  })

  it("resolves done false and reports cancelled when the user cancels", async () => {
    const states: DownloadState[] = []
    vi.stubGlobal("fetch", vi.fn(async (_input: unknown, init?: RequestInit) => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          init?.signal?.addEventListener("abort", () => controller.error(abortError()))
        },
        pull(controller) {
          controller.enqueue(new Uint8Array(64))
        },
      })
      return new Response(stream, { status: 200, headers: { "content-length": "100000" } })
    }))

    const control = await createStreamedDownload("https://example.test/model.gguf", "model.gguf", {
      onState: (state) => { states.push(state) },
    })
    await until(() => states.includes("downloading"))
    control!.cancel()
    const done = await control!.done

    expect(done).toBe(false)
    expect(states.at(-1)).toBe("cancelled")
    expect(states).not.toContain("error")
  })
})
