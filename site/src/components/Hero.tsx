import { Container, Kicker } from "./ui"
import { DownloadBox } from "./DownloadBox"
import { useRelease } from "../lib/useRelease"

const FLOAT_CHIPS = [
  { label: "Model Hub", pos: "left-4 top-10 sm:left-8" },
  { label: "Local runtime", pos: "right-4 top-24 sm:right-8" },
  { label: "Zero auth", pos: "left-8 bottom-36 sm:left-4" },
  { label: "GPU / CPU", pos: "right-6 bottom-48 sm:right-10" },
]

export function Hero() {
  const { release, detected } = useRelease()

  return (
    <section id="top" className="relative overflow-hidden pt-14 pb-24 md:pt-20 md:pb-32">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Kicker>Universal local AI</Kicker>
          <h1 className="mt-5 font-display text-[clamp(40px,6.4vw,76px)] leading-[1.02] font-bold tracking-[0.02em] text-ink uppercase">
            Your AI.
            <br />
            <span className="glow-text">Your machine.</span>
            <br />
            Your control.
          </h1>
          <p className="mt-6 max-w-[620px] text-[17px] leading-relaxed text-muted">
            Syntara is an open-source local-AI platform built for model discovery,
            hardware-aware execution, Chat, Agents and developer workflows — with no
            account required.
          </p>

          <div className="mt-9 max-w-[640px]">
            <DownloadBox release={release} detected={detected} />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[560px]">
          <div
            aria-hidden="true"
            className="absolute -inset-10 rounded-full bg-[radial-gradient(closest-side,rgb(69_224_255/0.22),transparent_75%)] blur-2xl"
          />
          <div className="suit-scan relative border border-line-strong bg-void shadow-[0_0_70px_rgb(69_224_255/0.22)]">
            <img
              src="syntara-suit.png"
              alt="Syntara Syntra Suit interface — a futuristic armoured figure surrounded by holographic HUD panels"
              className="block w-full"
              width={1152}
              height={1369}
              loading="eager"
              decoding="async"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(2_4_9/0.85),transparent_28%)]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center">
              <div className="font-mono text-[10px] tracking-[0.42em] text-cyan uppercase drop-shadow-[0_0_12px_rgb(69_224_255/0.8)]">
                Screen&apos;s fiction, now the reality
              </div>
              <div className="mt-1 font-display text-lg font-bold tracking-[0.5em] text-ink uppercase">
                Syntara
              </div>
            </div>
          </div>

          {FLOAT_CHIPS.map((chip) => (
            <span key={chip.label} className={`stat-chip cut-sm absolute hidden md:block ${chip.pos}`}>
              ◈ {chip.label}
            </span>
          ))}

          <div className="mt-5 border border-line bg-panel px-4 py-3 text-center font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            <span className="text-terminal">●</span> No account. No cloud required. ·
            Local-first by design
          </div>
        </div>
      </Container>
    </section>
  )
}
