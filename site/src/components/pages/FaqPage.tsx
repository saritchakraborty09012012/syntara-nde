import { useMemo } from "react"
import { PageHeader, PageSection, PageShell } from "./PageShell"
import { FaqAccordion } from "../FaqAccordion"
import { FAQS, FAQ_ORDER, TOPICS } from "../../content/faq"

const REPO = "https://github.com/saritchakraborty09012012/syntara-nde"

export function FaqPage() {
  const grouped = useMemo(
    () =>
      FAQ_ORDER.map((topic) => ({
        topic,
        ...TOPICS[topic],
        items: FAQS.filter((entry) => entry.topic === topic),
      })).filter((group) => group.items.length > 0),
    [],
  )

  return (
    <PageShell>
      <PageHeader
        kicker="FAQ"
        title="Every answer, on one page."
        intro="The questions people actually ask about Syntara — licensing, privacy, model formats, hardware limits, the local API and what runs where."
        meta={`${FAQS.length} answers · No account required to read or use any of this`}
      />

      <PageSection>
        <nav aria-label="FAQ topics" className="mb-10 flex flex-wrap gap-2">
          {grouped.map((group) => (
            <a key={group.topic} className="hud-btn hud-btn-ghost cut-sm !px-3 !py-2 !text-[11px]" href={`#topic-${group.topic}`}>
              {group.label}
            </a>
          ))}
        </nav>

        <div className="grid gap-12">
          {grouped.map((group) => (
            <section key={group.topic} id={`topic-${group.topic}`} className="scroll-mt-28">
              <div className="kicker">{group.kicker}</div>
              <h2 className="mt-3 font-display text-[20px] font-bold tracking-[0.12em] text-ink uppercase">
                {group.label}
              </h2>
              <div className="mt-6">
                <FaqAccordion items={group.items} />
              </div>
            </section>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <div className="hud-panel cut p-8">
          <div className="kicker">Still stuck?</div>
          <h2 className="mt-3 font-display text-[20px] font-bold tracking-[0.12em] text-ink uppercase">
            Ask in the open.
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
            Syntara is developed publicly. If an answer here is wrong or missing, open an
            issue with your platform, Syntara version, model and selected backend — that is
            the fastest route to a correct answer for everyone.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="hud-btn hud-btn-primary cut-sm" href={`${REPO}/issues`} target="_blank" rel="noreferrer">
              Open issues ↗
            </a>
            <a className="hud-btn hud-btn-ghost cut-sm" href="about.html">
              About Syntara
            </a>
            <a className="hud-btn hud-btn-ghost cut-sm" href="privacy.html">
              Privacy Policy
            </a>
          </div>
        </div>
      </PageSection>
    </PageShell>
  )
}
