import { Container } from "./ui"

const LINKS: Array<{ label: string; href: string }> = [
  { label: "Download", href: "#download" },
  { label: "Install", href: "#install" },
  { label: "Why Syntara", href: "#why" },
  { label: "Models", href: "#models" },
  { label: "Agents", href: "#agents" },
  { label: "Developers", href: "#developers" },
  { label: "Requirements", href: "#requirements" },
  { label: "Open source", href: "#open" },
  { label: "FAQ", href: "#faq" },
  { label: "Roadmap", href: "#roadmap" },
]

const OFFSITE: Array<{ label: string; href: string }> = [
  { label: "GitHub", href: "https://github.com/saritchakraborty09012012/syntara-nde" },
  { label: "Releases", href: "https://github.com/saritchakraborty09012012/syntara-nde/releases" },
  { label: "Docs", href: "https://github.com/saritchakraborty09012012/syntara-nde/tree/main/docs" },
  { label: "Issues", href: "https://github.com/saritchakraborty09012012/syntara-nde/issues" },
  { label: "Contributing", href: "https://github.com/saritchakraborty09012012/syntara-nde/blob/main/CONTRIBUTING.md" },
]

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-panel/60">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
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
              <li key={link.href}>
                <a className="nav-link" href={link.href}>
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
          <span className="text-right">
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
        </Container>
      </div>
    </footer>
  )
}
