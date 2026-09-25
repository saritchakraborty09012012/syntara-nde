import { Section } from "./ui"

const STEPS: Array<{ n: string; title: string; body: React.ReactNode }> = [
  {
    n: "01",
    title: "Download",
    body: (
      <>
        Grab the archive for your operating system (Windows: <code className="text-terminal">.zip</code>,
        macOS/Linux: <code className="text-terminal">.tar.gz</code>).
      </>
    ),
  },
  {
    n: "02",
    title: "Extract",
    body: (
      <>
        Unzip / unpack anywhere. It is fully portable — no installer or admin rights
        required.
      </>
    ),
  },
  {
    n: "03",
    title: "Launch",
    body: (
      <>
        Run the launcher bundled in the archive. On macOS/Linux that is{" "}
        <code className="text-terminal">./syntara</code> from the extracted directory; the
        Windows archive carries its own launcher — see the README inside the archive.
      </>
    ),
  },
  {
    n: "04",
    title: "Choose a model",
    body: (
      <>
        Open the dashboard to pick a model, or start the local API with{" "}
        <code className="text-terminal">./syntara serve --model &lt;dir&gt;</code>.
      </>
    ),
  },
]

export function Install() {
  return (
    <Section
      id="install"
      kicker="Getting started"
      title="Download. Install. Run."
      intro="No account, no email, no registration wall. Four steps from download to your first local conversation."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <article key={step.n} className="hud-card cut p-5">
            <div className="font-mono text-[28px] leading-none text-cyan drop-shadow-[0_0_16px_rgb(69_224_255/0.5)]">
              {step.n}
            </div>
            <h3 className="mt-4 font-display text-sm font-bold tracking-[0.16em] text-ink uppercase">
              {step.title}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted [&_code]:text-[12px]">
              {step.body}
            </p>
          </article>
        ))}
      </div>
    </Section>
  )
}
