/* Downloadable artifacts: files the model hands back to the user.

   Convention - the model wraps each file's full content in a fenced block
   whose info string is "file:" plus the filename:

       ```file:report.md
       # Hello
       ```

   Any extension works; one file per block. Both chat messages and agent
   answers are scanned, the blocks are stripped from the rendered body and
   turned into direct-download chips (plus an optional zip of everything).

   The zip writer below is store-only (no compression) - a few dozen lines
   against a full dependency, and text files in a chat download rarely
   justify DEFLATE. */

export interface ArtifactFile {
  name: string
  content: string
}

const FILE_BLOCK_RE = /```file:([^\n`]+)\r?\n([\s\S]*?)```/g

/** Strip unsafe path bits from a model-supplied filename: no directories,
    no traversal, no control characters; a sane fallback keeps downloads
    usable even when the info string is garbage. */
export function safeArtifactName(raw: string): string {
  const base = raw.trim().split(/[\\/]/).pop() || ""
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001f\u007f"`<>|?*]/g, "").trim()
  if (!cleaned || cleaned === "." || cleaned === "..") return "file.txt"
  return cleaned.slice(0, 120)
}

/** Pull every ```file: block out of a text, de-duplicating names by
    appending -2, -3, ... so two files never overwrite each other. */
export function extractArtifacts(text: string): ArtifactFile[] {
  const files: ArtifactFile[] = []
  const seen = new Map<string, number>()
  for (const match of text.matchAll(FILE_BLOCK_RE)) {
    const rawName = safeArtifactName(match[1] ?? "")
    const count = seen.get(rawName) ?? 0
    seen.set(rawName, count + 1)
    const dot = rawName.lastIndexOf(".")
    const stem = count === 0 || dot <= 0 ? rawName.slice(0, dot > 0 ? dot : rawName.length) : rawName.slice(0, dot)
    const ext = dot > 0 ? rawName.slice(dot) : ""
    const name = count === 0 ? rawName : `${stem}-${count + 1}${ext}`
    files.push({ name, content: (match[2] ?? "").replace(/\n$/, "") })
  }
  return files
}

/** The same text with the file blocks removed - what the transcript shows
    (the chips carry the files themselves). */
export function stripArtifactBlocks(text: string): string {
  return text.replace(FILE_BLOCK_RE, "").replace(/\n{3,}/g, "\n\n").trim()
}

/* --- store-only zip (PKWARE APPNOTE, method 0) --- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let index = 0; index < 256; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[index] = value >>> 0
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let index = 0; index < data.length; index += 1) {
    crc = CRC_TABLE[(crc ^ data[index]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function dosTimestamp(date: Date): { time: number; date: number } {
  return {
    time: ((date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)) & 0xffff,
    date: (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff,
  }
}

/** Build a valid .zip Blob containing the files verbatim (stored). */
export function buildZip(files: ArtifactFile[]): Blob {
  const encoder = new TextEncoder()
  const stamp = dosTimestamp(new Date())
  const localParts: BlobPart[] = []
  const centralParts: BlobPart[] = []
  let offset = 0
  let centralSize = 0

  for (const file of files) {
    const nameBytes = encoder.encode(safeArtifactName(file.name))
    const data = encoder.encode(file.content)
    const crc = crc32(data)

    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint16(6, 0x0800, true)
    local.setUint16(8, 0, true)
    local.setUint16(10, stamp.time, true)
    local.setUint16(12, stamp.date, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, data.length, true)
    local.setUint32(22, data.length, true)
    local.setUint16(26, nameBytes.length, true)
    local.setUint16(28, 0, true)
    localParts.push(new Uint8Array(local.buffer), nameBytes as unknown as BlobPart, data as unknown as BlobPart)

    const central = new DataView(new ArrayBuffer(46))
    central.setUint32(0, 0x02014b50, true)
    central.setUint16(4, 20, true)
    central.setUint16(6, 20, true)
    central.setUint16(8, 0x0800, true)
    central.setUint16(10, 0, true)
    central.setUint16(12, stamp.time, true)
    central.setUint16(14, stamp.date, true)
    central.setUint32(16, crc, true)
    central.setUint32(20, data.length, true)
    central.setUint32(24, data.length, true)
    central.setUint16(28, nameBytes.length, true)
    central.setUint32(42, offset, true)
    centralParts.push(new Uint8Array(central.buffer), nameBytes as unknown as BlobPart)
    centralSize += 46 + nameBytes.length

    offset += 30 + nameBytes.length + data.length
  }

  const eocd = new DataView(new ArrayBuffer(22))
  eocd.setUint32(0, 0x06054b50, true)
  eocd.setUint16(8, files.length, true)
  eocd.setUint16(10, files.length, true)
  eocd.setUint32(12, centralSize, true)
  eocd.setUint32(16, offset, true)

  return new Blob([...localParts, ...centralParts, new Uint8Array(eocd.buffer)], {
    type: "application/zip",
  })
}

/** Trigger a browser download for a Blob; object URL is revoked shortly
    after so repeated downloads cannot leak memory. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function downloadArtifact(file: ArtifactFile): void {
  downloadBlob(new Blob([file.content], { type: "text/plain;charset=utf-8" }), safeArtifactName(file.name))
}

export function downloadArtifactsZip(files: ArtifactFile[], zipName = "syntara-files.zip"): void {
  downloadBlob(buildZip(files), zipName)
}

/** The instruction appended to system prompts so the model knows the
    convention. Kept short - it rides along with every request. */
export const FILE_BLOCK_HINT =
  'To hand the user a downloadable file, wrap its full content in exactly one fenced block whose info string is "file:" plus the filename (any extension), e.g.\n```file:report.md\n...content...\n```\nOne file per block; do not embed file blocks inside other code fences.'
