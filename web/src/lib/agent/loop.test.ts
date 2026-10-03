import { describe, expect, it } from "vitest"

import type { ChatOnceResult, TokenUsage } from "../api"
import {
  runAgentLoop,
  type AgentEvent,
  type LoopOptions,
  type ToolDefinition,
} from "./loop"
import type { GrantStore, PermissionDecision } from "./permissions"

const usage = (prompt = 10, completion = 5): TokenUsage => ({
  prompt_tokens: prompt,
  completion_tokens: completion,
  total_tokens: prompt + completion,
})

const toolCallReply = (name: string, args: Record<string, unknown>, id = "call_1"): ChatOnceResult => ({
  content: null,
  toolCalls: [{ id, type: "function", function: { name, arguments: JSON.stringify(args) } }],
  finishReason: "tool_calls",
  usage: usage(),
})

const textReply = (content: string): ChatOnceResult => ({
  content,
  toolCalls: [],
  finishReason: "stop",
  usage: usage(7, 3),
})

const def = (name: string): ToolDefinition => ({
  spec: {
    type: "function",
    function: { name, description: `${name} tool`, parameters: { type: "object", properties: {} } },
  },
})

const memoryStore = (): GrantStore & { always: Set<string> } => {
  const always = new Set<string>()
  return {
    always,
    hasAlways: (projectId, tool) => always.has(`${projectId ?? "session"}::${tool}`),
    addAlways: (projectId, tool) => void always.add(`${projectId ?? "session"}::${tool}`),
  }
}

interface HarnessOptions {
  script: ChatOnceResult[]
  tools?: ToolDefinition[]
  bound?: string[]
  execute?: LoopOptions["executor"]["execute"]
  ask?: PermissionDecision
  maxSteps?: number
  repairLimit?: number
  compact?: LoopOptions["compact"]
}

async function run(harness: HarnessOptions) {
  const events: AgentEvent[] = []
  const requests: Array<{ messages: unknown[]; tools: unknown[] }> = []
  const executed: Array<{ name: string; args: Record<string, unknown> }> = []
  const asks: string[] = []
  const grantStore = memoryStore()
  const sessionGrants = new Set<string>()
  const controller = new AbortController()
  const tools = harness.tools ?? [def("fs_read")]
  const boundNames = harness.bound ?? tools.map((tool) => tool.spec.function.name)
  let index = 0

  const result = await runAgentLoop({
    baseUrl: "http://127.0.0.1:1/v1",
    model: "test-model",
    systemPrompt: "You are a test agent.",
    task: "inspect the repository",
    tools,
    executor: {
      bound: (name) => boundNames.includes(name),
      execute:
        harness.execute ??
        (async (name, args) => {
          executed.push({ name, args })
          return { ok: true, output: `ran ${name}` }
        }),
    },
    askPermission: async (tool) => {
      asks.push(tool)
      return harness.ask ?? "once"
    },
    projectId: "p1",
    sessionGrants,
    grantStore,
    signal: controller.signal,
    onEvent: (event) => events.push(event),
    transport: async (request) => {
      requests.push({ messages: request.messages, tools: request.tools })
      const reply = harness.script[index]
      index += 1
      if (!reply) throw new Error(`script exhausted after ${index - 1} calls`)
      return reply
    },
    ...(harness.maxSteps === undefined ? {} : { maxSteps: harness.maxSteps }),
    ...(harness.repairLimit === undefined ? {} : { repairLimit: harness.repairLimit }),
    ...(harness.compact === undefined ? {} : { compact: harness.compact }),
  })

  return { result, events, requests, executed, asks, grantStore, sessionGrants, controller }
}

