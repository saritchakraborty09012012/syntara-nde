import { describe, expect, it } from "vitest"

import { buildZip, extractArtifacts, safeArtifactName, stripArtifactBlocks } from "@/lib/artifacts"

describe("extractArtifacts", () => {
  it("pulls file blocks out with their names and bodies", () => {
    const text = [
      "Here is the report:",
      "```file:report.md",
      "# Hello",
      "",
      "Body text",
      "```",
      "Done.",
    ].join("\n")
    const files = extractArtifacts(text)
    expect(files).toEqual([{ name: "report.md", content: "# Hello\n\nBody text" }])
    expect(stripArtifactBlocks(text)).toBe("Here is the report:\n\nDone.")
  })

  it("supports any extension and multiple files, de-duplicating names", () => {
    const text = [
      "```file:a.py",
      "print(1)",
      "```",
      "```file:notes.txt",
      "hi",
      "```",
      "```file:a.py",
      "print(2)",
      "```",
    ].join("\n")
    const files = extractArtifacts(text)
    expect(files.map((file) => file.name)).toEqual(["a.py", "notes.txt", "a-2.py"])
    expect(files[2].content).toBe("print(2)")
  })

  it("sanitises hostile filenames", () => {
    expect(safeArtifactName("../../etc/passwd")).toBe("passwd")
    expect(safeArtifactName("..")).toBe("file.txt")
    expect(safeArtifactName("")).toBe("file.txt")
  })

  it("ignores ordinary code fences", () => {
    expect(extractArtifacts("```ts\nconst x = 1\n```")).toEqual([])
  })
})

describe("buildZip", () => {
  it("produces a structurally valid store-only zip", async () => {
    const blob = buildZip([
      { name: "hello.txt", content: "Hello, zip!" },
      { name: "b.md", content: "# B" },
    ])
    expect(blob.type).toBe("application/zip")
    const bytes = new Uint8Array(await blob.arrayBuffer())
    // local file header signature
    expect([bytes[0], bytes[1], bytes[2], bytes[3]]).toEqual([0x50, 0x4b, 0x03, 0x04])
    // end-of-central-directory signature at the tail (22 bytes, no comment)
    const tail = bytes.length - 22
    expect([bytes[tail], bytes[tail + 1], bytes[tail + 2], bytes[tail + 3]]).toEqual([0x50, 0x4b, 0x05, 0x06])
    // stored (method 0) for the first entry
    expect(bytes[8]).toBe(0)
    expect(bytes[9]).toBe(0)
  })
})
