/* Desktop startup splash — the first screen the native app shows.

   Sequence (~3 s): backdrop fades in → the mark rises with a soft "soul"
   glow lifting from below → SYNTARA types itself letter by letter → the
   tagline settles → the whole layer lifts away. A synthesised wind-chime
   runs underneath, so no audio file ships with the app.

   Rules it obeys:
   - desktop only (a browser visit of the web build must not be delayed);
   - reduced motion (the in-app setting or the OS preference) skips it —
     the same preference already disables every other animation;
   - any click or key press dismisses it immediately;
   - the timer, the typers and the AudioContext are all torn down on
     unmount, so a skipped splash cannot leak a ringing oscillator.

   It is presentational: nothing in it gates startup, and it never renders
   in tests (those are not desktop shells). */

import { useEffect, useState } from "react"
import { useLocale } from "@/i18n"
import { isDesktop } from "@/lib/update-check"

const WORD = "SYNTARA"
const TYPE_START_MS = 900
const TYPE_STEP_MS = 78
const AUTO_DISMISS_MS = 3000
const FADE_OUT_MS = 320

export function shouldShowSplash(): boolean {
  if (typeof window === "undefined" || !isDesktop()) return false
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false
  return true
}

/* Pentatonic chime (A4 base): five notes, hand-spaced, each a sine with a
   quiet octave partial and a long decay — reads as wind chimes rather than
   a notification. Silent failure is fine: autoplay policies or a missing
   AudioContext simply mean no sound. */
function playWindchimes(): () => void {
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return () => undefined
  let context: AudioContext
  try {
    context = new Ctor()
  } catch {
    return () => undefined
  }
  void context.resume().catch(() => undefined)
  const master = context.createGain()
  master.gain.value = 0.075
  master.connect(context.destination)

  const notes = [69, 74, 76, 81, 84]
  const at = [120, 420, 760, 1180, 1620]
  const timers = notes.map((midi, index) =>
    window.setTimeout(() => {
      if (context.state !== "running") return
      const start = context.currentTime
      const frequency = 440 * 2 ** ((midi - 69) / 12)

      const fundamental = context.createOscillator()
      fundamental.type = "sine"
      fundamental.frequency.value = frequency
      const env = context.createGain()
      env.gain.setValueAtTime(0.0001, start)
      env.gain.exponentialRampToValueAtTime(1, start + 0.014)
      env.gain.exponentialRampToValueAtTime(0.0001, start + 1.5)
      fundamental.connect(env).connect(master)

      const partial = context.createOscillator()
      partial.type = "sine"
      partial.frequency.value = frequency * 2.01
      const partialEnv = context.createGain()
      partialEnv.gain.setValueAtTime(0.0001, start)
      partialEnv.gain.exponentialRampToValueAtTime(0.35, start + 0.01)
      partialEnv.gain.exponentialRampToValueAtTime(0.0001, start + 0.6)
      partial.connect(partialEnv).connect(master)

      fundamental.start(start)
      partial.start(start)
      fundamental.stop(start + 1.6)
      partial.stop(start + 0.7)
    }, at[index]),
  )

  return () => {
    timers.forEach((timer) => window.clearTimeout(timer))
    void context.close().catch(() => undefined)
  }
}

export function StartupSplash({ onDone }: { onDone: () => void }) {
  const { t } = useLocale()
  const [typed, setTyped] = useState(0)
  const [leaving, setLeaving] = useState(false)

  const dismiss = () => setLeaving(true)

  /* Timers + audio: one effect, fully cleaned up. `leaving` drives the
     outro; the outro itself unmounts via `onDone`. */
  useEffect(() => {
    const timers: number[] = []
    for (let index = 1; index <= WORD.length; index += 1) {
      timers.push(window.setTimeout(() => setTyped(index), TYPE_START_MS + index * TYPE_STEP_MS))
    }
    const stopChimes = playWindchimes()
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      stopChimes()
    }
  }, [])

  useEffect(() => {
    if (leaving) {
      const timer = window.setTimeout(onDone, FADE_OUT_MS)
      return () => window.clearTimeout(timer)
    }
    const auto = window.setTimeout(dismiss, AUTO_DISMISS_MS)
    const onKey = () => dismiss()
    window.addEventListener("keydown", onKey)
    return () => {
      window.clearTimeout(auto)
      window.removeEventListener("keydown", onKey)
    }
  }, [leaving, onDone])

  return (
    <div
      className={leaving ? "startup-splash leaving" : "startup-splash"}
      onMouseDown={dismiss}
      role="presentation"
      aria-hidden="true"
    >
      <div className="splash-soul" />
      <div className="splash-core">
        <img src="/syntara-logo.png" alt="" className="splash-logo" />
        <div className="splash-word" aria-hidden="true">
          {WORD.split("").map((letter, index) => (
            <span key={`${letter}-${index}`} className={index < typed ? "splash-letter on" : "splash-letter"}>
              {letter}
            </span>
          ))}
          <span className={typed < WORD.length ? "splash-caret on" : "splash-caret"} />
        </div>
        <div className={typed >= WORD.length ? "splash-tagline on" : "splash-tagline"}>
          {t("brand.tagline")}
        </div>
      </div>
      <div className="splash-hint">Click anywhere to skip</div>
    </div>
  )
}
