import { describe, expect, it } from "vitest"

import { validateFetchUrl } from "./webfetch"

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
