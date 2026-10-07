import { ARCH_LABEL, PLATFORMS, PLATFORM_LABEL, RELEASES_PAGE } from "../lib/releases"
import type { Platform, ReleaseState } from "../lib/releases"

export function DownloadBox({
  release,
  detected,
}: {
  release: ReleaseState
  detected: Platform | ""
}) {
  return (
    <div id="download" className="hud-panel cut p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
        <span className="font-display text-sm font-bold tracking-[0.2em] text-ink uppercase">
          Download Syntara
        </span>
        <span className="font-mono text-[11px] tracking-[0.18em] text-terminal uppercase">
          Free · Open source · No signup
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {PLATFORMS.map((os) => {
          const primary = os === "windows" || os === detected
          const size = release.sizes[os]
          const issue = release.installerIssues[os]
          const blocked = Boolean(issue) && release.kinds[os] !== "portable"
          return (
            <a
              key={os}
              href={release.hrefs[os]}
              aria-disabled={blocked ? true : undefined}
              className={`cut-sm flex flex-col items-start gap-1 border px-4 py-3 transition-all duration-200 ${
                blocked
                  ? "pointer-events-none border-line bg-void/40 text-muted opacity-80"
                  : primary
                    ? "border-transparent bg-gradient-to-br from-cyan to-electric text-[#03131f] shadow-[0_0_28px_rgb(69_224_255/0.4)]"
                    : "border-line bg-cyan/5 text-ink hover:border-line-strong hover:shadow-[0_0_20px_rgb(69_224_255/0.18)]"
              }`}
            >
              <span className="font-display text-sm font-bold tracking-[0.14em] uppercase">
                {PLATFORM_LABEL[os]}
              </span>
              <span
                className={`font-mono text-[10px] tracking-[0.1em] ${primary ? "text-[#03131f]/80" : "text-muted"}`}
              >
                {ARCH_LABEL[os]}
                {os === detected ? " · Recommended" : ""}
                {size ? ` · ${size}` : ""}
                {release.kinds[os] === "portable" ? " · portable archive" : ""}
              </span>
            </a>
          )
        })}
      </div>

      {PLATFORMS.some((os) => release.installerIssues[os]) ? (
        <p className="mt-4 font-mono text-[12px] leading-relaxed text-amber-200/90">
          {PLATFORMS.map((os) => release.installerIssues[os])
            .filter(Boolean)
            .join(" ")}
        </p>
      ) : null}

      <p className="mt-4 font-mono text-[12px] leading-relaxed text-muted">
        Real installers, not source archives — your models stay on your disk and inference runs locally.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[12px] text-muted">
        <span>Also on GitHub · pip SDK/CLI:</span>
        <code className="cut-sm border border-line bg-void px-2 py-1 text-terminal">
          pip install syntara-engine
        </code>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="stat-chip cut-sm">{release.versionLabel}</span>
        <a
          className="hud-btn hud-btn-ghost cut-sm !py-2 !text-[11px]"
          href={RELEASES_PAGE}
          target="_blank"
          rel="noreferrer"
        >
          Release notes
        </a>
      </div>
    </div>
  )
}
