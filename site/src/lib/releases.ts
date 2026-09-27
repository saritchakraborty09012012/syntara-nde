export type Platform = "windows" | "macos" | "linux"

export const RELEASE_API = "https://api.github.com/repos/saritchakraborty09012012/syntara-nde/releases/latest"
export const RELEASES_PAGE = "https://github.com/saritchakraborty09012012/syntara-nde/releases"

export const ARCH_LABEL: Record<Platform, string> = {
  windows: "Portable x86_64",
  macos: "Apple Silicon (arm64)",
  linux: "x86_64",
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
}

const ASSET_NAME: Record<Platform, string> = {
  windows: "windows-x86_64.zip",
  macos: "macos-arm64.tar.gz",
  linux: "linux-x86_64.tar.gz",
}

export const PLATFORMS: Platform[] = ["windows", "macos", "linux"]

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

export type ReleaseState = {
  versionLabel: string
  hrefs: Record<Platform, string>
  sizes: Partial<Record<Platform, string>>
}

export const initialRelease = (): ReleaseState => ({
  versionLabel: "Current release: see GitHub releases",
  hrefs: {
    windows: RELEASES_PAGE,
    macos: RELEASES_PAGE,
    linux: RELEASES_PAGE,
  },
  sizes: {},
})

type GithubAsset = { name?: unknown; size?: unknown; browser_download_url?: unknown }
type GithubRelease = { tag_name?: unknown; published_at?: unknown; assets?: unknown }

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
    for (const os of PLATFORMS) {
      const asset = (rel.assets as GithubAsset[]).find(
        (x) => x && typeof x.name === "string" && x.name.includes(ASSET_NAME[os]),
      )
      if (asset && typeof asset.browser_download_url === "string") {
        next.hrefs[os] = asset.browser_download_url
        const mb = Math.max(1, Math.round((Number(asset.size) || 0) / 1048576))
        next.sizes[os] = `${mb} MB`
      }
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
