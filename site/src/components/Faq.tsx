import { Section } from "./ui"
import { FaqAccordion } from "./FaqAccordion"
import { HOME_FAQS } from "../content/faq"

export function Faq() {
  return (
    <Section
      id="faq"
      kicker="FAQ"
      title="Questions, answered."
      intro="The practical details before you download."
    >
      <FaqAccordion items={HOME_FAQS} />
      <p className="mt-6 font-mono text-[12px] tracking-[0.14em] text-muted uppercase">
        More answers on the{" "}
        <a className="text-cyan hover:text-ink" href="faq.html">
          full FAQ page ↗
        </a>
      </p>
    </Section>
  )
}
