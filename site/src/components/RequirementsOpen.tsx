import { Section } from "./ui"

const REQS: Array<{ title: string; body: string; tone: "gold" | "cyan" | "armor" }> = [
  {
    title: "Minimum",
    body: "A 64-bit CPU with AVX2, 8 GB RAM, ~10 GB free disk. Suitable for smaller / quantized models on CPU.",
    tone: "gold",
  },
  {
    title: "Recommended",
    body: "16 GB+ RAM, an SSD for streaming model weights beyond RAM, and a discrete GPU when you want acceleration.",
    tone: "cyan",
  },
  {
    title: "Accelerators (optional)",
    body: "NVIDIA CUDA, Apple Silicon (Metal), Vulkan-capable GPUs or ROCm where supported. CPU is always the fallback.",
    tone: "armor",
  },
]

const TONE: Record<string, string> = {
  gold: "text-gold border-gold/40",
  cyan: "text-cyan border-cyan/40",
  armor: "text-armor border-armor/40",
}

export function Requirements() {
  return (
    <Section
      id="requirements"
      kicker="System requirements"
      title="Runs on the hardware you have."
      intro="Inference is local — the exact requirements depend on the model you choose. These are the practical starting points."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {REQS.map((req) => (
          <article key={req.title} className="hud-card cut p-6">
            <span
              className={`inline-block border px-3 py-1 font-mono text-[10px] tracking-[0.22em] uppercase ${TONE[req.tone]}`}
            >
              {req.title}
            </span>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">{req.body}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}

const OPEN: Array<{ title: string; body: string }> = [
  {
    title: "No account required",
    body: "Chat history, project data, persistent memory and configuration are local and user-controlled.",
  },
  {
    title: "Backup & migration",
    body: "Export chats, memories, projects, settings, agent configurations and model metadata into a portable local backup.",
  },
]

export function OpenSource() {
  return (
    <Section
      id="open"
      kicker="Open source"
      title="Transparent by default."
      intro="The core platform is open source and designed for community backends, adapters, plugins, benchmarks and tooling."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {OPEN.map((card) => (
          <article key={card.title} className="hud-card cut p-6">
            <h3 className="font-display text-sm font-bold tracking-[0.16em] text-ink uppercase">
              {card.title}
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">{card.body}</p>
          </article>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          className="hud-btn hud-btn-ghost cut-sm"
          href="https://github.com/NoirDemons/Syntara/blob/main/CONTRIBUTING.md"
          target="_blank"
          rel="noreferrer"
        >
          Contribution guide
        </a>
        <a
          className="hud-btn hud-btn-ghost cut-sm"
          href="https://github.com/NoirDemons/Syntara/issues"
          target="_blank"
          rel="noreferrer"
        >
          Open issues
        </a>
        <a
          className="hud-btn hud-btn-ghost cut-sm"
          href="https://github.com/NoirDemons/Syntara"
          target="_blank"
          rel="noreferrer"
        >
          Source code
        </a>
      </div>
    </Section>
  )
}
