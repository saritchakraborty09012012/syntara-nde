/* Switch-mode callout: shown when a task looks like a better fit for the
   other mode. Accept moves the task over (and runs it there); Stay sends
   it in the current mode; the × keeps the draft and just closes. */

import { X } from "lucide-react"

interface ModeFitNudgeProps {
  from: "chat" | "agent"
  onAccept: () => void
  onStay: () => void
  onDismiss: () => void
}

export function ModeFitNudge(props: ModeFitNudgeProps) {
  const toChat = props.from === "agent"
  return (
    <div className="mode-nudge" role="alertdialog" aria-label="Suggested mode">
      <p>
        {toChat
          ? "This looks like a general-purpose task — chat mode will answer faster. Use chat instead?"
          : "This looks like a code or project task — agent mode has the tools for it. Switch to agent mode?"}
      </p>
      <button type="button" className="primary-btn" onClick={props.onAccept}>
        {toChat ? "Yes, use chat" : "Switch to agent"}
      </button>
      <button type="button" className="ghost-btn" onClick={props.onStay}>
        {toChat ? "Stay here" : "Stay in chat"}
      </button>
      <button type="button" className="icon-btn mode-nudge-x" onClick={props.onDismiss} aria-label="Dismiss suggestion">
        <X size={13} />
      </button>
    </div>
  )
}
