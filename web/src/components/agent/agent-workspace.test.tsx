import { describe, expect, it } from "vitest"
import type { ComponentProps } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { AgentComposer } from "./AgentComposer"
import { AgentDocks } from "./AgentDocks"
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
  })
})

describe("AgentDocks", () => {
  it("shows the todo list and an honest preview empty state", () => {
    const html = renderToStaticMarkup(
      <AgentDocks todo={["Reproduce the failure"]} running={false} lastRun={null} previewUrl={null} onClosePreview={noop} copiedKey={null} onCopy={noop} />,
    )
    expect(html).toContain("Progress")
    expect(html).toContain("Reproduce the failure")
    expect(html).toContain("Preview")
    expect(html).toContain("npm run dev")
    expect(html).not.toContain("<iframe")
  })

  it("summarises the last run with a copy action", () => {
    const html = renderToStaticMarkup(
      <AgentDocks todo={[]} running={false} lastRun={{ status: "done", steps: 3, text: "All checks pass." }} previewUrl={null} onClosePreview={noop} copiedKey={null} onCopy={noop} />,
    )
    expect(html).toContain("Completed in 3 steps")
    expect(html).toContain("All checks pass.")
    expect(html).toContain('aria-label="Copy final answer"')
  })

  it("renders a sandboxed iframe when a preview URL exists", () => {
    const html = renderToStaticMarkup(
      <AgentDocks todo={[]} running lastRun={null} previewUrl="http://127.0.0.1:5173" onClosePreview={noop} copiedKey={null} onCopy={noop} />,
    )
    expect(html).toContain('src="http://127.0.0.1:5173"')
    expect(html).toContain('aria-label="Close preview"')
  })
})
