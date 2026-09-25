import type { ReactNode } from "react"

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-[min(1180px,calc(100%-40px))] ${className}`}>{children}</div>
}

export function Kicker({ children }: { children: ReactNode }) {
  return <div className="kicker">{children}</div>
}

export function Section({
  id,
  kicker,
  title,
  intro,
  children,
  className = "",
}: {
  id?: string
  kicker: string
  title: ReactNode
  intro?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={`py-20 md:py-28 ${className}`}>
      <Container>
        <Kicker>{kicker}</Kicker>
        <h2 className="section-title">{title}</h2>
        {intro ? <p className="section-intro">{intro}</p> : null}
        {children ? <div className="mt-10">{children}</div> : null}
      </Container>
    </section>
  )
}
