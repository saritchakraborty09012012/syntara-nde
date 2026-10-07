export type Platform = "windows" | "macos" | "linux"

const REPO = "saritchakraborty09012012/syntara-nde"

export const RELEASE_API = `https://api.github.com/repos/${REPO}/releases/latest`
export const RELEASES_PAGE = `https://github.com/${REPO}/releases`

/** The installer every platform button downloads.

    These names are fixed on purpose. `releases/latest/download/<asset>`
    resolves without an API call, without a token and without a rate limit,
    so the buttons keep working when api.github.com is throttled - which is
    exactly when the old "link to the releases page" fallback sent a user to
    a page whose only downloads were `Source code (zip)` and
    `Source code (tar.gz)`. The installers are produced and published under
    these exact names by .github/workflows/desktop-installers.yml; renaming
    one here without renaming it there is the whole bug, so the workflow reads
    the same names from this file's twin (see the workflow header). */
export const INSTALLER_ASSET: Record<Platform, string> = {
  windows: "Syntara-Windows-x64-Setup.exe",
  macos: "Syntara-macOS-arm64.dmg",
  linux: "Syntara-Linux-x86_64.AppImage",
}

/** Direct installer download for a platform: no page, no archive, no source. */
export const installerUrl = (os: Platform): string =>
  `https://github.com/${REPO}/releases/latest/download/${INSTALLER_ASSET[os]}`

/** The portable, no-install archives the release workflow already builds.
    Used only as a fallback when a release predates the installers, because a
    zip that runs beats a download button that 404s. */
export const PORTABLE_ASSET: Record<Platform, string> = {
  windows: "windows-x86_64.zip",
  macos: "macos-arm64.tar.gz",
  linux: "linux-x86_64.tar.gz",
}

export const ARCH_LABEL: Record<Platform, string> = {
  windows: "Windows installer · x64",
  macos: "macOS disk image · Apple Silicon",
  linux: "Linux AppImage · x86_64",
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
}

export const PLATFORMS: Platform[] = ["windows", "macos", "linux"]

/** Same floor as tools/verify_installer.py — catches v1.0.1’s 302 KB Windows impostor. */
export const MIN_INSTALLER_BYTES = 5 * 1024 * 1024

export function detectPlatform(): Platform | "" {
  const raw =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
      ?.platform || navigator.platform || ""
  const p = raw.toLowerCase()
  if (p.includes("win")) return "windows"
  if (p.includes("mac")) return "macos"
  if (p.includes("linux") || p.includes("x11")) return "linux"
  return ""
}

/** What a button hands the browser: a real installer, or (older releases
    only) the portable archive. Never the releases page - that is the
    behaviour this file exists to remove. */
export type ReleaseKind = "installer" | "portable"

export type ReleaseState = {
  versionLabel: string
  hrefs: Record<Platform, string>
  sizes: Partial<Record<Platform, string>>
  kinds: Partial<Record<Platform, ReleaseKind>>
  /** Set when GitHub lists an installer asset that fails the size/format gate. */
  installerIssues: Partial<Record<Platform, string>>
}

export const initialRelease = (): ReleaseState => ({
  versionLabel: "Current release: latest tag",
  hrefs: {
    windows: installerUrl("windows"),
    macos: installerUrl("macos"),
    linux: installerUrl("linux"),
  },
  sizes: {},
  kinds: {},
  installerIssues: {},
})

type GithubAsset = { name?: unknown; size?: unknown; browser_download_url?: unknown }
type GithubRelease = { tag_name?: unknown; published_at?: unknown; assets?: unknown }

const installerBytes = (size: unknown): number => {
  const bytes = Number(size) || 0
  return Number.isFinite(bytes) ? bytes : 0
}

export const isUsableInstallerAsset = (size: unknown): boolean =>
  installerBytes(size) >= MIN_INSTALLER_BYTES

const assetSize = (size: unknown, kind: ReleaseKind | undefined): string | undefined => {
  const bytes = installerBytes(size)
  if (bytes <= 0) return undefined
  if (kind === "installer" && bytes < MIN_INSTALLER_BYTES) {
    return `${Math.round(bytes / 1024)} KB · not a valid installer`
  }
  const mb = Math.max(1, Math.round(bytes / 1048576))
  return `${mb} MB`
}

/* Enrich the direct installer links with what the release actually contains.

   The hrefs stay the versionless `releases/latest/download/...` URLs: a
   release's asset ids are exact and a wrong guess there is a 404, while this
   endpoint only adds the version label and file sizes. If the API is
   unreachable (rate limit, offline) the buttons still download the newest
   installer, because they were never waiting on this call. */
export async function fetchLatestRelease(): Promise<ReleaseState | null> {
  try {
    const res = await fetch(RELEASE_API, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
    })
    if (!res.ok) return null
    const rel = (await res.json()) as GithubRelease | null
    if (!rel || !Array.isArray(rel.assets)) return null

    const next = initialRelease()
    const assets = rel.assets as GithubAsset[]
    for (const os of PLATFORMS) {
      const installer = assets.find(
        (asset) => typeof asset?.name === "string" && asset.name === INSTALLER_ASSET[os],
      )
      const portable = assets.find(
        (asset) => typeof asset?.name === "string" && asset.name.includes(PORTABLE_ASSET[os]),
      )
      const installerOk =
        installer && isUsableInstallerAsset(installer.size) ? installer : undefined
      if (installer && !installerOk) {
        next.installerIssues[os] =
          "This release’s installer file is too small to be real (a broken build was published on v1.0.1). Use Release notes below — a rebuilt installer or portable archive — or ask the maintainer to re-run the Desktop installers workflow."
      }
      // A verified installer wins; otherwise fall back to the portable archive
      // of the same release rather than to a page.
      const chosen = installerOk ?? portable
      if (!chosen) {
        if (installer && !installerOk) next.hrefs[os] = RELEASES_PAGE
        continue
      }
      if (typeof chosen.browser_download_url === "string") {
        next.hrefs[os] = chosen.browser_download_url
      }
      next.kinds[os] = installerOk ? "installer" : "portable"
      const size = assetSize(chosen.size, next.kinds[os])
      if (size) next.sizes[os] = size
    }

    if (typeof rel.tag_name === "string" && rel.tag_name) {
      const date =
        typeof rel.published_at === "string" ? rel.published_at.slice(0, 10) : ""
      next.versionLabel = `Current release: ${rel.tag_name}${date ? ` · ${date}` : ""}`
    }
    return next
  } catch {
    return null
  }
}