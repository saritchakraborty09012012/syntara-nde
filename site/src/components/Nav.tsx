import { useEffect, useState } from "react"
import { Container } from "./ui"

/* The header row has to fit the 1180 px Container at EVERY viewport —
   logo + these links + the action buttons exceed it with all nine links,
   so Open source / FAQ / Roadmap live in the footer only. */
const LINKS: Array<{ id: string; label: string; page?: string }> = [
  { id: "why", label: "Why" },
  { id: "install", label: "Install" },
  { id: "models", label: "Models" },
  { id: "agents", label: "Agents" },
  { id: "developers", label: "Developers" },
  // Standalone page rather than a landing-page anchor: same nav works from
  // every page because `home` prefixes it ("./" on subpages, "" at the root).
  { id: "playground", label: "Playground", page: "playground.html" },
]

function readTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark"
  return document.documentElement.dataset.theme === "light" ? "light" : "dark"
}

/**
 * `home` prefixes every in-page anchor so the same header works on the landing
 * page (empty) and on the standalone pages such as /about.html ("./").
 */
export function Nav({ home = "" }: { home?: string }) {
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
      <Container className="flex h-[72px] items-center gap-5">
        <a href={`${home}#top`} className="flex shrink-0 items-center gap-3">
          <img
            src="syntara-logo.png"
            alt="Syntara"
            className="h-9 w-9 rounded-[18%] border border-line object-cover shadow-[0_0_22px_rgb(69_224_255/0.35)]"
          />
          <span className="leading-none">
            <span className="block font-display text-[15px] font-bold tracking-[0.28em] text-ink uppercase">
              Syntara
            </span>
            <span className="mt-1 block font-mono text-[9px] tracking-[0.3em] text-muted uppercase">
              By NDe
            </span>
          </span>
        </a>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 lg:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={link.page ? `${home}${link.page}` : `${home}#${link.id}`}
              className="nav-link whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          <button
            type="button"
            className="hud-btn hud-btn-ghost cut-sm !px-2.5"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? "☾" : "☀"}
          </button>
          <a
            className="hud-btn hud-btn-ghost cut-sm hidden !px-3 sm:inline-flex"
            href="https://github.com/saritchakraborty09012012/syntara-nde"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a className="hud-btn hud-btn-ghost cut-sm !px-3" href={`${home}app/`}>
            Try Online <span aria-hidden="true">↗</span>
          </a>
          <a className="hud-btn hud-btn-primary cut-sm !px-3" href={`${home}#download`}>
            Download
          </a>
        </div>
      </Container>
    </header>
  )
}
