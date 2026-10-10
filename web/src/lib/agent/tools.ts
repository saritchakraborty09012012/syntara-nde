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
  {
    spec: {
      type: "function",
      function: {
        name: "git",
        description:
          "Run a read-only git command (status, diff, log, show, blame, ls-files, rev-parse, branch, remote, shortlog) in the project folder. Mutating subcommands are refused.",
        parameters: {
          type: "object",
          properties: {
            args: {
              type: "array",
              items: { type: "string" },
              description: 'Arguments after git, e.g. ["status", "--short"] or ["log", "-5"]',
            },
          },
          required: ["args"],
        },
      },
    },
  },
  {
    spec: {
      type: "function",
      function: {
        name: "submit_plan",
        description:
          "Submit a numbered plan for the user to review and approve. Call this as your final action in plan mode; the user can edit the plan before approving.",
        parameters: {
          type: "object",
          properties: {
            steps: {
              type: "array",
              items: { type: "string" },
              description: "Ordered plan steps, each one concrete and actionable",
            },
          },
          required: ["steps"],
        },
      },
    },
  },
  {
    spec: {
      type: "function",
      function: {
        name: "ask_user",
        description:
          "Ask the user a clarifying question and wait for their answer. Use when the task is ambiguous; offer concrete options when you can.",
        parameters: {
          type: "object",
          properties: {
            question: { type: "string", description: "The question to show the user" },
            options: {
              type: "array",
              items: { type: "string" },
              description: "Optional suggested answers the user can click",
            },
          },
          required: ["question"],
        },
      },
    },
  },
  {
    spec: {
      type: "function",
      function: {
        name: "preview_open",
        description:
          "Open the local preview for a dev-server URL (loopback addresses only). If the URL is omitted, opens the server URL discovered earlier in this run.",
        parameters: {
          type: "object",
          properties: {
            url: { type: "string", description: "http://127.0.0.1:5173 style URL; omit to reuse the last one" },
          },
        },
      },
    },
  },
  {
    spec: {
      type: "function",
      function: {
        name: "preview_reload",
        description: "Reload the page currently shown in the preview dock.",
        parameters: { type: "object", properties: {} },
      },
    },
  },
  {
    spec: {
      type: "function",
      function: {
        name: "console_read",
        description:
          "Read the most recent console lines captured from the Syntara window. Use after an error to inspect what was logged.",
        parameters: { type: "object", properties: {} },
      },
    },
  },
]

export const AGENT_TOOL_NAMES: string[] = AGENT_TOOL_SPECS.map((tool) => tool.spec.function.name)

/* Tools the frontend can execute on its own (gateway fetches, UI docks).
    Everything else needs the desktop shell AND a project folder. */
export const FRONTEND_TOOL_NAMES = ["web_fetch", "ask_user", "submit_plan", "preview_open", "preview_reload", "console_read"]

/* Plan/read-only surface: local reads plus web_fetch and the interaction
    tools. Writes, processes, git and sub-agents stay in the full set. */
export const READ_ONLY_TOOL_NAMES = ["fs_read", "fs_list", "todo", "web_fetch", "submit_plan", "ask_user"]

/* The sub-agent gets a tighter read-only set of its own: no todo (the
   parent owns the list) and no nested sub-agents. */
export const SUBAGENT_TOOL_NAMES = ["fs_read", "fs_list", "web_fetch"]

/* Mode decides which specs bind before the permission gate runs. Desktop
    tools are dropped honestly when the shell (or the project folder) is
    absent, while frontend-only tools still bind — planning, questions,
    web fetches and previews all work in a plain browser session. */
export function agentToolsForMode(
  policy: ModePolicy,
  opts: { available: boolean; hasProject: boolean },
): ToolDefinition[] {
  if (policy.tools === "none") return []
  const allowed = policy.tools === "read-only" ? READ_ONLY_TOOL_NAMES : AGENT_TOOL_NAMES
  return AGENT_TOOL_SPECS.filter((tool) => {
    const name = tool.spec.function.name
    if (!allowed.includes(name)) return false
    if (FRONTEND_TOOL_NAMES.includes(name)) return true
    return opts.available && opts.hasProject
  })
}
