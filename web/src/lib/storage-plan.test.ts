import { describe, expect, it } from "vitest"

import {
  canStore,
  formatFree,
  GIB,
  modelsPathFor,
  volumeRows,
  volumeSeverity,
  type Volume,
  type VolumeReport,
} from "./storage-plan"

function volume(path: string, freeBytes: number, label = "", kind = "fixed"): Volume {
  return { path, label, totalBytes: (freeBytes + 100 * GIB), freeBytes, kind }
}

function report(volumes: Volume[], recommended: string | null, minFreeBytes = 20 * GIB): VolumeReport {
  return { volumes, recommended, minFreeBytes }
}

describe("volume rows", () => {
  it("preselects the recommended drive and lists the roomiest first", () => {
    const rows = volumeRows(
      report(
        [
          volume("C:\\", 12 * GIB),
          volume("D:\\", 900 * GIB, "Data"),
          volume("E:\\", 400 * GIB),
        ],
        "D:\\",
      ),
    )
    expect(rows.map((row) => row.path)).toEqual(["D:\\", "E:\\", "C:\\"])
    expect(rows[0].recommended).toBe(true)
    expect(rows[1].recommended).toBe(false)
    // An unlabelled drive is named after its own path tail, never "undefined".
    expect(rows[0].name).toBe("Data")
    expect(rows[2].name).toBe("C:")
  })

  it("flags a drive under 20 GB free without refusing it", () => {
    const rows = volumeRows(report([volume("C:\\", 8 * GIB)], "C:\\"))
    expect(rows[0].severity).toBe("tight")
    expect(rows[0].warning).toContain("outgrow")
    expect(canStore(rows[0])).toBe(true)
  })

  it("refuses a drive that cannot hold the file at all", () => {
    const rows = volumeRows(report([volume("C:\\", 1 * GIB)], "C:\\"), 4 * GIB)
    expect(rows[0].severity).toBe("full")
    expect(canStore(rows[0])).toBe(false)
    expect(rows[0].warning).toContain("will fail")
  })

  it("says nothing about a healthy drive", () => {
    const rows = volumeRows(report([volume("C:\\", 64 * GIB)], "C:\\"))
    expect(rows[0].severity).toBe("ok")
    expect(rows[0].warning).toBe("")
  })

  it("keeps every row when the shell reports no recommendation", () => {
    const rows = volumeRows(report([volume("Z:\\", 900 * GIB, "", "remote")], null))
    expect(rows).toHaveLength(1)
    expect(rows[0].recommended).toBe(false)
  })

  it("returns no rows before the shell answers", () => {
    expect(volumeRows(null)).toEqual([])
  })
})

describe("paths and labels", () => {
  it("builds the model folder inside the chosen drive", () => {
    expect(modelsPathFor(volume("C:\\", 10 * GIB))).toBe("C:\\Syntara\\models")
    expect(modelsPathFor(volume("/Volumes/Work/", 10 * GIB))).toBe("/Volumes/Work/Syntara/models")
    expect(modelsPathFor(volume("/", 10 * GIB))).toBe("/Syntara/models")
  })

  it("formats free space at every scale", () => {
    expect(formatFree(512 * 1024)).toBe("512 KB")
    expect(formatFree(8 * GIB)).toBe("8.0 GB")
    expect(formatFree(2 * 1024 * GIB)).toBe("2.0 TB")
  })

  it("treats an empty drive as full, not as tight", () => {
    expect(volumeSeverity(volume("D:\\", 0))).toBe("full")
  })
})