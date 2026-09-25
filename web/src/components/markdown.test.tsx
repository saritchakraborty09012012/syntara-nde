import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Markdown } from "./Markdown"

describe("Markdown math/LaTeX rendering", () => {
  it("typesets inline $...$ math with KaTeX", () => {
    const html = renderToStaticMarkup(<Markdown text="For $ax^2 + bx + c = 0$ we get a solution." />)
    expect(html).toContain("katex")
    expect(html).toContain("md-math-inline")
  })

  it("typesets $$...$$ block math as a display node", () => {
    const html = renderToStaticMarkup(<Markdown text="Energy:\n$$\nE = mc^2\n$$\nDone." />)
    expect(html).toContain("md-math-block")
    expect(html).toContain("katex-display")
  })

  it("renders single-line block math on its own line", () => {
    const html = renderToStaticMarkup(<Markdown text={"$$\n\\int_0^1 x^2 dx\n$$"} />)
    expect(html).toContain("md-math-block")
  })

  it("leaves code fences and plain prose untouched", () => {
    const html = renderToStaticMarkup(<Markdown text={"Price: $10 each.\n\n```js\nconst x = 1\n```"} />)
    expect(html).toContain("<p>Price: $10 each.</p>")
    expect(html).toContain("<pre><code>const x = 1</code></pre>")
    expect(html).not.toContain("katex") // a lone "$10" followed by prose word is not math
  })
})