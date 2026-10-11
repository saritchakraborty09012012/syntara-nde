/* Minimal PDF writer (redesign Phase D): enough structure to export a
   conversation or agent session as a plain, universally readable PDF
   without shipping a heavyweight PDF library. Helvetica core font,
   Latin-1 sanitized text, simple pagination.

   Scope honesty: this produces a valid single-column text PDF — it does
   not embed images, syntax-highlight, or render Markdown styling. That is
   a deliberate trade against pulling jsPDF into the bundle. */

const PAGE_WIDTH = 595 // A4 portrait, points
const PAGE_HEIGHT = 842
const MARGIN = 54
const BODY_SIZE = 11
const LEADING = 15
const TITLE_SIZE = 16
const META_SIZE = 9
const CONTENT_BOTTOM = MARGIN

interface PdfTextItem {
  x: number
  y: number
  text: string
  font: "F1" | "F2" // F1 = Helvetica, F2 = Helvetica-Bold
  size: number
}

interface PdfPage {
  items: PdfTextItem[]
}

/* PDF strings use Latin-1 (WinAnsi). Map the common Unicode we realistically
   see in chat/exported text onto it; everything else becomes '?' — an
   honest glyph rather than a corrupt byte that breaks the whole file. */
function sanitizeLatin1(input: string): string {
  const replacements: Record<string, string> = {
    "‘": "'", "’": "'", "“": '"', "”": '"',
    "–": "-", "—": "--", "…": "...",
    "•": "*", "→": "->", "←": "<-", "↑": "^", "↓": "v",
    "×": "x", "÷": "/", "≈": "~", "≠": "!=", "≤": "<=", "≥": ">=",
    " ": " ",
  }
  let out = ""
  for (const ch of input) {
    if (replacements[ch]) { out += replacements[ch]; continue }
    const code = ch.codePointAt(0) ?? 63
    out += code >= 32 && code <= 255 ? ch : "?"
  }
  return out
}

function escapePdfString(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

/* Greedy word wrap at a conservative char-per-line estimate for Helvetica.
   Good enough for readable exports; not a full metrics engine. */
function wrapText(text: string, size: number, maxWidth: number): string[] {
  const avgCharWidth = size * 0.5
  const maxChars = Math.max(16, Math.floor(maxWidth / avgCharWidth))
  const words = text.split(/\s+/).filter(Boolean)
  if (!words.length) return [""]
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    if (current && current.length + 1 + word.length > maxChars) {
      lines.push(current)
      current = word
    } else {
      current = current ? `${current} ${word}` : word
    }
  }
  if (current) lines.push(current)
  return lines
}

export interface PdfDocumentInput {
  title: string
  /* Optional subtitle/meta line (model, folder, export date…). */
  meta?: string[]
  /* Blocks: role/section headings bold, body wrapped, blank lines between. */
  blocks: Array<{ heading?: string; body: string }>
}

/* Builds the page layout for the document. Exported for tests. */
export function layoutPdfPages(input: PdfDocumentInput): PdfPage[] {
  const pages: PdfPage[] = []
  let page: PdfPage = { items: [] }
  let y = PAGE_HEIGHT - MARGIN

  const newPage = () => {
    pages.push(page)
    page = { items: [] }
    y = PAGE_HEIGHT - MARGIN
  }

  const pushLines = (lines: string[], font: "F1" | "F2", size: number) => {
    for (const line of lines) {
      if (y - LEADING < CONTENT_BOTTOM) newPage()
      page.items.push({ x: MARGIN, y: y - size, text: line, font, size })
      y -= LEADING
    }
  }

  // Title
  pushLines(wrapText(sanitizeLatin1(input.title), TITLE_SIZE, PAGE_WIDTH - 2 * MARGIN), "F2", TITLE_SIZE)
  y -= 4
  for (const metaLine of input.meta ?? []) {
    pushLines(wrapText(sanitizeLatin1(metaLine), META_SIZE, PAGE_WIDTH - 2 * MARGIN), "F1", META_SIZE)
  }
  y -= 10

  for (const block of input.blocks) {
    if (block.heading) {
      if (y - LEADING < CONTENT_BOTTOM) newPage()
      y -= 6
      pushLines(wrapText(sanitizeLatin1(block.heading), BODY_SIZE + 1, PAGE_WIDTH - 2 * MARGIN), "F2", BODY_SIZE + 1)
    }
    for (const rawLine of block.body.split("\n")) {
      if (!rawLine.trim()) {
        if (y - LEADING < CONTENT_BOTTOM) newPage()
        y -= LEADING / 2
        continue
      }
      pushLines(wrapText(sanitizeLatin1(rawLine), BODY_SIZE, PAGE_WIDTH - 2 * MARGIN), "F1", BODY_SIZE)
    }
    y -= 8
  }

  pages.push(page)
  return pages
}

/* Serializes the laid-out pages into a complete PDF byte string. */
export function buildPdf(input: PdfDocumentInput): string {
  const pages = layoutPdfPages(input)

  // Object numbering is pre-reserved so cross-references are exact:
  //   1 = catalog, 2 = pages tree, 3 = Helvetica, 4 = Helvetica-Bold,
  //   then per page: content stream + page object.
  const objects: string[] = []
  const addObject = (body: string) => {
    objects.push(body)
    return objects.length // 1-based object number
  }

  const catalogNum = addObject("") // 1 — patched below once kids are known
  const pagesNum = addObject("") // 2 — patched below once kids are known
  const fontF1 = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>") // 3
  const fontF2 = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>") // 4

  const pageObjectNumbers: number[] = []
  for (const p of pages) {
    const streamLines = ["BT"]
    for (const item of p.items) {
      streamLines.push(`/${item.font} ${item.size} Tf`)
      streamLines.push(`1 0 0 1 ${item.x} ${item.y} Tm`)
      streamLines.push(`(${escapePdfString(item.text)}) Tj`)
    }
    streamLines.push("ET")
    const stream = streamLines.join("\n")
    const contentNum = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    const pageNum = addObject(
      `<< /Type /Page /Parent ${pagesNum} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents ${contentNum} 0 R /Resources << /Font << /F1 ${fontF1} 0 R /F2 ${fontF2} 0 R >> >> >>`,
    )
    pageObjectNumbers.push(pageNum)
  }

  objects[pagesNum - 1] =
    `<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`
  objects[catalogNum - 1] = `<< /Type /Catalog /Pages ${pagesNum} 0 R >>`

  // Assemble with a classic xref table. Object 0 is the free head.
  // The header stays pure ASCII: Blob encodes strings as UTF-8, so any
  // non-ASCII marker bytes would expand and shift every xref offset.
  // (The binary comment line is a convention, not a validity requirement.)
  let pdf = "%PDF-1.4\n%----\n"
  const offsets: number[] = [0] // object 0 placeholder
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`
  }
  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += "0000000000 65535 f \n"
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`
  return pdf
}

/* Convenience: trigger a browser download of the PDF. */
export function downloadPdf(filename: string, input: PdfDocumentInput): void {
  const blob = new Blob([buildPdf(input)], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
