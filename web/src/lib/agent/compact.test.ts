import { describe, expect, it } from "vitest"

import type { WireMessage } from "../api"
import { compactMessages } from "./compact"

const msg = (role: WireMessage["role"], content: string, extra: Partial<WireMessage> = {}): WireMessage => ({
  role,
  content,
  ...extra,
})

const big = (tag: string, size = 4000): string => `${tag}:${"x".repeat(size)}`

describe("compactMessages", () => {
  it("leaves a small transcript untouched", () => {
    const messages = [msg("system", "s"), msg("user", "task"), msg("assistant", "hi")]
    const outcome = compactMessages(messages, { maxChars: 10000, keepRecent: 2 })
    expect(outcome.dropped).toBe(0)
    expect(outcome.messages).toEqual(messages)
  })

  it("replaces old tool rounds with a marker and keeps the recent window", () => {
    const messages: WireMessage[] = [
      msg("system", "system prompt"),
      msg("user", "the task"),
      msg("assistant", "calling", { tool_calls: [{ id: "c1", type: "function", function: { name: "fs_read", arguments: "{}" } }] }),
      msg("tool", big("old-result")),
      msg("assistant", "calling again", { tool_calls: [{ id: "c2", type: "function", function: { name: "proc_run", arguments: "{}" } }] }),
      msg("tool", big("newer-result")),
      msg("assistant", "latest plan"),
      msg("user", "latest nudge"),
    ]
    const outcome = compactMessages(messages, { maxChars: 6000, keepRecent: 2 })
    expect(outcome.dropped).toBeGreaterThan(0)
    expect(outcome.messages[0]).toEqual(messages[0])
    expect(outcome.messages[1]).toEqual(messages[1])
    const marker = outcome.messages[2]
    expect(marker.role).toBe("user")
    expect(marker.content).toContain("compacted")
    expect(marker.content).toContain("fs_read")
    /* The recent window survives verbatim. */
    expect(outcome.messages.slice(-2)).toEqual(messages.slice(-2))
    /* The window never starts with an orphaned tool result. */
    expect(outcome.messages[3].role).not.toBe("tool")
  })

  it("never splits an assistant tool_calls message from its tool result", () => {
    const messages: WireMessage[] = [
      msg("system", "s"),
      msg("user", big("task", 8000)),
      msg("assistant", "a", { tool_calls: [{ id: "c1", type: "function", function: { name: "fs_read", arguments: "{}" } }] }),
      msg("tool", big("result-1"), { tool_call_id: "c1" }),
      msg("assistant", "b", { tool_calls: [{ id: "c2", type: "function", function: { name: "fs_read", arguments: "{}" } }] }),
      msg("tool", big("result-2"), { tool_call_id: "c2" }),
    ]
    const outcome = compactMessages(messages, { maxChars: 5000, keepRecent: 1 })
    /* keepRecent=1 points at the tool result; the start must walk back to
       the assistant that owns the tool_calls. */
    const windowStart = outcome.messages.findIndex((_, index) => index >= 2)
    expect(outcome.messages[windowStart].role).not.toBe("tool")
    const toolsInWindow = outcome.messages.filter((message) => message.role === "tool")
    for (const tool of toolsInWindow) {
      const ownerIndex = outcome.messages.findIndex(
        (message) => message.tool_calls?.some((call) => call.id === tool.tool_call_id),
      )
      expect(ownerIndex).toBeGreaterThanOrEqual(0)
      expect(ownerIndex).toBeLessThan(outcome.messages.indexOf(tool))
    }
  })

  it("stays quiet when the head would swallow everything", () => {
    const messages = [msg("system", "s"), msg("user", "task"), msg("assistant", "only")]
    const outcome = compactMessages(messages, { maxChars: 10, keepRecent: 5 })
    expect(outcome.dropped).toBe(0)
  })
})
