import { describe, expect, it } from "vitest"

import { volumeRows, GIB, type Volume, type VolumeReport } from "./storage-plan"
import {
  canLeaveStorage,
  canLeaveTerms,
  chooseStorage,
  initialSetupState,
  needsTightConfirmation,
  nextStep,
  readSetupRecord,
  setupRequired,
  writeSetupRecord,
  CONSENT_VERSION,
  SETUP_STORAGE_KEY,
} from "./setup"

function volume(path: string, freeBytes: number): Volume {
  return { path, label: "", totalBytes: freeBytes + 100 * GIB, freeBytes, kind: "fixed" }
}

function rowsFor(volumes: Volume[], recommended: string | null) {
  const report: VolumeReport = { volumes, recommended, minFreeBytes: 20 * GIB }
  return volumeRows(report)
}

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
  }
}

describe("consent gate", () => {
  it("holds the flow until both documents are accepted", () => {
    const state = initialSetupState()
    expect(state.step).toBe("terms")
    expect(canLeaveTerms(state)).toBe(false)
    expect(nextStep(state)).toBeNull()

    const termsOnly = { ...state, termsAccepted: true }
    expect(canLeaveTerms(termsOnly)).toBe(false)

    const both = { ...termsOnly, privacyRead: true }
    expect(canLeaveTerms(both)).toBe(true)
    expect(nextStep(both)).toBe("storage")
  })
})

describe("storage step", () => {
  const rows = rowsFor([volume("C:\\", 12 * GIB), volume("D:\\", 900 * GIB)], "D:\\")

  it("starts on the recommended drive", () => {
    expect(initialSetupState(rows).storagePath).toBe("D:\\Syntara\\models")
  })

  it("refuses a drive with no room and accepts a tight one after a warning", () => {
    const rows2 = rowsFor([volume("C:\\", 1 * GIB)], "C:\\")
    const tight = rowsFor([volume("C:\\", 8 * GIB)], "C:\\")

    const full = initialSetupState(rows2)
    expect(canLeaveStorage(full)).toBe(false)

    const onTight = { ...initialSetupState(tight), step: "storage" as const }
    expect(needsTightConfirmation(tight, onTight.storagePath)).toBe(true)
    expect(canLeaveStorage(onTight)).toBe(false)
    expect(nextStep({ ...onTight, tightAcknowledged: true })).toBe("done")
  })

  it("clears the acknowledgement when the drive changes", () => {
    const tight = { ...initialSetupState(rowsFor([volume("C:\\", 8 * GIB), volume("D:\\", 900 * GIB)], "D:\\")), step: "storage" as const }
    const onTight = chooseStorage({ ...tight, storagePath: "C:\\Syntara\\models" }, "C:\\Syntara\\models")
    const acknowledged = { ...onTight, tightAcknowledged: true }
    expect(canLeaveStorage(acknowledged)).toBe(true)

    const moved = chooseStorage(acknowledged, "D:\\Syntara\\models")
    expect(moved.tightAcknowledged).toBe(false)
    expect(canLeaveStorage(moved)).toBe(true)
  })

  it("never chooses a location the user did not make", () => {
    const state = initialSetupState([])
    expect(state.storagePath).toBeNull()
    expect(canLeaveStorage(state)).toBe(false)
    expect(nextStep(state)).toBeNull()
  })
})

describe("persistence", () => {
  it("stores the consent and asks again when the documents change", () => {
    const storage = memoryStorage()
    expect(setupRequired(storage)).toBe(true)
    writeSetupRecord(storage, {
      version: CONSENT_VERSION,
      acceptedAt: 1700000000000,
      storagePath: "D:\\Syntara\\models",
    })
    expect(setupRequired(storage)).toBe(false)
    expect(readSetupRecord(storage)?.storagePath).toBe("D:\\Syntara\\models")

    // An older consent version is treated as no consent at all.
    storage.setItem(SETUP_STORAGE_KEY, JSON.stringify({ version: 0, acceptedAt: 1, storagePath: null }))
    expect(setupRequired(storage)).toBe(true)
  })

  it("treats unreadable storage as a fresh install instead of crashing", () => {
    expect(setupRequired({ getItem: () => "{not json" })).toBe(true)
    expect(setupRequired({ getItem: () => null })).toBe(true)
  })
})