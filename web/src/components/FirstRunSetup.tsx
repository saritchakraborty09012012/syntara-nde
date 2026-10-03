/* First-run overlay: the terms, then where model files will live.

   Two decisions, in the order they matter. Nothing here talks to the shell —
   App.tsx hands over the volume rows it already fetched and receives the
   folder the user settled on — so every gate in this component is a pure
   function from setup.ts and is covered by setup.test.ts.

   The document shown is the same file the installer shows
   (desktop/src-tauri/windows/license.txt), imported verbatim so the two
   cannot drift into saying different things. */

import { useState } from "react"
import { HardDrive, ShieldCheck } from "lucide-react"

import { canLeaveStorage, canLeaveTerms, chooseStorage, initialSetupState, needsTightConfirmation, type SetupState } from "@/lib/setup"
import type { VolumeRow } from "@/lib/storage-plan"

import termsText from "../../../desktop/src-tauri/windows/license.txt?raw"

export interface FirstRunSetupProps {
  /** Volume rows from the shell; empty when the shell could not report. */
  rows: VolumeRow[]
  /** Set when the volume report could not be read at all. */
  error?: string
  onFinish: (modelsPath: string | null) => void
}

export function FirstRunSetup({ rows, error, onFinish }: FirstRunSetupProps) {
  const [state, setState] = useState<SetupState>(() => initialSetupState(rows))

  /* A browser session, or a shell that refused to enumerate drives, has no
     volumes to choose from. Terms still apply; the folder step is skipped
     rather than shown as an empty list the user cannot get past. */
  const hasStorageStep = rows.length > 0
  const tight = needsTightConfirmation(rows, state.storagePath)
  const canAdvance = state.step === "terms" ? canLeaveTerms(state) : hasStorageStep && canLeaveStorage(state)

  const advance = () => {
    if (state.step === "terms") {
      if (!canLeaveTerms(state)) return
      if (hasStorageStep) setState((current) => ({ ...current, step: "storage" }))
      else onFinish(state.storagePath)
      return
    }
    if (!canLeaveStorage(state)) return
    onFinish(state.storagePath)
  }

  return (
    <div className="modal-backdrop first-run">
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Welcome to Syntara">
        <div className="panel-title">
          <strong>{state.step === "terms" ? "Before you start" : "Where should models live?"}</strong>
          <span className="first-run-steps">
            <span data-on={state.step === "terms"}>1 · Terms</span>
            {hasStorageStep ? <span data-on={state.step === "storage"}>2 · Model folder</span> : null}
          </span>
        </div>

        {state.step === "terms" ? (
          <>
            <p className="panel-note">
              Syntara runs models on this machine. It needs no account, and nothing you write or run is sent
              anywhere. The full text below is the same document the installer showed.
            </p>
            <pre className="first-run-doc">{termsText}</pre>
            <label className="check-row" data-off={!state.termsAccepted}>
              <input
                type="checkbox"
                checked={state.termsAccepted}
                onChange={(event) => setState((current) => ({ ...current, termsAccepted: event.target.checked }))}
              />
              <span>I have read and agree to the Terms of Use.</span>
            </label>
            <label className="check-row" data-off={!state.privacyRead}>
              <input
                type="checkbox"
                checked={state.privacyRead}
                onChange={(event) => setState((current) => ({ ...current, privacyRead: event.target.checked }))}
              />
              <span>I have read the Privacy Policy.</span>
            </label>
          </>
        ) : (
          <>
            <p className="panel-note">
              Models are measured in gigabytes. Pick the drive to keep them on — the roomiest one is
              recommended, and you can change this later in Downloads.
            </p>
            {error ? <p className="panel-note">{error}</p> : null}
            <div className="volume-list">
              {rows.map((row) => {
                const blocked = row.severity === "full"
                const selected = state.storagePath === row.modelsPath
                return (
                  <label key={row.modelsPath} className="volume-row" data-selected={selected} data-blocked={blocked}>
                    <input
                      type="radio"
                      name="setup-volume"
                      checked={selected}
                      disabled={blocked}
                      onChange={() => setState(chooseStorage(state, row.modelsPath))}
                    />
                    <span className="volume-copy">
                      <strong>
                        {row.name} {row.recommended ? <span className="volume-badge">Recommended</span> : null}
                      </strong>
                      <small>{row.modelsPath}</small>
                    </span>
                    <span className="volume-free">{row.freeLabel}</span>
                    {row.warning ? (
                      <p className="volume-warning" data-severity={row.severity}>{row.warning}</p>
                    ) : null}
                  </label>
                )
              })}
            </div>
            {tight ? (
              <label className="check-row" data-off={!state.tightAcknowledged}>
                <input
                  type="checkbox"
                  checked={state.tightAcknowledged}
                  onChange={(event) =>
                    setState((current) => ({ ...current, tightAcknowledged: event.target.checked }))
                  }
                />
                <span>Download models to this drive anyway — it has less than 20 GB free.</span>
              </label>
            ) : null}
          </>
        )}

        <div className="modal-actions">
          {state.step === "storage" ? (
            <button type="button" className="ghost-btn" onClick={() => setState((current) => ({ ...current, step: "terms" }))}>
              Back
            </button>
          ) : null}
          <button type="button" className="primary-btn" onClick={advance} disabled={!canAdvance}>
            {state.step === "terms" ? (hasStorageStep ? "Continue" : "Start using Syntara") : "Use this drive"}
            {state.step === "terms" ? <ShieldCheck size={15} /> : <HardDrive size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}
