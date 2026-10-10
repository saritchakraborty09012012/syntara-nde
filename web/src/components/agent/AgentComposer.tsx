/* Agent composer (phase 3), modelled on a modern agentic prompt input:
   a control row with [attach | mode | model] on the left and [mic | send]
   on the right, under the task textarea. Attachments become part of the
   task text; the mic uses the same voice-typing path as chat. */

import { useRef } from "react"
import { ArrowUp, ChevronDown, FileUp, Mic, Paperclip, Square, X } from "lucide-react"

import { AGENT_MODES, type AgentMode } from "@/lib/agent/sessions"
import { cn } from "@/lib/utils"

const DOC_ACCEPT = ".txt,.md,.markdown,.csv,.json,.log,.py,.js,.jsx,.ts,.tsx,.html,.htm,.css,.scss,.yml,.yaml,.toml,.ini,.xml,.sh,.sql"

export interface ComposerModelOption {
  value: string
  label: string
}

interface AgentComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  busy: boolean
  /* No model selected yet — the send button stays disabled. */
  disabled: boolean
  mode: AgentMode
  onModeChange: (mode: AgentMode) => void
  model: string
  modelOptions: ComposerModelOption[]
  onModelChange: (model: string) => void
  listening: boolean
  micSupported: boolean
  onMicToggle: () => void
  attachments: Array<{ name: string }>
  onRemoveAttachment: (name: string) => void
  onAttachFiles: (files: FileList | null) => void
  hint: string
  /* Ready-made prompts shown above the textarea while it is empty. */
  suggestions?: string[]
}

export function AgentComposer(props: AgentComposerProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const modeInfo = AGENT_MODES.find((item) => item.id === props.mode) ?? AGENT_MODES[0]
  const modelLabel = props.modelOptions.find((option) => option.value === props.model)?.label
    || props.model
    || "No model"
  const canSend = !props.disabled && (props.value.trim().length > 0 || props.attachments.length > 0)

  return (
    <form
      className="ag-composer"
      onSubmit={(event) => {
        event.preventDefault()
        if (props.busy) props.onStop()
        else if (canSend) props.onSend()
      }}
    >
      {props.attachments.length ? (
        <div className="pending-strip">
          {props.attachments.map((doc) => (
            <div key={doc.name} className="pending-doc">
              <FileUp size={12} />
              <span>{doc.name}</span>
              <button type="button" onClick={() => props.onRemoveAttachment(doc.name)} aria-label={`Remove ${doc.name}`}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {!props.value.trim() && !props.busy && props.suggestions?.length ? (
        <div className="ag-chips-row" aria-label="Suggested prompts">
          {props.suggestions.slice(0, 4).map((text) => (
            <button key={text} type="button" className="ag-suggest-chip" onClick={() => props.onChange(text)}>
              {text}
            </button>
          ))}
        </div>
      ) : null}

      <textarea
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.busy ? "Working… send again to stop" : "Describe the task for the agent…"}
        aria-label="Agent task"
        rows={2}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            if (props.busy) props.onStop()
            else if (canSend) props.onSend()
          }
        }}
      />

      <div className="ag-control-row">
        <div className="ag-controls-left">
          <button
            type="button"
            className="ag-chip-btn"
            onClick={() => fileRef.current?.click()}
            title="Attach text files as task context"
            aria-label="Attach files"
          >
            <Paperclip size={13} />
          </button>
          <input
            ref={fileRef}
            hidden
            type="file"
            multiple
            accept={DOC_ACCEPT}
            onChange={(event) => {
              props.onAttachFiles(event.target.files)
              event.target.value = ""
            }}
          />

          <span className="ag-chip select-chip" title={modeInfo.hint}>
            <span className="ag-chip-label">{modeInfo.label}</span>
            <ChevronDown size={12} className="ag-chip-caret" aria-hidden="true" />
            <select
              value={props.mode}
              onChange={(event) => props.onModeChange(event.target.value as AgentMode)}
              aria-label="Agent mode"
            >
              {AGENT_MODES.map((item) => (
                <option key={item.id} value={item.id} title={item.hint}>{item.label}</option>
              ))}
            </select>
          </span>

          <span className="ag-chip select-chip model-chip" title={`Model: ${modelLabel}`}>
            <span className="ag-chip-label">{modelLabel}</span>
            <ChevronDown size={12} className="ag-chip-caret" aria-hidden="true" />
            <select
              value={props.model}
              onChange={(event) => props.onModelChange(event.target.value)}
              aria-label="Model"
            >
              {!props.model ? <option value="">No model</option> : null}
              {props.modelOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
              {props.model && !props.modelOptions.some((option) => option.value === props.model) ? (
                <option value={props.model}>{props.model}</option>
              ) : null}
            </select>
          </span>
        </div>

        <div className="ag-controls-right">
          <span className="ag-hint">{props.hint}</span>
          <button
            type="button"
            className={cn("mic-btn", props.listening && "listening")}
            onClick={props.onMicToggle}
            disabled={!props.micSupported}
            title={props.micSupported ? (props.listening ? "Stop voice typing" : "Start voice typing") : "Voice typing needs Chrome or Edge"}
            aria-label={props.listening ? "Stop voice typing" : "Start voice typing"}
            aria-pressed={props.listening}
          >
            <Mic size={15} />
          </button>
          <button
            type="submit"
            className={cn("send-btn", props.busy && "stop")}
            disabled={props.busy ? false : !canSend}
            aria-label={props.busy ? "Stop agent" : "Run agent"}
          >
            {props.busy ? <Square size={14} fill="currentColor" /> : <ArrowUp size={16} />}
          </button>
        </div>
      </div>
    </form>
  )
}
