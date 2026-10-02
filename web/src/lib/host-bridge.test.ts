import { describe, expect, it } from "vitest"
import { hostBaseFromStatus, waitHostReady, type HostStatus } from "./host-bridge"

const status = (over: Partial<HostStatus> = {}): HostStatus => ({
  state: "running",
  url: "http://127.0.0.1:8000",
  port: 8000,
  model: "tiny.gguf",
  pid: 4242,
  exitCode: null,
  reason: null,
  log: "C:/logs/syntara-host.log",
  health: null,
  ...over,
})

describe("waitHostReady", () => {
  it("keeps polling until the gateway reports a loaded model", async () => {
    let polls = 0
    const ready = await waitHostReady({
      intervalMs: 1,
      getStatus: async () => {
        polls += 1
        return polls < 3 ? status() : status({ health: { status: "ready", model: "qwen-8b" } })
      },
    })
    expect(polls).toBe(3)
    expect(ready.health?.model).toBe("qwen-8b")
  })

  it("surfaces the shell's reason when the host is not running", async () => {
    await expect(
      waitHostReady({
        intervalMs: 1,
        getStatus: async () => status({ state: "failed", reason: "SYNTARA_PYTHON points at a path that does not exist" }),
      }),
    ).rejects.toThrow("SYNTARA_PYTHON points at a path that does not exist")
  })

  it("surfaces the gateway error when the model fails to load", async () => {
    await expect(
      waitHostReady({
        intervalMs: 1,
        getStatus: async () =>
          status({ health: { status: "failed", error: "llama runner exited with code 1" } }),
      }),
    ).rejects.toThrow("the model failed to load: llama runner exited with code 1")
  })

  it("gives up after the deadline with an actionable message", async () => {
    await expect(
      waitHostReady({ tries: 3, intervalMs: 1, getStatus: async () => status() }),
    ).rejects.toThrow(/still loading after .*check the host log/)
  })
})

describe("hostBaseFromStatus", () => {
  it("points a running host at its gateway base URL", () => {
    expect(hostBaseFromStatus({ state: "running", url: "http://127.0.0.1:8000" })).toBe("http://127.0.0.1:8000/v1")
  })

  it("tolerates a trailing slash on the host URL", () => {
    expect(hostBaseFromStatus({ state: "running", url: "http://127.0.0.1:8000/" })).toBe("http://127.0.0.1:8000/v1")
  })

  it("returns null when there is nothing to connect to yet", () => {
    expect(hostBaseFromStatus({ state: "no_model", url: null })).toBeNull()
    expect(hostBaseFromStatus({ state: "exited", url: "http://127.0.0.1:8000" })).toBeNull()
    expect(hostBaseFromStatus({ state: "running", url: null })).toBeNull()
  })
})
