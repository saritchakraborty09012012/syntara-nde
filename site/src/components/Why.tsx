import { Section } from "./ui"

const WHY: Array<{ icon: string; title: string; body: string }> = [
  {
    icon: "◈",
    title: "Universal model layer",
    body: "Import major local formats, detect the architecture, validate compatibility and choose a suitable execution path automatically.",
  },
  {
    icon: "↗",
    title: "Hardware-aware execution",
    body: "Plan CPU, RAM, GPU/VRAM and storage together so the runtime can adapt to the machine instead of demanding one fixed hardware profile.",
  },
  {
    icon: "◎",
    title: "Zero-auth local experience",
    body: "No Syntara account, no mandatory cloud and no activation wall. Persistent data can stay entirely on the device.",
  },
  {
    icon: "⌁",
    title: "Model Hub",
    body: "Discover, compare, download, import, detach, update and remove local models through one user-friendly library.",
  },
  {
    icon: "✦",
    title: "Chat + Agents",
    body: "Use conversational AI or permission-gated coding agents with files, terminal, Git, tests and project context.",
  },
  {
    icon: "⌘",
    title: "Developer platform",
    body: "OpenAI-compatible local API, Python SDK, CLI, n8n and IDE integrations make local models reusable across your stack.",
  },
]

export function Why() {
  return (
    <Section
      id="why"
      kicker="Why Syntara"
      title="One local AI layer for everything."
      intro="Syntara keeps model formats, inference runtimes, hardware, storage, agents and developer integrations behind one unified experience."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WHY.map((item) => (
          <article key={item.title} className="hud-card cut p-6">
            <div
              aria-hidden="true"
              className="grid h-11 w-11 place-items-center border border-line bg-cyan/10 text-lg text-cyan shadow-[inset_0_0_18px_rgb(69_224_255/0.15)]"
            >
              {item.icon}
            </div>
            <h3 className="mt-4 font-display text-[15px] font-bold tracking-[0.1em] text-ink uppercase">
              {item.title}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">{item.body}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}
