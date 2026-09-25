import { useEffect, useState } from "react"
import { Container } from "./ui"

const LINKS: Array<{ href: string; label: string }> = [
  { href: "#why", label: "Why" },
  { href: "#install", label: "Install" },
  { href: "#models", label: "Models" },
  { href: "#agents", label: "Agents" },
  { href: "#developers", label: "Developers" },
  { href: "#open", label: "Open source" },
  { href: "#faq", label: "FAQ" },
  { href: "#roadmap", label: "Roadmap" },
]

function readTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark"
  return document.documentElement.dataset.theme === "light" ? "light" : "dark"
}

export function Nav() {
  const [theme, setTheme] = useState<"dark" | "light">(readTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem("syntara-theme", theme)
    } catch {
      /* storage may be unavailable; theme still applies for this session */
    }
  }, [theme])

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-void/80 backdrop-blur-xl">
      <Container className="flex h-[72px] items-center gap-8">
        <a href="#top" className="flex shrink-0 items-center gap-3">
          <img
            src="syntara-logo.png"
            alt="Syntara"
            className="h-9 w-9 cut-sm border border-line object-cover shadow-[0_0_22px_rgb(69_224_255/0.35)]"
          />
          <span className="leading-none">
            <span className="block font-display text-[15px] font-bold tracking-[0.28em] text-ink uppercase">
              Syntara
            </span>
            <span className="mt-1 block font-mono text-[9px] tracking-[0.3em] text-muted uppercase">
              By NDe
            </span>
            <span className="mt-0.5 block font-mono text-[8px] tracking-[0.24em] text-muted/70 uppercase">
              NoirDemons
            </span>
          </span>
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <button
            type="button"
            className="hud-btn hud-btn-ghost cut-sm !px-3"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? "☾" : "☀"}
          </button>
          <a
            className="hud-btn hud-btn-ghost cut-sm hidden sm:inline-flex"
            href="https://github.com/NoirDemons/Syntara"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a className="hud-btn hud-btn-primary cut-sm" href="#download">
            Download
          </a>
        </div>
      </Container>
    </header>
  )
}
