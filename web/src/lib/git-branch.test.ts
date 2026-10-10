import { describe, expect, it } from "vitest"
import { parseGitHead } from "./git-branch"

describe("parseGitHead", () => {
  it("parses a symbolic ref", () => {
    expect(parseGitHead("ref: refs/heads/main\n")).toBe("main")
    expect(parseGitHead("ref: refs/heads/feature/ui-rework")).toBe("feature/ui-rework")
  })

  it("parses a detached HEAD sha as a short id", () => {
    expect(parseGitHead("4b35ca7c9d2f1a0b8e6d5c4b3a2f1e0d9c8b7a65")).toBe("4b35ca7")
  })

  it("rejects garbage and empty content", () => {
    expect(parseGitHead("")).toBeNull()
    expect(parseGitHead("not-a-head")).toBeNull()
    expect(parseGitHead("ref: refs/tags/v1.0")).toBeNull()
  })
})
