/* Model-facing tool definitions for the agent loop (phase 4).

   One source of truth for what the local model may call: the same list
   binds the parser (unknown names are refused) and the executor (bound()
   checks it), and the descriptions double as the system-prompt tool list.
   The execution side lives in `execute.ts`; the desktop commands these
   map to are `desktop/src-tauri/src/agent_tools.rs`. */

import type { ToolDefinition } from "./loop"
import type { ModePolicy } from "./sessions"

export const AGENT_TOOL_SPECS: ToolDefinition[] = [
  {
    spec: {
      type: "function",
      function: {
        name: "fs_read",
        description: "Read a UTF-8 text file inside the project folder. Paths are relative to the project root.",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path relative to the project root, e.g. README.md" },
          },
          required: ["path"],
        },
      },
    },
  },
  {
    spec: {
      type: "function",
      function: {
        name: "fs_list",
        description: "List a folder inside the project folder (folders first). Empty path lists the project root.",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "Folder path relative to the project root; empty = root" },
          },
        },
      },
    },
  },
  {
    spec: {
      type: "function",
      function: {
        name: "fs_write",
        description: "Create or overwrite a UTF-8 text file inside the project folder. Asks permission first.",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "File path relative to the project root" },
            content: { type: "string", description: "Full text content to write" },
          },
          required: ["path", "content"],
        },
      },
    },
  },
  {
    spec: {
      type: "function",
      function: {
        name: "proc_run",
        description:
          "Run one program with an explicit argv array inside the project folder (no shell). Asks permission first.",
        parameters: {
          type: "object",
          properties: {
            argv: {
              type: "array",
              items: { type: "string" },
              description: 'Program and arguments, e.g. ["git", "status"]',
            },
            timeout_s: { type: "number", description: "Wall-clock limit in seconds (default 60, max 300)" },
          },
          required: ["argv"],
        },
      },
    },
  },
  {
    spec: {
      type: "function",
      function: {
        name: "todo",
        description: "Replace the agent's todo list (the UI shows it). Send the full list every time.",
        parameters: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: { type: "string" },
              description: "Ordered todo items; empty array clears the list",
            },
          },
          required: ["items"],
        },
      },
    },
  },
  {
    spec: {
      type: "function",
      function: {
        name: "web_fetch",
        description:
          "Fetch one web page over http(s) through the local gateway and get its text. Asks permission first (a URL can leak file contents).",
        parameters: {
          type: "object",
          properties: {
            url: { type: "string", description: "Absolute http:// or https:// URL to fetch" },
          },
          required: ["url"],
        },
      },
    },
  },
  {
    spec: {
      type: "function",
      function: {
        name: "subagent",
        description:
          "Delegate one self-contained research task to a read-only sub-agent (file reads, listings, web fetches). Returns its final report.",
        parameters: {
          type: "object",
          properties: {
            task: { type: "string", description: "The full task statement for the sub-agent" },
          },
          required: ["task"],
        },
      },
    },
  },
]

export const AGENT_TOOL_NAMES: string[] = AGENT_TOOL_SPECS.map((tool) => tool.spec.function.name)

/* Plan/read-only surface: local reads plus web_fetch. Writes, processes and
   sub-agents stay in the full set only. */
export const READ_ONLY_TOOL_NAMES = ["fs_read", "fs_list", "todo", "web_fetch"]

/* The sub-agent gets a tighter read-only set of its own: no todo (the
   parent owns the list) and no nested sub-agents. */
export const SUBAGENT_TOOL_NAMES = ["fs_read", "fs_list", "web_fetch"]

/* Mode decides which specs bind before the permission gate runs. */
export function agentToolsForMode(
  policy: ModePolicy,
  opts: { available: boolean; hasProject: boolean },
): ToolDefinition[] {
  if (policy.tools === "none") return []
  if (!opts.available || !opts.hasProject) return []
  const allowed = policy.tools === "read-only" ? READ_ONLY_TOOL_NAMES : AGENT_TOOL_NAMES
  return AGENT_TOOL_SPECS.filter((tool) => allowed.includes(tool.spec.function.name))
}
