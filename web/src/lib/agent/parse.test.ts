import { describe, expect, it } from "vitest"

import { buildRepairMessage, extractJsonToolCall, parseNativeArguments } from "./parse"

const TOOLS = ["fs_read", "proc_run"]

describe("extractJsonToolCall", () => {
  it("parses a fenced JSON tool call", () => {
    const text = '```json\n{"tool": "fs_read", "args": {"path": "README.md"}}\n```'
    expect(extractJsonToolCall(text, TOOLS)).toEqual({
      status: "parsed",
      name: "fs_read",
      args: { path: "README.md" },
    })
  })

  it("parses a bare JSON object among prose", () => {
    const text = 'I will check the file now. {"tool": "proc_run", "args": {"argv": ["git", "status"]}}'
    expect(extractJsonToolCall(text, TOOLS)).toEqual({
      status: "parsed",
      name: "proc_run",
      args: { argv: ["git", "status"] },
    })
  })

  it("accepts args/arguments/parameters key variants and defaults to {}", () => {
    expect(extractJsonToolCall('{"tool": "fs_read", "arguments": {"path": "a"}}', TOOLS)).toMatchObject({ status: "parsed", args: { path: "a" } })
    expect(extractJsonToolCall('{"tool": "fs_read", "parameters": {"path": "b"}}', TOOLS)).toMatchObject({ status: "parsed", args: { path: "b" } })
    expect(extractJsonToolCall('{"tool": "fs_read"}', TOOLS)).toMatchObject({ status: "parsed", args: {} })
  })

  it("treats an unclosed fence with broken JSON as malformed (repair)", () => {
    const text = '```json\n{"tool": "fs_read", "args": {"path": "README'
    expect(extractJsonToolCall(text, TOOLS)).toEqual({
      status: "malformed",
      reason: "the JSON inside the ``` fence did not parse",
    })
  })

  it("treats a fence without a tool object as malformed", () => {
    expect(extractJsonToolCall('```json\n{"answer": 42}\n```', TOOLS).status).toBe("malformed")
  })

  it("ignores braces inside string literals when scanning bare objects", () => {
    const text = 'Result: {"tool": "proc_run", "args": {"argv": ["echo", "{not}json"]}}'
    expect(extractJsonToolCall(text, TOOLS)).toEqual({
      status: "parsed",
      name: "proc_run",
      args: { argv: ["echo", "{not}json"] },
    })
  })

  it("returns absent for plain prose", () => {
    expect(extractJsonToolCall("Just an answer with a { brace and no call.", TOOLS)).toEqual({ status: "absent" })
    expect(extractJsonToolCall("", TOOLS)).toEqual({ status: "absent" })
  })

  it("does not treat a prose JSON answer as a call when the name is unbound and the key is name", () => {
    expect(extractJsonToolCall('{"name": "Syntara", "kind": "product"}', TOOLS)).toEqual({ status: "absent" })
    expect(extractJsonToolCall('{"name": "fs_read", "args": {"path": "x"}}', TOOLS)).toEqual({
      status: "parsed",
      name: "fs_read",
      args: { path: "x" },
    })
  })

  it("still reports a call on the documented `tool` key even for an unknown name", () => {
    /* The model asked for something we do not bind — the loop feeds back an
       honest 'no handler' result instead of finalising a wrong answer. */
    expect(extractJsonToolCall('{"tool": "browser_click", "args": {}}', TOOLS)).toEqual({
      status: "parsed",
      name: "browser_click",
      args: {},
    })
  })
})

describe("parseNativeArguments", () => {
  it("parses object arguments", () => {
    expect(parseNativeArguments('{"path": "a.txt"}')).toEqual({ ok: true, args: { path: "a.txt" } })
    expect(parseNativeArguments("")).toEqual({ ok: true, args: {} })
  })

  it("rejects invalid JSON and non-object values", () => {
    expect(parseNativeArguments("{oops")).toMatchObject({ ok: false })
    expect(parseNativeArguments("[1,2]")).toMatchObject({ ok: false })
  })
})

describe("buildRepairMessage", () => {
  it("states the reason and shows the exact shape", () => {
    const message = buildRepairMessage("the JSON inside the ``` fence did not parse")
    expect(message).toContain("the JSON inside the ``` fence did not parse")
    expect(message).toContain('{"tool": "<one of the available tool names>", "args": { ... }}')
  })
})
