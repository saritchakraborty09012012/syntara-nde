import type { ReactNode } from "react"
import { PageHeader, PageSection, PageShell } from "./PageShell"

const SECTIONS: Array<{ id: string; title: string; body: ReactNode }> = [
  {
    id: "information-we-collect",
    title: "1. Information We Collect",
    body: (
      <>
        <p>
          We do not intentionally collect, sell, rent, or require personal information from
          users of Syntara.
        </p>
        <p>Syntara does not require:</p>
        <ul>
          <li>Account creation or login</li>
          <li>Email addresses</li>
          <li>Names</li>
          <li>Phone numbers</li>
          <li>Passwords</li>
          <li>Payment information</li>
          <li>Personal profiles</li>
        </ul>
        <p>
          Syntara is designed to run locally on your device, and your local data, chats,
          projects, memories, settings, and files are intended to remain on your device
          unless you choose to use an external service or integration.
        </p>
      </>
    ),
  },
  {
    id: "data-stored-by-syntara",
    title: "2. Data Stored by Syntara",
    body: (
      <>
        <p>
          Syntara may store application data locally on your device when required for its
          functionality, such as settings, downloaded models, conversations, projects,
          memories, logs, and other application configuration.
        </p>
        <p>
          This data is stored locally and is not intentionally transmitted to NDE.
        </p>
        <p>
          You remain responsible for managing and protecting data stored on your own
          device.
        </p>
      </>
    ),
  },
  {
    id: "third-party-services",
    title: "3. Third-Party Services",
    body: (
      <>
        <p>
          Syntara may allow users to connect external services, APIs, model providers,
          integrations, or other third-party tools.
        </p>
        <p>
          When you choose to use such services, those services may process information
          according to their own privacy policies and terms. NDE does not control the
          privacy practices of third-party services.
        </p>
      </>
    ),
  },
  {
    id: "website",
    title: "4. Website",
    body: (
      <>
        <p>Our website does not require an account or registration.</p>
        <p>
          Our hosting, content-delivery, analytics, security, or other infrastructure
          providers may process limited technical information such as IP addresses,
          browser information, device information, or server logs as part of operating and
          securing the website. Such processing is controlled by the respective service
          providers and their applicable policies.
        </p>
      </>
    ),
  },
  {
    id: "open-source",
    title: "5. Open Source",
    body: (
      <>
        <p>
          Syntara is open source and released under the MIT License. The source code is
          publicly available so that anyone can inspect, modify, and redistribute it in
          accordance with the applicable license.
        </p>
        <p>
          The open-source nature of Syntara does not mean that third-party services used
          alongside it are subject to the MIT License or to this Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: "childrens-privacy",
    title: "6. Children's Privacy",
    body: (
      <p>
        Syntara does not intentionally collect personal information from children or
        require users to provide personal information.
      </p>
    ),
  },
  {
    id: "changes-to-this-privacy-policy",
    title: "7. Changes to This Privacy Policy",
    body: (
      <p>
        We may update this Privacy Policy when necessary to reflect changes to Syntara, our
        website, or applicable requirements. The latest version will always be published on
        this page.
      </p>
    ),
  },
  {
    id: "contact",
    title: "8. Contact",
    body: (
      <p>
        If you have questions about this Privacy Policy or Syntara's privacy practices,
        you can contact us through the contact information provided on the official
        Syntara website.
      </p>
    ),
  },
]

export function PrivacyPage() {
  return (
    <PageShell>
      <PageHeader
        kicker="Privacy"
        title="Privacy Policy"
        intro="NDE respects your privacy. Syntara is designed with privacy and local-first usage in mind — the short version is that your prompts and your models stay on your machine."
        meta="Last updated: October 4, 2026"
      />

      <PageSection>
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
            <div className="kicker mb-4">Contents</div>
            <ol className="grid gap-2">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a className="nav-link" href={`#${section.id}`}>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0 max-w-3xl">
            {SECTIONS.map((section) => (
              <article key={section.id} id={section.id} className="scroll-mt-28 pb-10">
                {section.title ? (
                  <h2 className="font-display text-[17px] font-bold tracking-[0.12em] text-ink uppercase">
                    {section.title}
                  </h2>
                ) : null}
                <div className="prose-syntara mt-4">{section.body}</div>
              </article>
            ))}

            <div className="hud-panel cut mt-2 p-6">
              <p className="font-display text-[15px] font-bold tracking-[0.2em] text-ink uppercase">
                NDE
              </p>
              <p className="mt-1 font-mono text-[12px] tracking-[0.18em] text-cyan uppercase">
                Syntara — Universal Local AI Platform
              </p>
            </div>
          </div>
        </div>
      </PageSection>
    </PageShell>
  )
}
