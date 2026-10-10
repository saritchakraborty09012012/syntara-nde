/* Git branch discovery for the topbar chip.

   Inside the desktop shell the agent filesystem bridge reads `.git/HEAD`
   scoped to the active project folder; a plain web session has no bridge
   and simply reports no branch (the chip stays hidden — honest, not fake). */

import { agentFsRead, agentToolsAvailable } from "./agent-tools"

/* `ref: refs/heads/<branch>` for a normal HEAD, bare sha for a detached one. */
export function parseGitHead(content: string): string | null {
  const text = content.trim()
  if (!text) return null
  const match = text.match(/^ref:\s*refs\/heads\/(.+)$/)
  if (match) return match[1].trim() || null
  if (/^[0-9a-f]{7,40}$/i.test(text)) return text.slice(0, 7)
  return null
}

export async function readGitBranch(root: string): Promise<string | null> {
  if (!root || !agentToolsAvailable()) return null
  try {
    const result = await agentFsRead(root, ".git/HEAD")
    return parseGitHead(result.content)
  } catch {
    /* Not a git repo, unreadable HEAD, or the bridge refused — all fine. */
    return null
  }
}
