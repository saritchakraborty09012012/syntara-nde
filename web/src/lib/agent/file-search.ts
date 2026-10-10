/* Project file search for the FolderBar (phase 3): a bounded breadth-first
   walk over the project tree using the desktop shell's fs_list. Depth,
   entry count and result count are all capped so a huge repository can
   never hang the UI; the lister is injectable for tests. */

import { agentFsList, type DirListResult } from "../agent-tools"

export const SEARCH_MAX_DEPTH = 4
export const SEARCH_MAX_ENTRIES = 4000
export const SEARCH_MAX_RESULTS = 20

export type FileLister = (root: string, path?: string) => Promise<DirListResult>

export async function searchProjectFiles(
  root: string,
  query: string,
  lister: FileLister = agentFsList,
): Promise<string[]> {
  const needle = query.trim().toLowerCase()
  if (!root || needle.length < 2) return []

  const results: string[] = []
  const prefixHits: string[] = []
  let scanned = 0
  let queue: Array<{ path: string; depth: number }> = [{ path: "", depth: 0 }]

  while (queue.length && scanned < SEARCH_MAX_ENTRIES && results.length + prefixHits.length < SEARCH_MAX_RESULTS * 3) {
    const current = queue.shift() as { path: string; depth: number }
    let listing: DirListResult
    try {
      listing = await lister(root, current.path || undefined)
    } catch {
      /* Unreadable folders (permissions, races) are skipped, not fatal. */
      continue
    }
    for (const entry of listing.entries) {
      scanned += 1
      if (scanned > SEARCH_MAX_ENTRIES) break
      const relative = current.path ? `${current.path}/${entry.name}` : entry.name
      if (entry.kind === "dir") {
        if (current.depth + 1 <= SEARCH_MAX_DEPTH) queue.push({ path: relative, depth: current.depth + 1 })
        continue
      }
      const name = entry.name.toLowerCase()
      if (!name.includes(needle)) continue
      if (name.startsWith(needle)) prefixHits.push(relative)
      else results.push(relative)
    }
  }

  return [...prefixHits, ...results].slice(0, SEARCH_MAX_RESULTS)
}
