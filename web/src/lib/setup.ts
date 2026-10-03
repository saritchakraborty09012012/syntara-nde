/* First run: the two things worth asking before a model is downloaded.

   1. The terms of use and the privacy policy. Both are opt-in and both are
      local facts, not paperwork for a service: Syntara runs on this machine,
      uploads nothing, and has no account. The gate exists so that is a
      decision the user makes rather than a paragraph they scroll past, and it
      is versioned, so a later change to either document asks again instead of
      being silently accepted forever.

   2. Where model files go. A model is measured in gigabytes, and the drive
      that has room today may not be the one with room after the download, so
      the choice is made before the first byte rather than discovered when a
      download fails. The roomiest drive is preselected and labelled as such;
      a drive under the floor is flagged, not refused.

   The step order, the conditions for leaving each step and what is persisted
   live here so they can be tested without a webview; the component only
   renders what this decides. */

import type { VolumeRow } from "./storage-plan"

/** Bump when the terms or the privacy policy change: the gate asks again. */
export const CONSENT_VERSION = 1

export const SETUP_STORAGE_KEY = "syntara-setup"

export type SetupStep = "terms" | "storage" | "done"

export interface SetupRecord {
  version: number
  acceptedAt: number
  /** The model folder the user chose, as reported by the shell. */
  storagePath: string | null
}

export interface SetupState {
  step: SetupStep
  termsAccepted: boolean
  privacyRead: boolean
  storagePath: string | null
  /** Set when the user kept a tight drive after being warned about it. */
  tightAcknowledged: boolean
  rows: VolumeRow[]
}

export const initialSetupState = (rows: VolumeRow[] = []): SetupState => ({
  step: "terms",
  termsAccepted: false,
  privacyRead: false,
  storagePath: rows.find((row) => row.recommended)?.modelsPath ?? null,
  tightAcknowledged: false,
  rows,
})

/** Whether the chosen row still needs an explicit "yes, here anyway". */
export function needsTightConfirmation(rows: VolumeRow[], path: string | null): boolean {
  const row = rows.find((entry) => entry.modelsPath === path)
  return Boolean(row && row.severity === "tight")
}

export function canLeaveTerms(state: SetupState): boolean {
  return state.termsAccepted && state.privacyRead
}

export function canLeaveStorage(state: SetupState): boolean {
  if (!state.storagePath) return false
  const row = state.rows.find((entry) => entry.modelsPath === state.storagePath)
  // A drive that cannot hold a model is not offered; a tight one is, with the
  // warning acknowledged.
  if (!row || row.severity === "full") return false
  if (row.severity === "tight") return state.tightAcknowledged
  return true
}

/** The next step, or null when the flow is finished. */
export function nextStep(state: SetupState): SetupStep | null {
  if (state.step === "terms") return canLeaveTerms(state) ? "storage" : null
  if (state.step === "storage") return canLeaveStorage(state) ? "done" : null
  return null
}

export function chooseStorage(state: SetupState, modelsPath: string | null): SetupState {
  // Choosing a different drive clears the acknowledgement: the warning was
  // about the previous one.
  return { ...state, storagePath: modelsPath, tightAcknowledged: false }
}

/** Read a stored record, ignoring anything written by an older consent. */
export function readSetupRecord(storage: Pick<Storage, "getItem">): SetupRecord | null {
  try {
    const raw = storage.getItem(SETUP_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SetupRecord> | null
    if (!parsed || parsed.version !== CONSENT_VERSION || typeof parsed.acceptedAt !== "number") {
      return null
    }
    return {
      version: parsed.version,
      acceptedAt: parsed.acceptedAt,
      storagePath: typeof parsed.storagePath === "string" ? parsed.storagePath : null,
    }
  } catch {
    return null
  }
}

export function writeSetupRecord(
  storage: Pick<Storage, "setItem">,
  record: SetupRecord,
): void {
  try {
    storage.setItem(SETUP_STORAGE_KEY, JSON.stringify(record))
  } catch {
    // A browser that refuses localStorage still gets the setup flow; it just
    // asks again next launch, which is the safe direction to fail in.
  }
}

/** Whether the first-run flow should appear at all. */
export function setupRequired(storage: Pick<Storage, "getItem">): boolean {
  return readSetupRecord(storage) === null
}