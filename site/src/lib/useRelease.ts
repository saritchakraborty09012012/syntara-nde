import { useEffect, useState } from "react"
import {
  detectPlatform,
  fetchLatestRelease,
  initialRelease,
  type Platform,
  type ReleaseState,
} from "./releases"

export function useRelease() {
  const [release, setRelease] = useState<ReleaseState>(initialRelease)
  const [detected, setDetected] = useState<Platform | "">("")

  useEffect(() => {
    setDetected(detectPlatform())
    let cancelled = false
    void fetchLatestRelease().then((next) => {
      if (!cancelled && next) setRelease(next)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { release, detected }
}
