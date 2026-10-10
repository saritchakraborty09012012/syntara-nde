/* Voice typing for the composer, built on the Web Speech API.

   Chrome/Edge (and WebView2) expose SpeechRecognition; recognition there is
   a platform service, so the UI is honest about availability instead of
   pretending: unsupported browsers get a disabled mic with an explanation,
   and every failure mode maps to a message the user can act on. The
   transcript streams back as final + interim chunks so the draft text
   updates live while the user speaks. */

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type RecognitionCtor = new () => SpeechRecognitionLike

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null
  const scoped = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return scoped.SpeechRecognition ?? scoped.webkitSpeechRecognition ?? null
}

export function speechRecognitionSupported(): boolean {
  return recognitionCtor() !== null
}

export function browserLanguageFallback(): string {
  if (typeof navigator === "undefined") return "en-US"
  return navigator.language || "en-US"
}

/* Dictation language: the explicit setting wins, then the browser locale —
   recognizers are heavily language-dependent, so a mismatched language is
   the usual cause of "inaccurate" transcription. */
export function dictationLanguage(preferred?: string | null): string {
  const explicit = (preferred ?? "").trim()
  return explicit || browserLanguageFallback()
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access was denied. Allow the microphone for this page and try again.",
  "service-not-allowed": "Speech recognition is blocked for this page. Open the app over http(s) in Chrome or Edge.",
  "no-speech": "No speech detected. Try again and speak into the microphone.",
  "audio-capture": "No microphone was found. Check your input device and try again.",
  network: "Speech recognition lost its network connection.",
}

export interface DictationOptions {
  lang: string
  /* finals = complete transcript since start; interim = in-progress words. */
  onText: (finals: string, interim: string) => void
  onError: (message: string) => void
  onEnd: () => void
}

export interface DictationHandle {
  stop: () => void
}

export function startDictation(options: DictationOptions): DictationHandle | null {
  const Ctor = recognitionCtor()
  if (!Ctor) return null
  const recognition = new Ctor()
  recognition.lang = options.lang
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  let finals = ""
  let userStopped = false

  recognition.onresult = (event) => {
    let interim = ""
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index]
      const transcript = result[0]?.transcript ?? ""
      if (result.isFinal) finals = `${finals} ${transcript}`.trim()
      else interim += transcript
    }
    options.onText(finals, interim)
  }
  recognition.onerror = (event) => {
    const error = event.error ?? "unknown"
    /* A user-initiated stop surfaces as "aborted" — not an error. */
    if (error === "aborted" && userStopped) return
    const message = ERROR_MESSAGES[error] ?? `Voice typing failed (${error}).`
    options.onError(message)
  }
  recognition.onend = () => {
    options.onEnd()
  }

  try {
    recognition.start()
  } catch {
    /* start() throws when called twice — treat as unsupported state. */
    return null
  }

  return {
    stop: () => {
      userStopped = true
      try {
        recognition.stop()
      } catch {
        /* Already ended — nothing to stop. */
      }
    },
  }
}
