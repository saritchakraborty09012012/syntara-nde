import { describe, expect, it } from "vitest"
import type { ComponentProps } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { AgentComposer } from "./AgentComposer"
import { AgentDocks } from "./AgentDocks"
import { AgentFolderBar } from "./AgentFolderBar"
import { AgentSessions } from "./AgentSessions"
import { AgentStage } from "./AgentStage"
import { createSession, createTurn, type AgentSession } from "@/lib/agent/sessions"

const noop = () => undefined

function sessionProps(overrides: Partial<ComponentProps<typeof AgentSessions>> = {}) {
  return {
    entries: [],
    activeId: null,
    running: false,
    projectName: null,
    projectPath: null,
    toolsActive: false,
    canPickFolder: false,
    grants: [{ tool: "fs_write", label: "Write files", granted: false }],
    onNew: noop,
    onSelect: noop,
    onDelete: noop,
    onPickFolder: noop,
    onRevoke: noop,
    ...overrides,
  }
}

describe("AgentSessions", () => {
  it("shows the empty hint, the new-session action and permission chips", () => {
    const html = renderToStaticMarkup(<AgentSessions {...sessionProps()} />)
    expect(html).toContain("No sessions yet")
    expect(html).toContain('aria-label="New session"')
    expect(html).toContain("planning only")
    expect(html).toContain("Write files: asks")
    expect(html).toContain("Choose folder")
  })

  it("groups sessions, marks the active running row and exposes deletes", () => {
    const now = Date.now()
    const html = renderToStaticMarkup(
      <AgentSessions
        {...sessionProps({
          entries: [{ id: "s1", title: "Fix parser", createdAt: now, updatedAt: now }],
          activeId: "s1",
          running: true,
          projectName: "syntara",
          projectPath: "D:/code/syntara",
          toolsActive: true,
        })}
      />,
    )
    expect(html).toContain("Today")
    expect(html).toContain("Fix parser")
    expect(html).toContain("ag-session-dot busy")
    expect(html).toContain("tools active")
    expect(html).toContain('aria-label="Delete session: Fix parser"')
  })

  it("only offers the collapse control when App wires onCollapse", () => {
    const plain = renderToStaticMarkup(<AgentSessions {...sessionProps()} />)
    expect(plain).not.toContain('aria-label="Hide sessions"')
    const collapsible = renderToStaticMarkup(<AgentSessions {...sessionProps({ onCollapse: noop })} />)
    expect(collapsible).toContain('aria-label="Hide sessions"')
    expect(collapsible).toContain('aria-label="New session"')
  })
})

function composerProps(overrides: Partial<ComponentProps<typeof AgentComposer>> = {}) {
  return {
    value: "",
    onChange: noop,
    onSend: noop,
    onStop: noop,
    busy: false,
    disabled: false,
    mode: "build" as const,
    onModeChange: noop,
    model: "qwen-local",
    modelOptions: [{ value: "qwen-local", label: "Qwen" }],
    onModelChange: noop,
    listening: false,
    micSupported: true,
    onMicToggle: noop,
    attachments: [],
    onRemoveAttachment: noop,
    onAttachFiles: noop,
    hint: "Build mode · max 8 steps",
    ...overrides,
  }
}

describe("AgentComposer", () => {
  it("renders the control row: attach, mode, model, mic, send", () => {
    const html = renderToStaticMarkup(<AgentComposer {...composerProps({ mode: "plan" })} />)
    expect(html).toContain('aria-label="Attach files"')
    expect(html).toContain('aria-label="Agent mode"')
    expect(html).toContain(">Plan</option>")
    expect(html).toContain('aria-label="Model"')
    expect(html).toContain("Qwen")
    expect(html).toContain('aria-label="Start voice typing"')
    expect(html).toContain('aria-label="Run agent"')
    expect(html).toContain("Build mode · max 8 steps")
    expect(html).toContain('<span class="ag-chip-label">Plan</span>')
  })

  it("swaps to a stop button and working placeholder while busy", () => {
    const html = renderToStaticMarkup(<AgentComposer {...composerProps({ busy: true, value: "do it" })} />)
    expect(html).toContain('aria-label="Stop agent"')
    expect(html).toContain("Working… send again to stop")
    expect(html).not.toContain('aria-label="Run agent"')
  })

  it("disables the mic with an honest title when speech recognition is missing", () => {
    const html = renderToStaticMarkup(<AgentComposer {...composerProps({ micSupported: false })} />)
    expect(html).toContain("disabled")
    expect(html).toContain("Voice typing needs Chrome or Edge")
  })

  it("lists pending attachments with remove buttons", () => {
    const html = renderToStaticMarkup(<AgentComposer {...composerProps({ attachments: [{ name: "notes.md" }] })} />)
    expect(html).toContain("notes.md")
    expect(html).toContain("Remove notes.md")
  })
})

