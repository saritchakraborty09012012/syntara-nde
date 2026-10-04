import type { FaqEntry } from "../content/faq"

// Native <details>/<summary> keeps the answers in the DOM, so the content is
// readable without JavaScript and without a client-side open-state that can
// drift out of sync with what the visitor actually clicked.
export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <details key={item.q} className="faq-hud cut-sm">
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  )
}
