/* Desktop update check: compare the installed version with the latest GitHub
   release, silently, once per launch.

   This is the only recurring outbound request the desktop app makes that is
   not the user's own inference traffic: a single unauthenticated GET to the
   public releases API, no local data in it (the installed version is read
   locally and never sent), 10s timeout, and every failure collapses to
   `unavailable` so an offline start behaves exactly like before. The browser
   deployment skips the check entirely - a site visit has nothing to update
   itself with. */

import { getVersion } from "@tauri-apps/api/app"

export const LATEST_RELEASE_URL =
  "https://api.github.com/repos/saritchakraborty09012012/syntara-nde/releases/latest"

export type UpdateResult =
  | { status: "not-installed" }
  | { status: "up-to-date"; current: string }
  | { status: "update-available"; current: string; latest: string; url: string }
  | { status: "unavailable" }

/* The desktop build is the only one with an installed version to update. */
const isDesktop = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window

/** Compare release tags as dotted numbers, not as strings.

    `1.0.10` is newer than `1.0.9` even though "1.0.10" < "1.0.9"
    lexically; a leading `v` and a prerelease suffix are tolerated because
    release tags have been both `1.0.6` and `v1.0.1` historically. Equal
    cores (a `-rc` tag against its own release) count as not newer. */
export function isNewerVersion(latest: string, current: string): boolean {
  const parts = (value: string): number[] =>
    value.trim().replace(/^v/i, "").split("-")[0].split(".").map((part) => {
      const parsed = Number.parseInt(part, 10)
      return Number.isFinite(parsed) ? parsed : 0
    })

  const target = parts(latest)
  const installed = parts(current)
  const length = Math.max(target.length, installed.length)
  for (let index = 0; index < length; index += 1) {
    const want = target[index] ?? 0
    const have = installed[index] ?? 0
    if (want !== have) return want > have
  }
  return false
}

export async function checkForUpdate(): Promise<UpdateResult> {
  if (!isDesktop()) return { status: "not-installed" }

  try {
    const current = await getVersion()
    const response = await fetch(LATEST_RELEASE_URL, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return { status: "unavailable" }

    const release = (await response.json()) as { tag_name?: unknown; html_url?: unknown }
    const latest = typeof release.tag_name === "string" ? release.tag_name : ""
    if (!latest) return { status: "unavailable" }

    const url =
      typeof release.html_url === "string" && release.html_url.startsWith("https://github.com/")
        ? release.html_url
        : "https://github.com/saritchakraborty09012012/syntara-nde/releases/latest"

    return isNewerVersion(latest, current)
      ? { status: "update-available", current, latest, url }
      : { status: "up-to-date", current }
  } catch {
    return { status: "unavailable" }
  }
}