describe("runAgentLoop", () => {
  it("runs a native tool call and finishes with the model's answer", async () => {
    const run_ = await run({
      script: [toolCallReply("fs_read", { path: "README.md" }), textReply("The README documents the CLI.")],
    })
    expect(run_.result.status).toBe("done")
    expect(run_.result.text).toBe("The README documents the CLI.")
    expect(run_.result.steps).toBe(1)
    expect(run_.executed).toEqual([{ name: "fs_read", args: { path: "README.md" } }])
    /* The tool result went back to the model before the final answer. */
    const followUp = run_.requests[1].messages as Array<{ role: string; content: string | null; tool_call_id?: string }>
    const toolMessage = followUp.find((message) => message.role === "tool")
    expect(toolMessage?.tool_call_id).toBe("call_1")
    expect(toolMessage?.content).toContain("ran fs_read")
    expect(run_.events.some((event) => event.type === "done")).toBe(true)
    expect(run_.result.usage?.total_tokens).toBe(25)
  })

  it("accepts the JSON fallback format from a text-only model", async () => {
    const run_ = await run({
      script: [
        textReply('I will look. ```json\n{"tool": "fs_read", "args": {"path": "a.ts"}}\n```'),
        textReply("Read a.ts."),
      ],
    })
    expect(run_.result.status).toBe("done")
    expect(run_.executed).toEqual([{ name: "fs_read", args: { path: "a.ts" } }])
  })

  it("sends one bounded repair round when the JSON is malformed, then succeeds", async () => {
    const run_ = await run({
      script: [
        textReply('```json\n{"tool": "fs_read", "args": {"path": "'),
        textReply('```json\n{"tool": "fs_read", "args": {"path": "b.ts"}}\n```'),
        textReply("done"),
      ],
    })
    expect(run_.result.status).toBe("done")
    expect(run_.result.repairs).toBe(1)
    expect(run_.events.some((event) => event.type === "repair")).toBe(true)
    const repairRequest = run_.requests[1].messages as Array<{ role: string; content: string | null }>
    expect(repairRequest.some((message) => message.role === "user" && (message.content ?? "").includes("could not be used"))).toBe(true)
  })

  it("interrupts honestly when repairs run out", async () => {
    const broken = textReply('```json\n{"tool": "fs_re')
    const run_ = await run({ script: [broken, broken, broken], repairLimit: 2 })
    expect(run_.result.status).toBe("interrupted")
    expect(run_.result.reason).toBe("unparseable_tool_call")
    expect(run_.result.repairs).toBe(3)
    expect(run_.executed).toHaveLength(0)
  })

  it("interrupts with the raw calls when no tools are bound", async () => {
    const run_ = await run({ tools: [], bound: [], script: [toolCallReply("fs_read", {})] })
    expect(run_.result.status).toBe("interrupted")
    expect(run_.result.reason).toBe("tools_not_bound")
    expect(run_.result.pendingToolCalls).toHaveLength(1)
    expect(run_.requests).toHaveLength(1)
  })

  it("enforces the step budget and reports the calls that never ran", async () => {
    const run_ = await run({
      script: [toolCallReply("fs_read", {}, "c1"), toolCallReply("fs_read", {}, "c2")],
      maxSteps: 1,
    })
    expect(run_.result.status).toBe("interrupted")
    expect(run_.result.reason).toBe("max_steps")
    expect(run_.result.steps).toBe(1)
    expect(run_.result.pendingToolCalls[0].id).toBe("c2")
    expect(run_.executed).toHaveLength(1)
  })

  it("denies a gated tool without executing it and tells the model", async () => {
    const run_ = await run({
      tools: [def("fs_write")],
      script: [toolCallReply("fs_write", { path: "x" }), textReply("Understood, skipping the write.")],
      ask: "deny",
    })
    expect(run_.result.status).toBe("done")
    expect(run_.executed).toHaveLength(0)
    expect(run_.asks).toEqual(["fs_write"])
    const followUp = run_.requests[1].messages as Array<{ role: string; content: string | null }>
    expect(followUp.some((message) => message.role === "tool" && (message.content ?? "").includes("permission denied"))).toBe(true)
    /* Deny is never remembered. */
    expect(run_.grantStore.always.size).toBe(0)
    expect(run_.sessionGrants.size).toBe(0)
  })

  it("asks once per run for a gated tool when the user chooses once", async () => {
    const run_ = await run({
      tools: [def("fs_write")],
      script: [
        toolCallReply("fs_write", { path: "a" }, "c1"),
        toolCallReply("fs_write", { path: "b" }, "c2"),
        textReply("Both writes are in."),
      ],
      ask: "once",
    })
    expect(run_.result.status).toBe("done")
    expect(run_.asks).toHaveLength(1)
    expect(run_.executed).toHaveLength(2)
  })

  it("remembers an always grant on the project", async () => {
    const run_ = await run({
      tools: [def("proc_run")],
      script: [toolCallReply("proc_run", { argv: ["git", "status"] }), textReply("clean")],
      ask: "always",
    })
    expect(run_.grantStore.always.has("p1::proc_run")).toBe(true)
  })

  it("feeds an honest 'no handler' result for a tool the model invented", async () => {
    const run_ = await run({
      tools: [def("fs_read")],
      bound: ["fs_read"],
      script: [toolCallReply("browser_click", { selector: "#x" }), textReply("ok")],
    })
    expect(run_.result.status).toBe("done")
    expect(run_.executed).toHaveLength(0)
    const followUp = run_.requests[1].messages as Array<{ role: string; content: string | null }>
    expect(followUp.some((message) => message.role === "tool" && (message.content ?? "").includes("no local handler"))).toBe(true)
  })

  it("never executes a native call with malformed arguments", async () => {
    const run_ = await run({
      script: [
        {
          content: null,
          toolCalls: [{ id: "bad", type: "function", function: { name: "fs_read", arguments: "{not json" } }],
          finishReason: "tool_calls",
          usage: usage(),
        },
        textReply("recovered"),
      ],
    })
    expect(run_.result.status).toBe("done")
    expect(run_.executed).toHaveLength(0)
    const followUp = run_.requests[1].messages as Array<{ role: string; content: string | null }>
    expect(followUp.some((message) => message.role === "tool" && (message.content ?? "").includes("not valid JSON"))).toBe(true)
  })

  it("stops immediately when already aborted", async () => {
    const controller = new AbortController()
    controller.abort()
    const result = await runAgentLoop({
      baseUrl: "http://127.0.0.1:1/v1",
      model: "m",
      systemPrompt: "s",
      task: "t",
      tools: [def("fs_read")],
      executor: { bound: () => true, execute: async () => ({ ok: true, output: "" }) },
      askPermission: async () => "once",
      projectId: null,
      sessionGrants: new Set<string>(),
      grantStore: memoryStore(),
      signal: controller.signal,
      onEvent: () => undefined,
      transport: async () => {
        throw new Error("transport must not run")
      },
    })
    expect(result.status).toBe("interrupted")
    expect(result.reason).toBe("aborted")
  })

  it("surfaces transport failures as a structured error", async () => {
    const run_ = await run({ script: [] , tools: [def("fs_read")]})
    /* Empty script → transport throws on first call. */
    expect(run_.result.status).toBe("error")
    expect(run_.result.reason).toContain("script exhausted")
    expect(run_.events.some((event) => event.type === "error")).toBe(true)
  })

  it("compacts oversized history between rounds", async () => {
    const longTask = "inspect ".repeat(120)
    const events: AgentEvent[] = []
    const requests: Array<{ messages: unknown[] }> = []
    const controller = new AbortController()
    const script: ChatOnceResult[] = [
      toolCallReply("fs_read", { path: "1" }, "c1"),
      toolCallReply("fs_read", { path: "2" }, "c2"),
      textReply("final"),
    ]
    let index = 0
    const result = await runAgentLoop({
      baseUrl: "http://127.0.0.1:1/v1",
      model: "m",
      systemPrompt: "s",
      task: longTask,
      tools: [def("fs_read")],
      executor: { bound: () => true, execute: async () => ({ ok: true, output: "x".repeat(500) }) },
      askPermission: async () => "once",
      projectId: null,
      sessionGrants: new Set<string>(),
      grantStore: memoryStore(),
      signal: controller.signal,
      onEvent: (event) => events.push(event),
      compact: { maxChars: 600, keepRecent: 2 },
      transport: async (request) => {
        requests.push({ messages: request.messages })
        const reply = script[index]
        index += 1
        if (!reply) throw new Error("script exhausted")
        return reply
      },
    })
    expect(result.status).toBe("done")
    expect(events.some((event) => event.type === "compacted")).toBe(true)
    const thirdRequest = requests[2].messages as Array<{ content: string | null }>
    expect(thirdRequest.some((message) => (message.content ?? "").includes("compacted to fit"))).toBe(true)
  })
})
