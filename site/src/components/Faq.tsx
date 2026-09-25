import { useState } from "react"
import { Section } from "./ui"

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Is Syntara free to use?",
    a: "Yes. Syntara is free and open source. There is no account, subscription or signup required to run local models.",
  },
  {
    q: "Does Syntara send my data to the cloud?",
    a: "No. Inference runs on your machine against local model files. Chats, projects, memory and settings are stored locally and remain under your control.",
  },
  {
    q: "Which model formats are supported?",
    a: "Syntara supports GGUF directly, Hugging Face repositories and safetensors-based checkpoints (with architecture detection and conversion where needed), plus adapter-driven additional formats.",
  },
  {
    q: "Do I need a GPU?",
    a: "No. A CPU with AVX2 and enough RAM is the baseline. NVIDIA CUDA, Apple Metal, Vulkan and ROCm backends are used when detected; Syntara falls back to CPU automatically.",
  },
  {
    q: "What is the difference between Chat and Agents?",
    a: "Chat is a conversational interface to a local model. Agents are permission-gated automation loops that can use files, terminal, Git, tests and project context to complete tasks.",
  },
  {
    q: "How do I expose Syntara to other tools?",
    a: "Start the local API server (OpenAI-compatible, bound to localhost by default) and point the Python SDK, n8n, an IDE or any HTTP client at it.",
  },
  {
    q: "How large should my model file be?",
    a: "Model size depends on parameters and quantization. Smaller quantized models can run in 8 GB RAM; larger or higher-quality models benefit from 16 GB+ and a discrete GPU. Check the runtime requirements panel before downloading.",
  },
  {
    q: "Where are my models stored?",
    a: "In a user-visible local models directory you can inspect, back up and manage from the Model Hub. Syntara never silently deletes a model.",
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <Section
      id="faq"
      kicker="FAQ"
      title="Questions, answered."
      intro="The practical details before you download."
    >
      <div className="grid gap-3">
        {FAQS.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q} className="faq-hud cut-sm">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-display text-[13px] font-bold tracking-[0.1em] text-ink uppercase">
                  {item.q}
                </span>
                <span
                  aria-hidden="true"
                  className={`font-mono text-cyan transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                >
                  +
                </span>
              </button>
              {isOpen && (
                <p className="border-t border-line px-5 py-4 text-[14px] leading-relaxed text-muted">
                  {item.a}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}
