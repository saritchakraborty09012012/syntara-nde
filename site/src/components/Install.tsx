import { Section } from "./ui"

const STEPS: Array<{ n: string; title: string; body: React.ReactNode }> = [
  {
    n: "01",
    title: "Download",
    body: (
      <>
        Click your operating system above and the installer downloads straight to your machine
        — Windows <code className="text-terminal">.exe</code>, macOS{" "}
        <code className="text-terminal">.dmg</code>, Linux{" "}
        <code className="text-terminal">.AppImage</code>. No source code, no account.
      </>
    ),
  },
  {
    n: "02",
    title: "Install",
    body: (
      <>
        Run it. The installer offers the install folder, a Start Menu and desktop shortcut, and
        launches Syntara when it finishes. Prefer the portable build? Every release also keeps a{" "}
        <code className="text-terminal">.zip</code> /{" "}
        <code className="text-terminal">.tar.gz</code> on GitHub — unzip it and run{" "}
        <code className="text-terminal">./syntara</code>.
      </>
    ),
  },
  {
    n: "03",
    title: "Pick a model",
    body: (
      <>
        Point Syntara at a model you already have and choose <em>copy</em> (your original stays
        where it is) or <em>move</em> (it is relocated into Syntara). Or download one from inside
        the app and it lands in the model folder you chose. It is your file, either way.
      </>
    ),
  },
  {
    n: "04",
    title: "Work offline",
    body: (
      <>
        Once the app and the model are on disk, connecting the model, converting it and every
        chat or agent run are local. Network is used to download the app and the model — nothing
        else is required.
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
