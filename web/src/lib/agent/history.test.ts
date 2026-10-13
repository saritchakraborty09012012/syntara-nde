import { describe, expect, it } from "vitest"
import { compactSessionHistory, sessionHistoryTurns, sessionMessages, turnAnswerText } from "./history"
import type { AgentEvent } from "./loop"
import type { AgentTurn } from "./sessions"

function turn(task: string, events: AgentEvent[], status: AgentTurn["status"] = "done"): AgentTurn {
  return { id: task, task, mode: "build", events, status, at: 0 }
}

describe("turnAnswerText", () => {
  it("prefers the final done event", () => {
    const text = turnAnswerText(
      turn("t", [
        { type: "assistant_text", text: "partial" },
        { type: "done", text: "final answer", steps: 2 },
      ]),
    )
    expect(text).toBe("final answer")
  })

  it("reports the error message for a failed turn", () => {
    const text = turnAnswerText(turn("t", [{ type: "error", message: "the gateway refused" }], "error"))
    expect(text).toBe("(the gateway refused)")
  })

  it("falls back to streamed text and tool output for a live turn", () => {
    const text = turnAnswerText(
      turn(
        "t",
        [
          { type: "assistant_text", text: "thinking" },
          { type: "tool_end", callId: "c1", name: "fs_read", ok: true, output: "file body", durationMs: 3 },
        ],
        "running",
      ),
    )
    expect(text).toContain("thinking")
    expect(text).toContain("file body")
  })

  it("never returns an empty string for a finished turn", () => {
    expect(turnAnswerText(turn("t", [], "done"))).toBe("(no answer)")
    expect(turnAnswerText(turn("t", [], "stopped"))).toBe("(stopped before answering)")
    expect(turnAnswerText(turn("t", [], "running"))).toBe("")
  })
})

describe("sessionMessages", () => {
  it("emits one user/assistant pair per turn", () => {
    const messages = sessionMessages(sessionHistoryTurns([turn("first", [{ type: "done", text: "ok", steps: 1 }])]))
    expect(messages).toEqual([
      { role: "user", content: "first" },
      { role: "assistant", content: "ok" },
    ])
  })
})

describe("compactSessionHistory", () => {
  const bigTurn = (index: number) =>
    turn(`task ${index}`, [{ type: "done", text: "x".repeat(4000), steps: 1 }])

  it("keeps everything while the session fits the budget", () => {
    const outcome = compactSessionHistory(sessionHistoryTurns([turn("a", [{ type: "done", text: "hi", steps: 1 }])]), 8192)
    expect(outcome.droppedTurns).toBe(0)
    expect(outcome.messages).toHaveLength(2)
  })

  it("drops the oldest turns behind a marker until it fits", () => {
    const turns = sessionHistoryTurns(Array.from({ length: 8 }, (_, index) => bigTurn(index + 1)))
    const outcome = compactSessionHistory(turns, 8192)
    expect(outcome.droppedTurns).toBeGreaterThan(0)
    expect(outcome.messages[0].content).toContain("compacted")
    expect(outcome.messages[0].role).toBe("user")
    /* The newest turn always survives. */
    expect(outcome.messages.some((message) => message.content?.includes("task 8"))).toBe(true)
    expect(outcome.messages.length).toBeLessThan(turns.length * 2)
  })

  it("never drops the only remaining turn", () => {
    const outcome = compactSessionHistory(sessionHistoryTurns([bigTurn(1), bigTurn(2)]), 1)
    expect(outcome.messages.length).toBeGreaterThanOrEqual(2)
    expect(outcome.messages.some((message) => message.content?.includes("task 2"))).toBe(true)
  })
})
