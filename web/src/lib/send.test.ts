import { describe, expect, it } from "vitest"
import { ApiError, parseRetryAfter } from "./api"
import { CONTINUE_NUDGE, canContinue, createDeltaBuffer, MAX_SEND_ATTEMPTS, retryAfterOf, retryDecision, statusOf, STREAM_FLUSH_MS } from "./send"

describe("retryDecision", () => {
  it("retries a 503 and honours the server's Retry-After", () => {
    const decision = retryDecision(503, 5, 0)
    expect(decision).toMatchObject({ retry: true, delayMs: 5000 })
    expect(decision.notice).toContain("loading")
  })

  it("falls back to exponential backoff when there is no Retry-After", () => {
    expect(retryDecision(503, null, 0).delayMs).toBe(500)
    expect(retryDecision(503, null, 1).delayMs).toBe(1000)
    expect(retryDecision(503, null, 2).delayMs).toBe(2000)
  })

  it("treats a connection failure (no HTTP status) as retryable", () => {
    const decision = retryDecision(null, null, 0)
    expect(decision.retry).toBe(true)
    expect(decision.notice).toContain("not responding")
  })

  it("gives up after the bounded attempt count", () => {
    expect(retryDecision(503, null, MAX_SEND_ATTEMPTS)).toMatchObject({ retry: false, notice: "" })
  })

  it("never retries statuses that would fail identically", () => {
    expect(retryDecision(400, null, 0).retry).toBe(false)
    expect(retryDecision(401, null, 0).retry).toBe(false)
    expect(retryDecision(404, null, 0).retry).toBe(false)
  })

  it("retries the gateway's own busy statuses", () => {
    expect(retryDecision(502, null, 0).retry).toBe(true)
    expect(retryDecision(504, null, 0).retry).toBe(true)
  })

  it("never retries once partial output reached the transcript", () => {
    expect(retryDecision(503, 5, 0, true)).toMatchObject({ retry: false, delayMs: 0, notice: "" })
  })

  it("caps a server-provided wait", () => {
    expect(retryDecision(503, 9999, 0).delayMs).toBe(15_000)
  })
})

describe("parseRetryAfter", () => {
  it("reads seconds and caps them", () => {
    expect(parseRetryAfter("5")).toBe(5)
    expect(parseRetryAfter(" 2 ")).toBe(2)
    expect(parseRetryAfter("9999")).toBe(15)
  })

  it("rejects dates and nonsense", () => {
    expect(parseRetryAfter(null)).toBeNull()
    expect(parseRetryAfter("Wed, 21 Oct 2026 07:28:00 GMT")).toBeNull()
    expect(parseRetryAfter("-1")).toBeNull()
    expect(parseRetryAfter("soon")).toBeNull()
  })
})

describe("statusOf / retryAfterOf", () => {
  it("reads fields off an ApiError", () => {
    const error = new ApiError("restarting", 503, 2)
    expect(statusOf(error)).toBe(503)
    expect(retryAfterOf(error)).toBe(2)
  })

  it("treats any other thrown value as a non-HTTP failure", () => {
    expect(statusOf(new Error("boom"))).toBeNull()
    expect(retryAfterOf("nope")).toBeNull()
  })
})

describe("createDeltaBuffer", () => {
  const harness = (intervalMs = STREAM_FLUSH_MS) => {
    const flushes: string[] = []
    const scheduled: Array<() => void> = []
    const cancelled: number[] = []
    const buffer = createDeltaBuffer(
      (chunk) => flushes.push(chunk),
      intervalMs,
      (fn) => { scheduled.push(fn); return scheduled.length },
      (id) => cancelled.push(id),
    )
    return { flushes, scheduled, cancelled, buffer }
  }

  it("coalesces the deltas of one interval into a single flush", () => {
    const { flushes, scheduled, buffer } = harness()
    buffer.push("Hello")
    buffer.push(" ")
    buffer.push("world")
    expect(scheduled.length).toBe(1)
    expect(flushes).toEqual([])
    expect(buffer.pending).toBe("Hello world")
    scheduled[0]()
    expect(flushes).toEqual(["Hello world"])
    expect(buffer.pending).toBe("")
  })

  it("schedules the next interval after one fires", () => {
    const { flushes, scheduled, buffer } = harness()
    buffer.push("a")
    scheduled[0]()
    buffer.push("b")
    expect(scheduled.length).toBe(2)
    scheduled[1]()
    expect(flushes).toEqual(["a", "b"])
  })

  it("flush hands pending over immediately and cancels the timer", () => {
    const { flushes, scheduled, cancelled, buffer } = harness()
    buffer.push("tail")
    buffer.flush()
    expect(scheduled.length).toBe(1)
    expect(cancelled).toEqual([1])
    expect(flushes).toEqual(["tail"])
    expect(buffer.pending).toBe("")
  })

  it("flush with nothing pending calls back nothing", () => {
    const { flushes, buffer } = harness()
    buffer.flush()
    expect(flushes).toEqual([])
  })

  it("uses a UI-safe throttle interval by default", () => {
    expect(STREAM_FLUSH_MS).toBeGreaterThan(0)
    expect(STREAM_FLUSH_MS).toBeLessThanOrEqual(200)
  })
})

describe("canContinue", () => {
  it("continues only a stopped assistant answer that is last", () => {
    expect(canContinue({ role: "assistant", stopped: true }, true)).toBe(true)
    expect(canContinue({ role: "assistant", stopped: true }, false)).toBe(false)
    expect(canContinue({ role: "assistant" }, true)).toBe(false)
    expect(canContinue({ role: "user", stopped: true }, true)).toBe(false)
  })

  it("ships a non-empty continuation nudge", () => {
    expect(CONTINUE_NUDGE.trim().length).toBeGreaterThan(0)
  })
})
