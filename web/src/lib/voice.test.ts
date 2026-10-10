import { describe, expect, it, vi } from "vitest"
import { browserLanguageFallback, dictationLanguage, speechRecognitionSupported } from "./voice"

describe("speechRecognitionSupported", () => {
  it("is false in the test environment (no SpeechRecognition constructor)", () => {
    expect(speechRecognitionSupported()).toBe(false)
  })
})

describe("dictationLanguage", () => {
  it("prefers the explicit setting", () => {
    expect(dictationLanguage("hi-IN")).toBe("hi-IN")
    expect(dictationLanguage("  en-GB  ")).toBe("en-GB")
  })

  it("falls back to the browser locale when no preference is stored", () => {
    expect(dictationLanguage(null)).toBe(browserLanguageFallback())
    expect(dictationLanguage("")).toBe(browserLanguageFallback())
  })
})
