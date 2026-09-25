import { Section } from "./ui"

const MODELS: Array<{ name: string; cells: [string, string, string] }> = [
  { name: "GGUF", cells: ["Import / direct execution", "CPU / GPU", "Quantization"] },
  { name: "Safetensors", cells: ["Architecture detection", "Conversion when needed", "Validation"] },
  { name: "Hugging Face", cells: ["Direct sources", "Model metadata", "Hardware guidance"] },
  { name: "Additional formats", cells: ["Adapter-driven", "Extensible", "Community support"] },
]

export function Models() {
  return (
    <Section
      id="models"
      kicker="Model ecosystem"
      title="Bring your model."
      intro="Syntara is designed around format, architecture and backend separation instead of a single proprietary model container."
    >
      <div className="grid gap-3">
        <div className="row-hud cut-sm !bg-transparent !border-line-strong max-lg:hidden">
          <span className="!text-cyan">Format</span>
          <span className="!text-cyan">Ingestion</span>
          <span className="!text-cyan">Execution</span>
          <span className="!text-cyan">Handling</span>
        </div>
        {MODELS.map((row) => (
          <div key={row.name} className="row-hud cut-sm">
            <strong>{row.name}</strong>
            <span>{row.cells[0]}</span>
            <span>{row.cells[1]}</span>
            <span>{row.cells[2]}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}
