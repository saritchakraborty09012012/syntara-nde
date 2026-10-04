import { PageHeader, PageSection, PageShell } from "./PageShell"

const REPO = "https://github.com/saritchakraborty09012012/syntara-nde"

const PRINCIPLES: Array<{ icon: string; title: string; body: string }> = [
  {
    icon: "◈",
    title: "Local-first",
    body: "The normal path is your machine: your prompt, your model files, your hardware. Syntara orchestrates local models rather than hosting them for you.",
  },
  {
    icon: "◎",
    title: "No account, ever",
    body: "There is no login, no signup, no email verification and no activation step. Nothing about running a local model is gated behind an account.",
  },
  {
    icon: "⌁",
    title: "Your models stay yours",
    body: "Models live in a directory you can see. Syntara never silently deletes a model, and it only converts or re-quantizes when you ask it to.",
  },
  {
    icon: "✦",
    title: "Universal, not proprietary",
    body: "Formats, runtimes and backends are separate concerns. Adding another model format or accelerator should not require rewriting the application.",
  },
  {
    icon: "↗",
    title: "Honest about hardware",
    body: "Capability-based detection, a clear explanation when an accelerator is missing, and a CPU fallback that always works.",
  },
  {
    icon: "⌘",
    title: "Open source",
    body: "Released under the MIT License, so anyone can inspect, modify and redistribute it — and verify the claims on this page.",
  },
]

const CAPABILITIES: Array<{ group: string; items: string[] }> = [
  {
    group: "Models",
    items: [
      "Model Hub with discovery, import, detach and removal",
      "GGUF, safetensors and Hugging Face ingestion paths",
      "Architecture detection and compatibility checks",
      "Conversion and quantization as explicit operations",
      "Metadata, context length and memory planning",
    ],
  },
  {
    group: "Execution",
    items: [
      "Backend router across CPU, CUDA, Metal, Vulkan and ROCm",
      "Execution planner for RAM, VRAM and storage tiering",
      "Streaming paths for MoE and dense workloads",
      "KV-cache and context budgeting for long prompts",
      "Live progress, cancellation and honest error messages",
    ],
  },
  {
    group: "Workspace",
    items: [
      "Chat and permission-gated Agent workflows",
      "Projects with their own context and configuration",
      "Persistent local memory across sessions",
      "Local backup, import and restore",
      "In-app host log viewer that uploads nothing",
    ],
  },
  {
    group: "Developer surface",
    items: [
      "OpenAI-compatible local API bound to localhost",
      "Python SDK and developer CLI",
      "n8n and IDE integration surfaces",
      "Windows, macOS and Linux desktop shells",
      "Light and dark interface themes",
    ],
  },
]

const FAMILIES: Array<{ name: string; detail: string }> = [
  { name: "GLM-5.2 / 5.3", detail: "744B MoE" },
  { name: "GLM-5.3-Flash", detail: "321B, vision" },
  { name: "Inkling", detail: "975B" },
  { name: "Kimi K3", detail: "2.8T" },
  { name: "DeepSeek V4 Flash", detail: "284B" },
  { name: "DeepSeek V4.1 Flash", detail: "552B, vision" },
  { name: "Qwen3.8-Flash-Next", detail: "125B + 51B n-gram" },
  { name: "Qwen3.6", detail: "35B-A3B" },
  { name: "OLMoE", detail: "7B" },
]

export function AboutPage() {
  return (
    <PageShell>
      <PageHeader
        kicker="About Syntara"
        title="The universal local AI layer."
        intro="Syntara is an open-source local-AI platform by NDe (NoirDemons). It takes the models you already have — or the ones you want to download — and makes them usable from a desktop app, a local API, an SDK and your own automation, without sending your prompts to someone else's server."
        meta="Built by NDe · Released under the MIT License · Windows · macOS · Linux"
      />

      <PageSection>
        <h2 className="section-title !text-[clamp(24px,3vw,34px)]">What Syntara is</h2>
        <div className="mt-6 grid gap-5 text-[15px] leading-relaxed text-muted lg:grid-cols-2">
          <p>
            Most local-AI tools make you choose between a simple chat window and a
            programmable runtime. Syntara is both at once: a desktop product for people
            who want a good chat experience, and a platform for developers who need the
            same local model behind an API, an SDK or an automation graph.
          </p>
          <p>
            Underneath, it separates the things that usually get tangled together — model
            files, the runtime that executes them, the manager that tracks them, and the
            applications that talk to them. That separation is why Syntara can support
            several model formats and several accelerators without becoming a different
            product on each one.
          </p>
        </div>
      </PageSection>

      <PageSection>
        <h2 className="section-title !text-[clamp(24px,3vw,34px)]">The principles</h2>
        <p className="section-intro">
          These are product decisions, not marketing lines. They are the reason the
          architecture looks the way it does.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((item) => (
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
      </PageSection>

      <PageSection>
        <h2 className="section-title !text-[clamp(24px,3vw,34px)]">What it does</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {CAPABILITIES.map((group) => (
            <article key={group.group} className="hud-card cut p-6">
              <div className="kicker">{group.group}</div>
              <ul className="mt-4 grid gap-2.5">
                {group.items.map((line) => (
                  <li key={line} className="flex gap-3 text-[14px] leading-relaxed text-muted">
                    <span aria-hidden="true" className="mt-[3px] font-mono text-[11px] text-cyan">
                      ▸
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <h2 className="section-title !text-[clamp(24px,3vw,34px)]">Registered model families</h2>
        <p className="section-intro">
          Each family has its own planner, memory model and quantization path rather than
          being forced through one generic path.
        </p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FAMILIES.map((family) => (
            <div key={family.name} className="faq-hud cut-sm flex items-baseline justify-between gap-3 px-5 py-4">
              <strong className="font-display text-[13px] font-bold tracking-[0.12em] text-ink uppercase">
                {family.name}
              </strong>
              <span className="font-mono text-[12px] text-muted">{family.detail}</span>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <h2 className="section-title !text-[clamp(24px,3vw,34px)]">Who builds Syntara</h2>
        <div className="mt-6 grid gap-5 text-[15px] leading-relaxed text-muted lg:grid-cols-2">
          <p>
            Syntara is built by <strong className="text-ink">NDe</strong> (NoirDemons), the
            project name of Sarit Chakraborty. It is developed in the open: the
            repository, the issue tracker and the release history are public, and the
            roadmap on the{" "}
            <a className="text-cyan hover:text-ink" href="./#roadmap">
              home page
            </a>{" "}
            shows what is planned next.
          </p>
          <p>
            The platform is released under the MIT License. The distribution also contains
            modified third-party code, and the required legal attributions are preserved
            in the repository rather than folded into this page.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a className="hud-btn hud-btn-primary cut-sm" href="./#download">
            Download Syntara
          </a>
          <a className="hud-btn hud-btn-ghost cut-sm" href={REPO} target="_blank" rel="noreferrer">
            Source code ↗
          </a>
          <a className="hud-btn hud-btn-ghost cut-sm" href="privacy.html">
            Privacy Policy
          </a>
        </div>
      </PageSection>
    </PageShell>
  )
}