function stageSession(): AgentSession {
  const session = createSession("qwen-local", 1_700_000_000_000)
  session.title = "Fix parser"
  const turn = createTurn("Fix the parser bug", "build", 1_700_000_000_000)
  turn.status = "done"
  turn.events = [
    { type: "step", step: 1 },
    { type: "assistant_text", text: "Found the off-by-one." },
    { type: "done", text: "Found the off-by-one.", steps: 1 },
  ]
  session.turns = [turn]
  return session
}

describe("AgentStage", () => {
  it("shows the empty state with task suggestions", () => {
    const html = renderToStaticMarkup(
      <AgentStage session={null} running={false} projectName="syntara" copiedKey={null} onCopy={noop} suggestions={["Audit this repository and list the riskiest spots"]} onSuggest={noop} />,
    )
    expect(html).toContain("Give the agent a task.")
    expect(html).toContain("Audit this repository and list the riskiest spots")
    expect(html).toContain("permission first")
  })

  it("renders the turn as a right-aligned task with copy-only actions and the run stream", () => {
    const html = renderToStaticMarkup(
      <AgentStage session={stageSession()} running={false} projectName="syntara" copiedKey={null} onCopy={noop} suggestions={[]} onSuggest={noop} />,
    )
    expect(html).toContain("Fix the parser bug")
    expect(html).toContain('aria-label="Copy task"')
    expect(html).not.toContain("Edit and resend")
    expect(html).toContain("Found the off-by-one.")
    expect(html).toContain("Done · 1 step")
    expect(html).toContain("syntara")
    expect(html).toContain("1 turn")
  })

  it("shows the running status pill while a run streams", () => {
    const session = stageSession()
    session.turns[0].status = "running"
    const html = renderToStaticMarkup(
      <AgentStage session={session} running projectName="syntara" copiedKey={null} onCopy={noop} suggestions={[]} onSuggest={noop} />,
    )
    expect(html).toContain("ag-status-pill running")
    expect(html).toContain("ag-orb")
  })

  it("greets with the kicker, rotating line and robot illustration when empty", () => {
    const html = renderToStaticMarkup(
      <AgentStage session={null} running={false} projectName="syntara" copiedKey={null} onCopy={noop} suggestions={[]} onSuggest={noop} />,
    )
    expect(html).toContain("SYNTARA AGENT")
    expect(html).toContain("Local agents that can actually work.")
    expect(html).toContain('class="ag-rotator"')
    expect(html).toContain('class="ag-illustration"')
    expect(html).toContain("aria-label=\"A robot working on a laptop\"")
  })
})

describe("AgentComposer suggestions", () => {
  it("shows chips only while the draft is empty and idle", () => {
    const idle = renderToStaticMarkup(<AgentComposer {...composerProps({ suggestions: ["Fix the build"] })} />)
    expect(idle).toContain("ag-chips-row")
    expect(idle).toContain("Fix the build")
    const typed = renderToStaticMarkup(<AgentComposer {...composerProps({ value: "x", suggestions: ["Fix the build"] })} />)
    expect(typed).not.toContain("ag-chips-row")
    const busy = renderToStaticMarkup(<AgentComposer {...composerProps({ busy: true, suggestions: ["Fix the build"] })} />)
    expect(busy).not.toContain("ag-chips-row")
  })
})

describe("AgentFolderBar", () => {
  it("lists projects, marks the active one and gates the new-project picker", () => {
    const html = renderToStaticMarkup(
      <AgentFolderBar
        projects={[{ id: "p1", name: "syntara" }]}
        activeId="p1"
        onSelect={noop}
        onNewProject={noop}
        canPickFolder={false}
        onPickResult={noop}
      />,
    )
    expect(html).toContain("Projects")
    expect(html).toContain('class="ag-folder-chip active"')
    expect(html).toContain("syntara")
    expect(html).toContain("disabled")
    expect(html).toContain("desktop app")
    expect(html).not.toContain('aria-label="Search project files"')
  })

  it("shows the file search box only when App wires onSearch", () => {
    const html = renderToStaticMarkup(
      <AgentFolderBar
        projects={[]}
        activeId={null}
        onSelect={noop}
        onNewProject={noop}
        canPickFolder
        onSearch={async () => []}
        onPickResult={noop}
      />,
    )
    expect(html).toContain('aria-label="Search project files"')
    expect(html).toContain("No folders yet")
    expect(html).not.toContain("disabled")
  })
})

