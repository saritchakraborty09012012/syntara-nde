import { describe, expect, it } from "vitest"
import { ApiError, parseRetryAfter } from "./api"
import { MAX_SEND_ATTEMPTS, retryAfterOf, retryDecision, statusOf } from "./send"

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
