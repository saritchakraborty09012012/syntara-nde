import { describe, expect, it } from "vitest"

import { agentToolsAvailable } from "./agent-tools"

describe("agentToolsAvailable", () => {
  it("is false outside the desktop shell (node/vitest, plain browser)", () => {
    /* The agent loop must then report tools_not_bound honestly instead of
       pretending a tool ran; this pins the detection contract the loop
       relies on. */
    expect(agentToolsAvailable()).toBe(false)
  })
})