function docksProps(overrides: Partial<ComponentProps<typeof AgentDocks>> = {}) {
  return {
    todo: [] as string[],
    running: false,
    startedAt: null,
    events: [] as ComponentProps<typeof AgentDocks>["events"],
    lastRun: null,
    permission: null,
    permissionNote: "No project folder — \"Always allow\" applies to this session only.",
    onSettlePermission: noop,
    question: null,
    onAnswerQuestion: noop,
    plan: null,
    onPlanText: noop,
    onApprovePlan: noop,
    onDismissPlan: noop,
    previewUrl: null,
    previewNonce: 0,
    onClosePreview: noop,
    onReloadPreview: noop,
    copiedKey: null,
    onCopy: noop,
    ...overrides,
  }
}

describe("AgentDocks", () => {
  it("shows the todo list and an honest preview empty state", () => {
    const html = renderToStaticMarkup(<AgentDocks {...docksProps({ todo: ["Reproduce the failure"] })} />)
    expect(html).toContain("Progress")
    expect(html).toContain("Reproduce the failure")
    expect(html).toContain("Preview")
    expect(html).toContain("npm run dev")
    expect(html).not.toContain("<iframe")
  })

  it("summarises the last run with a copy action", () => {
    const html = renderToStaticMarkup(
      <AgentDocks {...docksProps({ lastRun: { status: "done", steps: 3, text: "All checks pass." } })} />,
    )
    expect(html).toContain("Completed in 3 steps")
    expect(html).toContain("All checks pass.")
    expect(html).toContain('aria-label="Copy final answer"')
  })

  it("renders a sandboxed iframe when a preview URL exists", () => {
    const html = renderToStaticMarkup(
      <AgentDocks {...docksProps({ running: true, previewUrl: "http://127.0.0.1:5173" })} />,
    )
    expect(html).toContain('src="http://127.0.0.1:5173"')
    expect(html).toContain('aria-label="Close preview"')
    expect(html).toContain('aria-label="Reload preview"')
  })

  it("pins the permission dock with all three decisions", () => {
    const html = renderToStaticMarkup(
      <AgentDocks {...docksProps({ permission: { tool: "fs_write", args: { path: "src/app.ts" } } })} />,
    )
    expect(html).toContain('role="alertdialog"')
    expect(html).toContain("Allow <code>fs_write</code>")
    expect(html).toContain("src/app.ts")
    expect(html).toContain(">Deny<")
    expect(html).toContain(">Allow once<")
    expect(html).toContain(">Always allow<")
  })

  it("pins a question dock with option chips and an answer box", () => {
    const html = renderToStaticMarkup(
      <AgentDocks {...docksProps({ question: { text: "Which database?", options: ["sqlite", "postgres"] } })} />,
    )
    expect(html).toContain("Which database?")
    expect(html).toContain(">sqlite<")
    expect(html).toContain(">postgres<")
    expect(html).toContain('aria-label="Answer"')
    expect(html).toContain(">Answer<")
  })

  it("shows an editable plan dock with approve and dismiss actions", () => {
    const html = renderToStaticMarkup(
      <AgentDocks {...docksProps({ plan: { text: "1. Reproduce\n2. Fix the guard" } })} />,
    )
    expect(html).toContain('aria-label="Plan review"')
    expect(html).toContain("Reproduce")
    expect(html).toContain("Fix the guard")
    expect(html).toContain("Approve &amp; run")
    expect(html).toContain("Dismiss")
    expect(html).toContain('aria-label="Edit plan"')
  })

  it("turns proc_run tool events into live command rows", () => {
    const html = renderToStaticMarkup(
      <AgentDocks
        {...docksProps({
          running: true,
          startedAt: Date.now(),
          events: [
            { type: "tool_start", callId: "c1", name: "proc_run", args: { argv: ["npm", "test"] } },
            { type: "tool_end", callId: "c1", name: "proc_run", ok: true, durationMs: 1200, output: "" },
            { type: "tool_start", callId: "c2", name: "proc_run", args: { argv: ["npm", "run", "build"] } },
            { type: "subagent_start", task: "Audit the parser" },
          ],
        })}
      />,
    )
    expect(html).toContain("npm test")
    expect(html).toContain("1200 ms")
    expect(html).toContain("Commands")
    expect(html).toContain("Audit the parser")
    expect(html).toContain("Sub-agents")
    expect(html).toContain("Executing tools")
  })
})
