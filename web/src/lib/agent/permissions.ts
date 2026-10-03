/* Permission policy for agent tools (phase 4).

   Three decisions, exactly as planned: `once` (this call only, cleared when
   the app restarts or the run ends), `always` (persisted on the project, so
   the next run does not ask again), `deny` (this call only — never stored,
   so the model asking again gets asked again).

   Policy: reading and listing are confined to the project root by the
   executor and run without a prompt; WRITES and PROCESS EXECUTION always
   ask unless an `always` grant exists. Grants are keyed per project — two
   projects never share consent — and a run without a project only ever
   earns session-scoped grants. */

export type PermissionDecision = "once" | "always" | "deny"

export const GATED_TOOLS = ["fs_write", "proc_run"] as const

export function isGated(tool: string): boolean {
  return (GATED_TOOLS as readonly string[]).includes(tool)
}

export function grantKey(projectId: string | null, tool: string): string {
  return `${projectId ?? "session"}::${tool}`
}

/* Persisted side of the store: `always` grants live on ProjectItem.permissions
   (a plain tool-name list) and survive reloads. The session side is a Set
   that owns `once` grants and mirrors `always` grants for fast reads. */
export interface GrantStore {
  hasAlways(projectId: string | null, tool: string): boolean
  addAlways(projectId: string | null, tool: string): void
}

export function isGranted(
  projectId: string | null,
  tool: string,
  sessionGrants: ReadonlySet<string>,
  store: GrantStore,
): boolean {
  return sessionGrants.has(grantKey(projectId, tool)) || store.hasAlways(projectId, tool)
}

export function recordDecision(
  decision: PermissionDecision,
  projectId: string | null,
  tool: string,
  sessionGrants: Set<string>,
  store: GrantStore,
): void {
  if (decision === "deny") return
  sessionGrants.add(grantKey(projectId, tool))
  if (decision === "always") store.addAlways(projectId, tool)
}
