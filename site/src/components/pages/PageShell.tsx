import type { ReactNode } from "react"
import { Nav } from "../Nav"
import { Footer } from "../Footer"
import { Container, Kicker } from "../ui"

/**
 * Chrome shared by the standalone pages (about / privacy / faq). `home` is "./"
 * because every page lives at the root of the built site, which keeps the
 * relative asset base working on the custom domain, on GitHub Pages project
 * paths and in any subdirectory.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-ink">
      <Nav home="./" />
      <main>{children}</main>
      <Footer home="./" />
    </div>
  )
}

export function PageHeader({
  kicker,
  title,
  intro,
  meta,
}: {
  kicker: string
  title: ReactNode
  intro?: ReactNode
  meta?: ReactNode
}) {
  return (
    <header className="relative overflow-hidden border-b border-line">
      <Container className="py-16 md:py-24">
        <Kicker>{kicker}</Kicker>
        <h1 className="section-title max-w-3xl">{title}</h1>
        {intro ? <p className="section-intro">{intro}</p> : null}
        {meta ? <div className="mt-6 font-mono text-[12px] tracking-[0.18em] text-muted uppercase">{meta}</div> : null}
      </Container>
    </header>
  )
}

export function PageSection({ children }: { children: ReactNode }) {
  return (
    <section className="py-16 md:py-20">
      <Container>{children}</Container>
    </section>
  )
}
