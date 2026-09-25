import { Section } from "./ui"

const CONTROL_PLANE = `Syntara
  ↓
Chat · Agents · API
  ↓
Control Plane
  ├─ Model Hub
  ├─ Model Manager
  ├─ Projects / Memory
  └─ Download Manager
  ↓
Universal Model Layer
  ↓
Backend Router
  ├─ Syntara Engine
  ├─ GGUF / native backends
  ├─ Apple / GPU backends
  └─ Community adapters
  ↓
Execution Planner
  ↓
CPU · GPU · RAM · VRAM · SSD`

const MEMORY_FABRIC = `Memory Fabric

HOT
  → GPU / VRAM

WARM
  → System RAM

COLD
  → NVMe / storage

MoE workloads
  → expert-aware streaming

Dense workloads
  → layer / tensor streaming

Long context
  → adaptive KV + context budgeting

All persistent user data
  → local + user controlled`

function Terminal({ title, code }: { title: string; code: string }) {
  return (
    <div className="hud-panel cut min-w-0">
      <div className="term-head">{title}</div>
      <pre className="code-art">{code}</pre>
    </div>
  )
}

export function Architecture() {
  return (
    <Section
      kicker="Architecture"
      title="A platform, not a single runtime."
      intro="Syntara can route different model workloads to different execution backends while keeping the interface consistent."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Terminal title="Control topology" code={CONTROL_PLANE} />
        <Terminal title="Memory fabric" code={MEMORY_FABRIC} />
      </div>
    </Section>
  )
}
