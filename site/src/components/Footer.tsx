import { Container } from "./ui"

const REPO = "https://github.com/saritchakraborty09012012/syntara-nde"

const LINKS: Array<{ label: string; id: string }> = [
  { label: "Download", id: "download" },
  { label: "Install", id: "install" },
  { label: "Why Syntara", id: "why" },
  { label: "Models", id: "models" },
  { label: "Agents", id: "agents" },
  { label: "Developers", id: "developers" },
  { label: "Requirements", id: "requirements" },
  { label: "Open source", id: "open" },
  { label: "FAQ", id: "faq" },
  { label: "Roadmap", id: "roadmap" },
]

const PAGES: Array<{ label: string; href: string }> = [
  { label: "About Syntara", href: "about.html" },
  { label: "Privacy Policy", href: "privacy.html" },
  { label: "FAQ", href: "faq.html" },
]

const OFFSITE: Array<{ label: string; href: string }> = [
  { label: "GitHub", href: REPO },
  { label: "Releases", href: `${REPO}/releases` },
  { label: "Docs", href: `${REPO}/tree/main/docs` },
  { label: "Issues", href: `${REPO}/issues` },
  { label: "Contributing", href: `${REPO}/blob/main/CONTRIBUTING.md` },
]

/**
 * `home` prefixes every in-page anchor so the same footer works on the landing
 * page (empty) and on the standalone pages such as /about.html ("./").
 */
export function Footer({ home = "" }: { home?: string }) {
  return (
    <footer className="relative border-t border-line bg-panel/60">
      <Container className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <img src="syntara-logo.png" alt="" className="h-9 w-9 object-contain" width={64} height={64} />
            <span className="font-display text-lg font-bold tracking-[0.3em] text-ink uppercase">
              Syntara
            </span>
          </div>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-muted">
            The universal local-AI platform. Your models run on your device — orchestrated,
            optimized and exposed through one interface.
          </p>
          <p className="mt-4 font-mono text-[11px] tracking-[0.2em] text-terminal uppercase">
            Local-first · Privacy-first · Open source
          </p>
        </div>

        <nav aria-label="Page sections">
          <div className="kicker mb-4">On this page</div>
          <ul className="grid grid-cols-2 gap-2">
            {LINKS.map((link) => (
              <li key={link.id}>
                <a className="nav-link" href={`${home}#${link.id}`}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Syntara pages">
          <div className="kicker mb-4">Syntara</div>
          <ul className="grid gap-2">
            {PAGES.map((link) => (
              <li key={link.href}>
                <a className="nav-link" href={`${home}${link.href}`}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Project links">
          <div className="kicker mb-4">Project</div>
          <ul className="grid gap-2">
            {OFFSITE.map((link) => (
              <li key={link.href}>
                <a className="nav-link" href={link.href} target="_blank" rel="noreferrer">
                  {link.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <div className="border-t border-line">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-5 font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
          <span>© Syntara · Open source local AI</span>
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            <a className="hover:text-cyan" href={`${home}privacy.html`}>
              Privacy
            </a>
            <a className="hover:text-cyan" href={`${home}about.html`}>
              About
            </a>
            <span>
              Built by{" "}
              <a
                className="text-cyan hover:text-ink"
                href="https://github.com/saritchakraborty09012012"
                target="_blank"
                rel="noreferrer"
                title="NDe"
              >
                NDe
              </a>
            </span>
          </span>
        </Container>
      </div>
    </footer>
  )
}
