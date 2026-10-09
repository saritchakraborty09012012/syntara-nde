import { afterEach, describe, expect, it, vi } from "vitest"
import { getVersion } from "@tauri-apps/api/app"
import { checkForUpdate, isNewerVersion, LATEST_RELEASE_URL } from "./update-check"

vi.mock("@tauri-apps/api/app", () => ({ getVersion: vi.fn(async () => "1.0.6") }))

/* The suite runs in node (no jsdom here), so the desktop build is simulated
   with a window global that carries the Tauri marker; unstubAllGlobals
   restores the browser-less environment afterwards. */
const enterDesktop = (): void => {
  vi.stubGlobal("window", { __TAURI_INTERNALS__: {} })
}

const releaseResponse = (
  tag: string,
  url = "https://github.com/saritchakraborty09012012/syntara-nde/releases/tag/x",
) => ({
  ok: true,
  json: async () => ({ tag_name: tag, html_url: url }),
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("isNewerVersion", () => {
  it("compares numerically, not lexically", () => {
    expect(isNewerVersion("1.0.10", "1.0.9")).toBe(true)
    expect(isNewerVersion("1.0.9", "1.0.10")).toBe(false)
  })

  it("tolerates a leading v and reports equality as not newer", () => {
    expect(isNewerVersion("v1.0.7", "1.0.6")).toBe(true)
    expect(isNewerVersion("1.0.6", "v1.0.6")).toBe(false)
  })

  it("treats a missing minor/patch as zero", () => {
    expect(isNewerVersion("1.1", "1.0.9")).toBe(true)
    expect(isNewerVersion("1.0.0", "1.0.0")).toBe(false)
  })
})

describe("checkForUpdate", () => {
  it("does nothing in a browser deployment", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    expect(await checkForUpdate()).toEqual({ status: "not-installed" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("reports an update when the release tag is newer", async () => {
    enterDesktop()
    vi.stubGlobal("fetch", vi.fn(async () => releaseResponse("v1.0.7")))

    expect(await checkForUpdate()).toEqual({
      status: "update-available",
      current: "1.0.6",
      latest: "v1.0.7",
      url: "https://github.com/saritchakraborty09012012/syntara-nde/releases/tag/x",
    })
  })

  it("reports up-to-date when the installed version matches", async () => {
    enterDesktop()
    vi.stubGlobal("fetch", vi.fn(async () => releaseResponse("1.0.6")))

    expect(await checkForUpdate()).toEqual({ status: "up-to-date", current: "1.0.6" })
  })

  it("requests the latest release endpoint", async () => {
    enterDesktop()
    const fetchMock = vi.fn(async () => releaseResponse("1.0.6"))
    vi.stubGlobal("fetch", fetchMock)

    await checkForUpdate()
    expect(fetchMock).toHaveBeenCalledWith(LATEST_RELEASE_URL, expect.anything())
  })

  it("collapses a network failure to unavailable", async () => {
    enterDesktop()
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline") }))

    expect(await checkForUpdate()).toEqual({ status: "unavailable" })
  })

  it("collapses a rate-limited response to unavailable", async () => {
    enterDesktop()
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 403, json: async () => ({}) })))

    expect(await checkForUpdate()).toEqual({ status: "unavailable" })
  })

  it("falls back to the releases page when html_url is not a GitHub link", async () => {
    enterDesktop()
    vi.stubGlobal("fetch", vi.fn(async () => releaseResponse("1.0.7", "https://evil.example/phish")))

    expect(await checkForUpdate()).toEqual({
      status: "update-available",
      current: "1.0.6",
      latest: "1.0.7",
      url: "https://github.com/saritchakraborty09012012/syntara-nde/releases/latest",
    })
  })

  it("ignores a release payload without a tag", async () => {
    enterDesktop()
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({}) })))

    expect(await checkForUpdate()).toEqual({ status: "unavailable" })
    expect(vi.mocked(getVersion)).toHaveBeenCalled()
  })
})
