import { describe, expect, it } from "vitest"

import { validateFetchUrl, validateLocalPreviewUrl } from "./webfetch"

describe("validateFetchUrl", () => {
  it("accepts absolute http(s) URLs", () => {
    expect(validateFetchUrl("https://example.com/docs")).toEqual({ ok: true, url: "https://example.com/docs" })
    expect(validateFetchUrl("http://127.0.0.1:8080/").ok).toBe(true)
    expect(validateFetchUrl("  https://example.com  ")).toEqual({ ok: true, url: "https://example.com/" })
  })

  it("rejects a missing or empty URL", () => {
    expect(validateFetchUrl(undefined)).toEqual({ ok: false, reason: "missing 'url' argument" })
    expect(validateFetchUrl("")).toEqual({ ok: false, reason: "missing 'url' argument" })
    expect(validateFetchUrl("   ")).toEqual({ ok: false, reason: "missing 'url' argument" })
    expect(validateFetchUrl(42)).toEqual({ ok: false, reason: "missing 'url' argument" })
  })

  it("rejects non-http schemes", () => {
    const result = validateFetchUrl("file:///etc/passwd")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain("unsupported URL scheme")
    expect(validateFetchUrl("data:text/plain,hi").ok).toBe(false)
    expect(validateFetchUrl("not a url").ok).toBe(false)
  })

  it("rejects URLs with embedded credentials", () => {
    const result = validateFetchUrl("https://user:pass@example.com/")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain("credentials")
  })
})

describe("validateLocalPreviewUrl", () => {
  it("accepts loopback dev servers", () => {
    expect(validateLocalPreviewUrl("http://127.0.0.1:5173")).toEqual({ ok: true, url: "http://127.0.0.1:5173/" })
    expect(validateLocalPreviewUrl("http://localhost:3000/app").ok).toBe(true)
    expect(validateLocalPreviewUrl("http://[::1]:8080").ok).toBe(true)
  })

  it("normalises 0.0.0.0 to what an iframe can load", () => {
    const result = validateLocalPreviewUrl("http://0.0.0.0:8080/")
    expect(result).toEqual({ ok: true, url: "http://127.0.0.1:8080/" })
  })

  it("refuses non-loopback hosts", () => {
    const result = validateLocalPreviewUrl("https://example.com")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain("not a loopback address")
  })

  it("inherits the shared scheme and shape checks", () => {
    expect(validateLocalPreviewUrl("file:///etc/passwd").ok).toBe(false)
    expect(validateLocalPreviewUrl("").ok).toBe(false)
  })
})
