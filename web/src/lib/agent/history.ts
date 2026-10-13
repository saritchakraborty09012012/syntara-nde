/* Session context history for agent runs (context meter + auto-compact).

   The loop owns one turn: `[system, task, …tool rounds]`. A session owns the
   conversation — every earlier turn has to reach the next run, otherwise a
   follow-up question starts from nothing. This module turns session turns
   into the wire history the loop seeds with, and applies the same
   auto-compact policy chat uses:

   - the topbar meter shows the RAW size of what the next run would carry;
   - `compactSessionHistory` folds the oldest turns behind one marker before
     a run starts, at the same AUTO_COMPACT_PERCENT threshold chat uses;
   - compaction only ever drops turns from the request — the transcript in
     the sidebar is never rewritten.

   Only the final text of a past turn is carried (task + answer), not its
   tool payloads: those are per-turn working memory the model no longer
   needs, and they are what blows the window in the first place. */

import type { WireMessage } from "../api"
import { AUTO_COMPACT_PERCENT, DEFAULT_CONTEXT_LIMIT, estimateMessagesTokens } from "../context"
import type { AgentTurn } from "./sessions"

export interface AgentHistoryTurn {
  task: string
  answer: string
}

/* Final text of a turn: the `done` event when the run finished, the error
   message when it failed, otherwise whatever the model produced live
   (streamed text + tool output), so a run in progress still counts toward
   the meter instead of showing 0% while it works. */
export function turnAnswerText(turn: AgentTurn): string {
  const reversed = [...turn.events].reverse()
  const done = reversed.find((event) => event.type === "done")
  if (done && done.type === "done" && done.text) return done.text
  if (turn.status === "error") {
    const failure = reversed.find((event) => event.type === "error")
    if (failure && failure.type === "error") return `(${failure.message})`
  }
  const parts: string[] = []
  for (const event of turn.events) {
    if (event.type === "assistant_text") parts.push(event.text)
    else if (event.type === "tool_end") parts.push(typeof event.output === "string" ? event.output : "")
  }
  const live = parts.join("\n").trim()
  if (live) return live
  if (turn.status === "running") return ""
  if (turn.status === "stopped") return "(stopped before answering)"
  return "(no answer)"
}

export function sessionHistoryTurns(turns: readonly AgentTurn[]): AgentHistoryTurn[] {
  return turns.map((turn) => ({ task: turn.task, answer: turnAnswerText(turn) }))
}

function turnMessages(turn: AgentHistoryTurn): WireMessage[] {
  const messages: WireMessage[] = [{ role: "user", content: turn.task }]
  messages.push({ role: "assistant", content: turn.answer || "(no answer yet)" })
  return messages
}

export function sessionMessages(turns: readonly AgentHistoryTurn[]): WireMessage[] {
  return turns.flatMap(turnMessages)
}

export interface AgentHistoryOutcome {
  messages: WireMessage[]
  /* Turns the request dropped; 0 when everything fit. */
  droppedTurns: number
}

/* Fold the oldest turns behind a marker until the request fits the
   auto-compact budget. At least one turn always survives — a session with a
   single oversized turn still runs (the loop's own compaction trims the
   tool rounds inside it). */
export function compactSessionHistory(
  turns: readonly AgentHistoryTurn[],
  limitTokens: number = DEFAULT_CONTEXT_LIMIT,
): AgentHistoryOutcome {
  const limit = limitTokens > 0 ? limitTokens : DEFAULT_CONTEXT_LIMIT
  const budget = Math.round((limit * AUTO_COMPACT_PERCENT) / 100)
  let kept = [...turns]
  let droppedTurns = 0
  while (kept.length > 1 && estimateMessagesTokens(sessionMessages(kept)) > budget) {
    kept = kept.slice(1)
    droppedTurns += 1
  }
  if (droppedTurns === 0) return { messages: sessionMessages(turns), droppedTurns: 0 }
  const marker: WireMessage = {
    role: "user",
    content: [
      `[${droppedTurns} earlier turn${droppedTurns === 1 ? "" : "s"} were compacted to fit the model's context window.`,
      "The session continues below — treat it as your working memory.]",
    ].join("\n"),
  }
  return { messages: [marker, ...sessionMessages(kept)], droppedTurns }
}
