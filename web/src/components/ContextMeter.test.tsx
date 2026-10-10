import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { ContextMeter } from "./ContextMeter"

describe("ContextMeter (server-rendered)", () => {
  it("renders nothing without usage", () => {
    const html = renderToStaticMarkup(<ContextMeter usage={null} autoCompactAt={85} />)
    expect(html).toBe("")
  })

  it("shows the percent with an accessible label", () => {
    const html = renderToStaticMarkup(
      <ContextMeter usage={{ usedTokens: 4096, limitTokens: 8192, percent: 50 }} autoCompactAt={85} />,
    )
    expect(html).toContain("50%")
    expect(html).toContain("Context window 50 percent used")
  })

  it("keeps the popover closed by default", () => {
    const html = renderToStaticMarkup(
      <ContextMeter usage={{ usedTokens: 7000, limitTokens: 8192, percent: 85 }} autoCompactAt={85} />,
    )
    expect(html).not.toContain("Context window details")
  })
})
