import { describe, expect, it } from "vitest"

import { buildPdf, layoutPdfPages } from "./pdf"

describe("pdf writer", () => {
  it("emits a structurally valid PDF skeleton", () => {
    const pdf = buildPdf({
      title: "Syntara conversation",
      meta: ["Model: local-gguf", "Exported: 2026-10-11"],
      blocks: [{ heading: "User", body: "Hello from Syntara." }, { heading: "Assistant", body: "Hi there." }],
    })
    expect(pdf.startsWith("%PDF-1.4")).toBe(true)
    expect(pdf.endsWith("%%EOF\n")).toBe(true)
    expect(pdf).toContain("xref")
    expect(pdf).toContain("/Type /Catalog")
    expect(pdf).toContain("/Type /Pages")
    expect(pdf).toContain("/BaseFont /Helvetica")
    expect(pdf).toContain("(Hello from Syntara.) Tj")
  })

  it("paginates long documents and reports the page count", () => {
    const longBody = Array.from({ length: 220 }, (_, i) => `Line ${i}: some wrapping candidate text for the export.`).join("\n")
    const pages = layoutPdfPages({ title: "Long", blocks: [{ body: longBody }] })
    expect(pages.length).toBeGreaterThan(1)
    const pdf = buildPdf({ title: "Long", blocks: [{ body: longBody }] })
    expect(pdf).toContain(`/Count ${pages.length}`)
  })

  it("sanitizes non-Latin-1 characters instead of corrupting the file", () => {
    const pdf = buildPdf({
      title: "Unicode “quotes” and — dashes",
      blocks: [{ body: "Hindi का पाठ and emoji ✅ become '?'." }],
    })
    // Smart quotes mapped, em dash collapsed; no raw multi-byte chars.
    expect(pdf).toContain('(Unicode "quotes" and -- dashes)')
    // Everything outside Latin-1 is an honest '?', never a broken byte.
    expect(pdf).toContain("Hindi ?? ??? and emoji ? become '?'.")
  })

  it("escapes PDF string delimiters", () => {
    const pdf = buildPdf({ title: "T", blocks: [{ body: "path (x) and \\ backslash" }] })
    expect(pdf).toContain("path \\(x\\) and \\\\ backslash")
  })
})
