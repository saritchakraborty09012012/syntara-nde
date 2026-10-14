/* Which mode suits a task: a tiny local keyword classifier.

   - "code-project": the task mentions code, bugs, repos, folders, builds…
     → agent mode (tools, project access) is the better home.
   - "general": the task is clearly writing/creative/translation work
     → chat mode answers it faster (no tool overhead).
   - "unknown": no confident signal → never nudge; the user chose the mode.

   Code/folder questions given IN agent mode are agent tasks (never nudged
   away); only confident "general" tasks in agent mode suggest chat. */

export type TaskFit = "code-project" | "general" | "unknown"

const CODE_RE =
  /\b(code|coding|codes|function|functions|bug|bugs|error|errors|exception|traceback|stack ?trace|repo|repos|repository|repositories|refactor|refactoring|compile|compilation|typescript|javascript|python|rust|golang|golang|java|kotlin|swift|c\+\+|c#|sql|regex|api|apis|endpoint|endpoints|unit tests?|test failures?|failing tests?|lint|linting|build fails?|deploy|deployment|docker|kubernetes|git|merge|commit|commits|branch|branches|class|classes|import|imports|module|modules|package|packages|dependency|dependencies|npm|pip|cargo|framework|compiler|debug|debugging|json|yaml|html|css|xml|cli|script|scripts|snippet|snippets|heap|memory leak|race condition|async|await|promise|promises|nullpointer|segmentation fault|stack frame|big-o|algorithm|algorithms|complexity|codebase|code base|folder|folders|directory|directories|file path|file paths|project structure|stack trace|ide|vscode|kernel|runtime|syntax|parse error|parsing|compiler error|type error|unit test|integration test|e2e|ci\/cd|github|gitlab|bitbucket|pull request|pr |merge conflict)\b/i

const GENERAL_RE =
  /\b(essay|poem|poems|story|stories|novel|lyrics|song|songs|recipe|recipes|cook|cooking|translate|translation|translations|email|emails|cover letter|resume|cv|brainstorm|slogan|tagline|joke|jokes|riddle|riddles|haiku|diary|letter|letters|blog|blogs|speech|caption|captions|tweet|tweets|instagram|short story|screenplay|screenplay|monologue|dialogue writing|creative writing|word count|summarize this article|book review|movie review)\b/i

export function classifyTask(text: string): TaskFit {
  const body = text.toLowerCase()
  const code = CODE_RE.test(body)
  const general = GENERAL_RE.test(body)
  if (code) return "code-project"
  if (general) return "general"
  return "unknown"
}

/** Should submitting this task in `mode` raise the switch-mode callout? */
export function shouldSuggestOtherMode(text: string, mode: "chat" | "agent"): boolean {
  const fit = classifyTask(text)
  if (mode === "chat") return fit === "code-project"
  return fit === "general"
}
