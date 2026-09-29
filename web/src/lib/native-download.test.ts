import { describe, expect, it } from "vitest"
import { friendlyQdmError, qdmStatusToTaskState } from "./native-download"

describe("qdmStatusToTaskState", () => {
  it("keeps cancelled (stopped) transfers visible as history instead of dropping them", () => {
    expect(qdmStatusToTaskState("stopped")).toBe("cancelled")
  })

  it("maps every other engine status to its task state", () => {
    expect(qdmStatusToTaskState("queued")).toBe("queued")
    expect(qdmStatusToTaskState("downloading")).toBe("downloading")
    expect(qdmStatusToTaskState("assembling")).toBe("downloading")
    expect(qdmStatusToTaskState("paused")).toBe("paused")
    expect(qdmStatusToTaskState("completed")).toBe("complete")
    expect(qdmStatusToTaskState("failed")).toBe("error")
  })
})

describe("friendlyQdmError", () => {
  it("translates engine-specific failures into actionable messages", () => {
    expect(friendlyQdmError(null)).toBe("The download failed.")
    expect(friendlyQdmError("auth_required: 401")).toContain("requires credentials")
    expect(friendlyQdmError("link_expired")).toContain("expired")
    expect(friendlyQdmError("assembling_failed")).toContain("assembled")
    expect(friendlyQdmError("connection reset by peer")).toBe("connection reset by peer")
  })
})
