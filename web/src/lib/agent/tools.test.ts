import { describe, expect, it } from "vitest"

import { agentToolsForMode, AGENT_TOOL_NAMES, READ_ONLY_TOOL_NAMES, SUBAGENT_TOOL_NAMES } from "./tools"
import { modePolicy } from "./sessions"

const names = (result: ReturnType<typeof agentToolsForMode>) =>
  result.map((tool) => tool.spec.function.name)

describe("agentToolsForMode", () => {
  const available = { available: true, hasProject: true }

  it("binds nothing for chat and explain", () => {
    expect(names(agentToolsForMode(modePolicy("chat"), available))).toEqual([])
    expect(names(agentToolsForMode(modePolicy("explain"), available))).toEqual([])
  })

  it("plan/read-only includes fs reads, todo and web_fetch — never writes, proc or subagent", () => {
    const bound = names(agentToolsForMode(modePolicy("plan"), available))
    expect(bound).toEqual(READ_ONLY_TOOL_NAMES)
    expect(bound).toContain("web_fetch")
    expect(bound).not.toContain("fs_write")
    expect(bound).not.toContain("proc_run")
    expect(bound).not.toContain("subagent")
  })

  it("build and debug bind the full surface", () => {
    expect(names(agentToolsForMode(modePolicy("build"), available))).toEqual(AGENT_TOOL_NAMES)
    expect(names(agentToolsForMode(modePolicy("debug"), available))).toEqual(AGENT_TOOL_NAMES)
  })

  it("binds nothing without the desktop shell or a project folder", () => {
    expect(names(agentToolsForMode(modePolicy("build"), { available: false, hasProject: true }))).toEqual([])
    expect(names(agentToolsForMode(modePolicy("build"), { available: true, hasProject: false }))).toEqual([])
  })

  it("the sub-agent surface is read-only without todo or nested sub-agents", () => {
    expect(SUBAGENT_TOOL_NAMES).toEqual(["fs_read", "fs_list", "web_fetch"])
    expect(AGENT_TOOL_NAMES).toContain("subagent")
    expect(AGENT_TOOL_NAMES).toContain("web_fetch")
  })
})
