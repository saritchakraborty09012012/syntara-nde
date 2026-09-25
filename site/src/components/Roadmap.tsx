import { Section } from "./ui"

const ROADMAP: Array<{ tag: string; title: string; body: string; state: "done" | "live" | "next" }> = [
  {
    tag: "v1",
    title: "Local platform core",
    body: "Model Hub, Chat, Agents, local API, Python SDK, CLI and desktop shells.",
    state: "done",
  },
  {
    tag: "now",
    title: "Universal backend routing",
    body: "Format/architecture detection, execution planner, CPU/GPU routing and memory fabric.",
    state: "live",
  },
  {
    tag: "next",
    title: "Community ecosystem",
    body: "Plugin surface, community adapters, public benchmarks and shared agent tooling.",
    state: "next",
  },
]

const STATE_STYLE: Record<string, string> = {
  done: "text-muted border-line",
  live: "text-terminal border-terminal/50 shadow-[0_0_14px_rgb(61_255_168/0.25)]",
  next: "text-gold border-gold/50",
}

export function Roadmap() {
  return (
    <Section
      id="roadmap"
      kicker="Roadmap"
      title="Where Syntara is headed."
      intro="A local-first platform that grows through open backends, adapters and community tooling."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {ROADMAP.map((item) => (
          <article key={item.tag} className="hud-card cut p-6">
            <span
              className={`inline-block border px-3 py-1 font-mono text-[10px] tracking-[0.22em] uppercase ${STATE_STYLE[item.state]}`}
            >
              {item.tag}
            </span>
            <h3 className="mt-4 font-display text-sm font-bold tracking-[0.14em] text-ink uppercase">
              {item.title}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">{item.body}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}
