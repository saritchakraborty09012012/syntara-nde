import { Section } from "./ui"

export function Showcase() {
  return (
    <Section
      kicker="See it live"
      title="Screen's fiction, now the reality."
      intro="A direct walkthrough of Syntara's dashboard, Chat, Model Hub and Agents — running entirely on a local machine."
    >
      <div className="hud-panel cut relative overflow-hidden p-3 md:p-4">
        <div className="term-head">
          <span>◈ Live demo</span>
          <span className="text-muted">local session · no cloud</span>
        </div>
        <div className="relative mt-3 border border-line bg-black">
          <video
            poster="demo-poster.jpg"
            src="demo.webm"
            controls
            preload="metadata"
            playsInline
            className="block w-full"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
          <span>Model Hub · Chat · Agents · Runtime controls</span>
          <span className="text-terminal">Runs on-device</span>
        </div>
      </div>
    </Section>
  )
}
