import { describe, expect, it } from "vitest"
import {
  AUTO_COMPACT_PERCENT,
  CHARS_PER_TOKEN,
  compactChatHistory,
  contextUsage,
  estimateMessagesTokens,
  estimateTextTokens,
  parseContextLimit,
} from "./context"

describe("estimateTextTokens", () => {
  it("returns 0 for empty text", () => {
    expect(estimateTextTokens("")).toBe(0)
  })

  it("estimates ceil(chars / 4)", () => {
    expect(estimateTextTokens("a".repeat(CHARS_PER_TOKEN))).toBe(1)
    expect(estimateTextTokens("a".repeat(10))).toBe(3)
  })
})

describe("estimateMessagesTokens", () => {
  it("adds a per-message overhead", () => {
    const alone = estimateTextTokens("hello")
    const withOverhead = estimateMessagesTokens([{ role: "user", content: "hello" }])
    expect(withOverhead).toBe(alone + 4)
  })

  it("tolerates missing content", () => {
    expect(estimateMessagesTokens([{ role: "assistant" }])).toBe(4)
  })
})

describe("parseContextLimit", () => {
  it("parses plain numbers and k/m suffixes", () => {
    expect(parseContextLimit("8192")).toBe(8192)
    expect(parseContextLimit("32k")).toBe(32_000)
    expect(parseContextLimit("128K")).toBe(128_000)
    expect(parseContextLimit("1m")).toBe(1_000_000)
  })

  it("falls back for catalogue placeholders", () => {
    expect(parseContextLimit("Architecture dependent")).toBe(8192)
    expect(parseContextLimit("—")).toBe(8192)
    expect(parseContextLimit("")).toBe(8192)
    expect(parseContextLimit(undefined)).toBe(8192)
    expect(parseContextLimit("0k")).toBe(8192)
  })

  it("honours a custom fallback", () => {
    expect(parseContextLimit("n/a", 4096)).toBe(4096)
  })
})

describe("contextUsage", () => {
  it("reports percent against the limit", () => {
    const usage = contextUsage([{ role: "user", content: "a".repeat(800) }], 8192)
    expect(usage.limitTokens).toBe(8192)
    expect(usage.percent).toBeGreaterThan(0)
    expect(usage.percent).toBeLessThanOrEqual(100)
  })

  it("caps at 100 and uses the default limit when invalid", () => {
    const usage = contextUsage([{ role: "user", content: "a".repeat(40_000) }], 0)
    expect(usage.limitTokens).toBe(8192)
    expect(usage.percent).toBe(100)
  })
})

describe("compactChatHistory", () => {
  const marker = (summary: string) => ({ role: "user" as const, content: summary })
  const turns = Array.from({ length: 10 }, (_, index) => ({
    role: index % 2 === 0 ? "user" : "assistant",
    content: `message ${index}`,
  }))

  it("does nothing for short histories", () => {
    const short = turns.slice(0, 4)
    const outcome = compactChatHistory(short, { keepRecent: 6 }, marker)
    expect(outcome.dropped).toBe(0)
    expect(outcome.messages).toBe(short)
  })

  it("replaces the oldest turns with one summary marker", () => {
    const outcome = compactChatHistory(turns, { keepRecent: 6 }, marker)
    expect(outcome.dropped).toBe(4)
    expect(outcome.messages).toHaveLength(7)
    expect(outcome.messages[0].role).toBe("user")
    expect(outcome.messages[0].content).toContain("summarized")
    expect(outcome.messages[0].content).toContain("message 0")
    expect(outcome.messages[1].content).toBe("message 4")
  })

  it("exposes the auto-compact threshold as a constant", () => {
    expect(AUTO_COMPACT_PERCENT).toBeGreaterThanOrEqual(70)
    expect(AUTO_COMPACT_PERCENT).toBeLessThanOrEqual(95)
  })
})
