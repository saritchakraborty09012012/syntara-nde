import { Section } from "./ui"

const AGENTS: Array<{ title: string; body: string }> = [
  {
    title: "Plan",
    body: "Break a task into concrete steps and show the execution plan before risky actions.",
  },
  {
    title: "Tools",
    body: "Files, terminal, Git, browser, search and tests can be exposed as permissioned tools.",
  },
  {
    title: "Approve",
    body: "Sandboxing, workspace limits, command approval and execution logs keep automation under the user's control.",
  },
]

const DEV: Array<{ title: string; body: string }> = [
  {
    title: "Python SDK",
    body: "Call models already installed on the user's machine. No Syntara cloud model hosting is required.",
  },
  {
    title: "n8n",
    body: "Point an HTTP/OpenAI-compatible node at localhost and keep the model workload on-device.",
  },
  {
    title: "VS Code / IDEs",
    body: "Use the local API for coding, explanation, refactoring and agent workflows from your preferred editor.",
  },
]

export function Agents() {
  return (
    <Section
      id="agents"
      kicker="Agent mode"
      title="From chat to action."
      intro="Run local coding agents with explicit permission gates and project awareness."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {AGENTS.map((card) => (
          <article key={card.title} className="hud-card cut p-6">
            <h3 className="font-display text-sm font-bold tracking-[0.18em] text-cyan uppercase">
              {card.title}
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">{card.body}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}

export function Developers() {
  return (
    <Section
      id="developers"
      kicker="Developers"
      title="One local API. Everywhere."
      intro="Use the same local control surface from applications, automation platforms and coding environments."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {DEV.map((card) => (
          <article key={card.title} className="hud-card cut p-6">
            <h3 className="font-display text-sm font-bold tracking-[0.18em] text-cyan uppercase">
              {card.title}
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">{card.body}</p>
          </article>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          className="hud-btn hud-btn-ghost cut-sm"
          href="https://github.com/saritchakraborty09012012/syntara-nde/tree/main/docs"
          target="_blank"
          rel="noreferrer"
        >
          Documentation
        </a>
        <a
          className="hud-btn hud-btn-ghost cut-sm"
          href="https://github.com/saritchakraborty09012012/syntara-nde/tree/main/docs/sdk-cli.md"
          target="_blank"
          rel="noreferrer"
        >
          SDK &amp; CLI guide
        </a>
      </div>
    </Section>
  )
}
