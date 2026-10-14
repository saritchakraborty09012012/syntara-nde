import { describe, expect, it } from "vitest"

import { classifyTask, shouldSuggestOtherMode } from "@/lib/mode-fit"

describe("classifyTask", () => {
  it("flags code, repo and folder work as code-project", () => {
    expect(classifyTask("fix the parser bug in utils.ts")).toBe("code-project")
    expect(classifyTask("review this repository and list risks")).toBe("code-project")
    expect(classifyTask("what does the src folder do?")).toBe("code-project")
    expect(classifyTask("why does my python tests fail?")).toBe("code-project")
  })

  it("flags clearly general writing work as general", () => {
    expect(classifyTask("write a poem about the sea")).toBe("general")
    expect(classifyTask("translate this email to Hindi")).toBe("general")
    expect(classifyTask("give me a short story about a robot")).toBe("general")
  })

  it("stays unknown for ambiguous asks", () => {
    expect(classifyTask("tell me about black holes")).toBe("unknown")
    expect(classifyTask("hello there")).toBe("unknown")
  })
})

describe("shouldSuggestOtherMode", () => {
  it("nudges code tasks in chat toward agent", () => {
    expect(shouldSuggestOtherMode("refactor the download module", "chat")).toBe(true)
    expect(shouldSuggestOtherMode("write a haiku", "chat")).toBe(false)
    expect(shouldSuggestOtherMode("hello", "chat")).toBe(false)
  })

  it("nudges general tasks in agent toward chat — never code/folder ones", () => {
    expect(shouldSuggestOtherMode("write a poem about rivers", "agent")).toBe(true)
    expect(shouldSuggestOtherMode("explain this repo structure", "agent")).toBe(false)
    expect(shouldSuggestOtherMode("why does the build fail?", "agent")).toBe(false)
    expect(shouldSuggestOtherMode("tell me about black holes", "agent")).toBe(false)
  })
})
