/* Integration: the agent loop against a mock OpenAI-shaped gateway over
   real HTTP (loopback, stdlib only — nothing leaves the machine). The
   server mimics what `syntara serve` relays from a local runtime: native
   `tool_calls` for one tool set, the JSON fence fallback for the other,
   and an OpenAI-shaped error with Retry-After. */

import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import type { AddressInfo } from "node:net"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { ApiError, chatOnce, type WireMessage } from "../api"
import { runAgentLoop, type ToolDefinition } from "./loop"
import type { GrantStore } from "./permissions"

interface ChatBody {
  model?: string
  messages?: WireMessage[]
  tools?: unknown[]
  stream?: boolean
}

let server: Server
let baseUrl = ""
let requestsSeen: ChatBody[] = []

const json = (res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) => {
  res.writeHead(status, { "Content-Type": "application/json", ...headers })
  res.end(JSON.stringify(body))
}

const finalReply = (content: string) => ({
  choices: [{ message: { role: "assistant", content }, finish_reason: "stop" }],
  usage: { prompt_tokens: 9, completion_tokens: 4, total_tokens: 13 },
})

function handleChat(body: ChatBody, res: ServerResponse) {
  const messages = body.messages ?? []
  const toolResults = messages.filter((message) => message.role === "tool")
  const tools = Array.isArray(body.tools) ? body.tools : []
  const toolNames = tools
    .map((spec) => (spec as { function?: { name?: string } })?.function?.name)
    .filter((name): name is string => typeof name === "string")

  if (toolNames.includes("fs_read")) {
    /* Native dialect: emit an OpenAI tool_calls round, then answer from
       whatever the tool reported back. */
    if (toolResults.length === 0) {
      json(res, 200, {
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                { id: "call_native", type: "function", function: { name: "fs_read", arguments: '{"path":"README.md"}' } },
              ],
            },
            finish_reason: "tool_calls",
          },
        ],
        usage: { prompt_tokens: 12, completion_tokens: 6, total_tokens: 18 },
      })
      return
    }
    json(res, 200, finalReply(`README observed: ${(JSON.parse(toolResults[0].content ?? "{}") as { output?: string }).output ?? ""}`))
    return
  }

  if (toolNames.includes("proc_run")) {
    /* Text-only dialect: the model ignores native tools and answers with
       the fenced JSON fallback the system prompt documents. */
    if (toolResults.length === 0) {
      json(res, 200, finalReply('Running the command. ```json\n{"tool": "proc_run", "args": {"argv": ["git", "status"]}}\n```'))
      return
    }
    json(res, 200, finalReply("Command finished clean."))
    return
  }

  json(res, 200, finalReply("plain answer"))
}

function handle(req: IncomingMessage, res: ServerResponse) {
  let raw = ""
  req.on("data", (chunk: Buffer) => {
    raw += chunk.toString("utf8")
  })
  req.on("end", () => {
    if (req.url === "/v1/chat/completions" && req.method === "POST") {
      let body: ChatBody = {}
      try {
        body = JSON.parse(raw) as ChatBody
      } catch {
        json(res, 400, { error: { message: "invalid JSON" } })
        return
      }
      requestsSeen.push(body)
      if (body.model === "fail-model") {
        json(res, 503, { error: { message: "runtime is loading" } }, { "Retry-After": "2" })
        return
      }
      if (body.model !== "test-model") {
        json(res, 404, { error: { message: "model_not_found" } })
        return
      }
      handleChat(body, res)
      return
    }
    json(res, 404, { error: { message: "not found" } })
  })
}

const memoryStore = (): GrantStore => {
  const always = new Set<string>()
  return {
    hasAlways: (projectId, tool) => always.has(`${projectId ?? "session"}::${tool}`),
    addAlways: (projectId, tool) => void always.add(`${projectId ?? "session"}::${tool}`),
  }
}

const def = (name: string): ToolDefinition => ({
  spec: {
    type: "function",
    function: { name, description: `${name} tool`, parameters: { type: "object", properties: {} } },
  },
})

beforeAll(async () => {
  server = createServer(handle)
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const { port } = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${port}/v1`
  requestsSeen = []
})

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

describe("agent loop vs mock gateway", () => {
  it("chatOnce speaks the wire format (non-streaming, verbatim tool round-trip)", async () => {
    requestsSeen = []
    const first = await chatOnce({
      baseUrl,
      model: "test-model",
      messages: [
        { role: "system", content: "sys" },
        { role: "user", content: "read it" },
      ],
      tools: [def("fs_read").spec],
    })
    expect(first.toolCalls[0].function.name).toBe("fs_read")
    expect(requestsSeen[0].stream).toBe(false)
    expect(requestsSeen[0].messages?.[0].role).toBe("system")

    const second = await chatOnce({
      baseUrl,
      model: "test-model",
      messages: [
        ...first.toolCalls.map((call) => ({ role: "assistant" as const, content: null, tool_calls: [call] })),
        { role: "tool" as const, tool_call_id: first.toolCalls[0].id, content: '{"ok":true,"output":"docs"}' },
      ],
      tools: [def("fs_read").spec],
    })
    expect(second.content).toContain("README observed: docs")
    expect(second.toolCalls).toHaveLength(0)
  })

  it("maps gateway failures to ApiError with Retry-After", async () => {
    await expect(
      chatOnce({ baseUrl, model: "fail-model", messages: [{ role: "user", content: "hi" }] }),
    ).rejects.toMatchObject({ name: "ApiError", status: 503, retryAfterSeconds: 2 })
    await expect(
      chatOnce({ baseUrl, model: "missing-model", messages: [{ role: "user", content: "hi" }] }),
    ).rejects.toBeInstanceOf(ApiError)
  })

  it("completes a native tool round-trip over real HTTP", async () => {
    requestsSeen = []
    const executed: string[] = []
    const result = await runAgentLoop({
      baseUrl,
      model: "test-model",
      systemPrompt: "sys",
      task: "read the readme",
      tools: [def("fs_read")],
      executor: {
        bound: () => true,
        execute: async () => {
          executed.push("fs_read")
          return { ok: true, output: "docs" }
        },
      },
      askPermission: async () => "once",
      projectId: "p1",
      sessionGrants: new Set<string>(),
      grantStore: memoryStore(),
      signal: new AbortController().signal,
      onEvent: () => undefined,
    })
    expect(result.status).toBe("done")
    expect(result.text).toContain("README observed: docs")
    expect(executed).toEqual(["fs_read"])
    expect(requestsSeen.length).toBe(2)
    expect(requestsSeen[1].messages?.some((message) => message.role === "tool")).toBe(true)
  })

  it("completes a JSON-fallback tool round-trip over real HTTP", async () => {
    const executed: Array<Record<string, unknown>> = []
    const result = await runAgentLoop({
      baseUrl,
      model: "test-model",
      systemPrompt: "sys",
      task: "run git status",
      tools: [def("proc_run")],
      executor: {
        bound: () => true,
        execute: async (_name, args) => {
          executed.push(args)
          return { ok: true, output: "nothing to commit" }
        },
      },
      askPermission: async () => "once",
      projectId: "p1",
      sessionGrants: new Set<string>(),
      grantStore: memoryStore(),
      signal: new AbortController().signal,
      onEvent: () => undefined,
    })
    expect(result.status).toBe("done")
    expect(result.text).toBe("Command finished clean.")
    expect(executed).toEqual([{ argv: ["git", "status"] }])
  })
})
