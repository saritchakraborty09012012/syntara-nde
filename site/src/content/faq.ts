export type FaqTopic = "basics" | "models" | "hardware" | "features" | "developers" | "privacy"

export type FaqEntry = {
  q: string
  a: string
  topic: FaqTopic
  /** Featured on the landing page section; every entry appears on /faq.html. */
  home: boolean
}

export const TOPICS: Record<FaqTopic, { label: string; kicker: string }> = {
  basics: { label: "Basics", kicker: "Getting started" },
  models: { label: "Models", kicker: "Models & storage" },
  hardware: { label: "Hardware", kicker: "Hardware & performance" },
  features: { label: "Features", kicker: "Features" },
  developers: { label: "Developers", kicker: "Developers & integrations" },
  privacy: { label: "Privacy", kicker: "Privacy & control" },
}

export const FAQ_ORDER: FaqTopic[] = ["basics", "models", "hardware", "features", "developers", "privacy"]

export const FAQS: FaqEntry[] = [
  {
    topic: "basics",
    home: true,
    q: "Is Syntara free to use?",
    a: "Yes. Syntara is free and open source. There is no account, subscription or signup required to run local models.",
  },
  {
    topic: "basics",
    home: true,
    q: "Do I need an account to use Syntara?",
    a: "No. Syntara has no login, no signup, no email verification and no activation step. Open the app, pick a model and start generating.",
  },
  {
    topic: "privacy",
    home: true,
    q: "Does Syntara send my data to the cloud?",
    a: "No. Inference runs on your machine against local model files. Chats, projects, memory and settings are stored locally and remain under your control.",
  },
  {
    topic: "privacy",
    home: false,
    q: "Does Syntara work offline?",
    a: "Yes. Once the application and the model files are on disk, model loading, chat, agent runs, the local API and local configuration all work without an internet connection.",
  },
  {
    topic: "models",
    home: true,
    q: "Which model formats are supported?",
    a: "Syntara supports GGUF directly, Hugging Face repositories and safetensors-based checkpoints (with architecture detection and conversion where needed), plus adapter-driven additional formats.",
  },
  {
    topic: "models",
    home: false,
    q: "Can I bring a model I already have?",
    a: "Yes. Import an existing local file or folder instead of downloading it again. Syntara inspects the file, reads its metadata and reports whether it can run before you commit to it.",
  },
  {
    topic: "models",
    home: false,
    q: "Will Syntara convert or re-quantize my model?",
    a: "Only when you ask it to. Conversion and quantization are explicit operations, and the original files are preserved. Syntara never silently replaces the model you downloaded.",
  },
  {
    topic: "models",
    home: true,
    q: "Where are my models stored?",
    a: "In a user-visible local models directory you can inspect, back up and manage from the Model Hub. Syntara never silently deletes a model.",
  },
  {
    topic: "models",
    home: false,
    q: "How do I remove a model?",
    a: "Use the Model Hub, which shows the model name, size and location before you confirm. Removing a model is always an explicit action with a confirmation step.",
  },
  {
    topic: "hardware",
    home: true,
    q: "Do I need a GPU?",
    a: "No. A CPU with AVX2 and enough RAM is the baseline. NVIDIA CUDA, Apple Metal, Vulkan and ROCm backends are used when detected; Syntara falls back to CPU automatically.",
  },
  {
    topic: "hardware",
    home: true,
    q: "How large should my model file be?",
    a: "Model size depends on parameters and quantization. Smaller quantized models can run in 8 GB RAM; larger or higher-quality models benefit from 16 GB+ and a discrete GPU. Check the runtime requirements panel before downloading.",
  },
  {
    topic: "hardware",
    home: false,
    q: "What is the difference between RAM and VRAM?",
    a: "RAM holds the model weights for CPU execution; VRAM holds them for GPU execution. A discrete GPU usually gives much higher token rates, but a well-chosen quantized model on CPU can still be perfectly usable.",
  },
  {
    topic: "hardware",
    home: false,
    q: "Why is generation slow on my machine?",
    a: "Speed depends on the model size, the quantization, how much of the model fits in memory and which backend was selected. Check which backend Syntara chose and whether a faster accelerator is available before changing the model.",
  },
  {
    topic: "features",
    home: true,
    q: "What is the difference between Chat and Agents?",
    a: "Chat is a conversational interface to a local model. Agents are permission-gated automation loops that can use files, terminal, Git, tests and project context to complete tasks.",
  },
  {
    topic: "features",
    home: false,
    q: "Can agents run commands on my machine?",
    a: "Agents can propose file writes and process runs, but those actions are permission-gated. File writes and command execution always ask first, and any standing grant is stored per project so you can revoke it.",
  },
  {
    topic: "features",
    home: false,
    q: "Can I back up my chats and projects?",
    a: "Yes. Syntara can export chats, memories, projects, settings, agent configuration and model metadata into a portable local backup you control.",
  },
  {
    topic: "features",
    home: false,
    q: "Does Syntara support projects and persistent memory?",
    a: "Yes. Projects keep their own context and configuration, and local memory persists across sessions on your device. Both stay local and can be exported or removed by you.",
  },
  {
    topic: "developers",
    home: true,
    q: "How do I expose Syntara to other tools?",
    a: "Start the local API server (OpenAI-compatible, bound to localhost by default) and point the Python SDK, n8n, an IDE or any HTTP client at it.",
  },
  {
    topic: "developers",
    home: false,
    q: "Is the local API safe to expose to my network?",
    a: "Not by default, and it should stay that way. Syntara binds to localhost. If you deliberately bind beyond localhost, you are exposing an unauthenticated inference server to that network, so only do it on a network you trust.",
  },
  {
    topic: "developers",
    home: false,
    q: "Which integrations are supported?",
    a: "An OpenAI-compatible local API, a Python SDK, a developer CLI, plus n8n and IDE integration surfaces. Each one talks to the same local runtime instead of reimplementing model loading.",
  },
  {
    topic: "developers",
    home: false,
    q: "How do I report a bug or request a model family?",
    a: "Use the repository issue tracker. Bug reports with your platform, Syntara version, model and backend are the most useful; the roadmap also lists what is planned next.",
  },
]

export const HOME_FAQS: FaqEntry[] = FAQS.filter((entry) => entry.home)
