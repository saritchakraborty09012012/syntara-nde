/* Send-path policy for chat (track 2b): bounded, honest retries against a
   local gateway that may still be loading or restarting.

   The lessons this encodes: a message sent while the model is coming up
   should wait and succeed instead of erroring, the wait must be bounded
   (no infinite retry loops), and the user must be told what is
   happening. Retry decisions are pure so they can be tested without a
   network. */

import { ApiError } from "./api"

/* Attempts are counted from 0; this many total tries are allowed. */
export const MAX_SEND_ATTEMPTS = 4

/* Backoff used when the server sends no Retry-After (connection
   refused while the host is still starting, for example). */
const BACKOFF_MS = [500, 1000, 2000, 4000] as const

/* Hard ceiling for a server-provided wait so a bad header can never
   pin the composer for minutes. */
const MAX_RETRY_AFTER_MS = 15_000

export interface RetryDecision {
  retry: boolean
  delayMs: number
  /* What the UI shows while waiting; empty when not retrying. */
  notice: string
}

const NO_RETRY: RetryDecision = { retry: false, delayMs: 0, notice: "" }

function noticeFor(status: number | null, attempt: number): string {
  const why = status === 503
    ? "The model is loading"
    : status === 504
      ? "The local queue timed out"
      : status === 502
        ? "The runtime restarted"
        : "The local runtime is not responding yet"
  return `${why} — retry ${attempt + 1} of ${MAX_SEND_ATTEMPTS}…`
}

/* Decide whether a failed send attempt should be retried.

   - `status === null` means the failure was not an HTTP response at
     all (connection refused while the host is starting, a dropped
     loopback socket) - the most common "wait a moment" case.
   - 502/503/504 are the gateway's own "busy / restarting / queue full"
     statuses, which honour Retry-After when present.
   - Anything else (400 validation, 401, 404...) will fail identically
     on every try, so it is surfaced immediately.
   - `hasPartialOutput` pins the answer: once tokens reached the
     transcript, a retry would duplicate them - continuation is a
     different feature (track 2c), not a retry. */
export function retryDecision(
  status: number | null,
  retryAfterSeconds: number | null,
  attempt: number,
  hasPartialOutput = false,
): RetryDecision {
  if (hasPartialOutput) return NO_RETRY
  if (attempt >= MAX_SEND_ATTEMPTS) return NO_RETRY
  const transient = status === null || status === 502 || status === 503 || status === 504
  if (!transient) return NO_RETRY
  const delayMs = retryAfterSeconds !== null && retryAfterSeconds > 0
    ? Math.min(retryAfterSeconds * 1000, MAX_RETRY_AFTER_MS)
    : BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]
  return { retry: true, delayMs, notice: noticeFor(status, attempt) }
}

/* Convenience for catch blocks: extract the status from an ApiError,
   treating any other thrown value as a non-HTTP failure. */
export function statusOf(error: unknown): number | null {
  return error instanceof ApiError ? error.status : null
}

export function retryAfterOf(error: unknown): number | null {
  return error instanceof ApiError ? error.retryAfterSeconds : null
}

/* Throttled streaming (track 2c): deltas arrive per token, but writing
   state (and re-parsing markdown) that often makes long answers jank.
   Tokens are buffered and handed over at most once per interval; the
   final partial interval is forced out on flush, so nothing is lost. */
export const STREAM_FLUSH_MS = 80

export interface DeltaBuffer {
  push(text: string): void
  /* Hand over whatever is pending now, cancelling the pending timer. */
  flush(): void
  readonly pending: string
}

export function createDeltaBuffer(
  onFlush: (chunk: string) => void,
  intervalMs = STREAM_FLUSH_MS,
  /* Injectable so tests drive time explicitly (and node test envs do
     not need window). */
  schedule: (fn: () => void, ms: number) => number = (fn, ms) => Number(setTimeout(fn, ms)),
  cancel: (id: number) => void = (id) => clearTimeout(id),
): DeltaBuffer {
  let buffer = ""
  let timer: number | null = null
  const fire = () => {
    timer = null
    const chunk = buffer
    buffer = ""
    if (chunk) onFlush(chunk)
  }
  return {
    push(text) {
      buffer += text
      if (timer === null) timer = schedule(fire, intervalMs)
    },
    flush() {
      if (timer !== null) {
        cancel(timer)
        timer = null
      }
      fire()
    },
    get pending() {
      return buffer
    },
  }
}

/* The turn sent to resume an interrupted answer (track 2c). It is
   request-only: never stored in the transcript, so history shows what
   the user actually wrote, not the continuation scaffolding. */
export const CONTINUE_NUDGE =
  "Continue exactly where you left off. Do not repeat anything already written, and do not restart the answer."

/* A stopped assistant answer can be continued only when it is the last
   message: continuing an older one would rewrite history. */
export function canContinue(
  message: { role: string; stopped?: boolean },
  isLast: boolean,
): boolean {
  return Boolean(isLast && message.role === "assistant" && message.stopped)
}
