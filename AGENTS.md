# Syntara — AGENTS.md
# Universal Local-AI Platform — Repository Agent Instructions

You are the primary engineering agent working inside the Syntara repository.

Syntara is a universal local-AI platform designed to make locally downloaded AI models usable across desktop applications, developer workflows, APIs, Python programs, automation systems, and integrations. The central principle is simple:

    The user's models run on the user's device.

Syntara should orchestrate, optimize, expose, and manage those local models rather than requiring Syntara to host the user's model inference in a cloud service.

These instructions apply to every coding, debugging, refactoring, documentation, architecture, testing, and repository-maintenance task performed in this project.


================================================================================
1. CORE MISSION
================================================================================

Your job is to turn user requests into correct, maintainable, production-quality changes to Syntara.

Priorities, in order:

1. Preserve Syntara's architectural intent.
2. Make the requested change actually work.
3. Avoid regressions and unnecessary complexity.
4. Keep local-first/privacy-first behavior intact.
5. Preserve cross-platform support.
6. Keep the codebase understandable and modular.
7. Verify important behavior with tests, builds, type checks, linting, or direct execution.
8. Keep documentation synchronized with meaningful architectural changes.

Do not optimize for merely producing code that looks plausible.

A change is not complete because the code was written. It is complete when the relevant behavior has been implemented, integrated, and verified to the extent practical.


================================================================================
2. SYNTARA PRODUCT PRINCIPLES
================================================================================

Syntara is local-first.

The normal inference path is:

    User
      ↓
    Syntara
      ↓
    Local model runtime / backend
      ↓
    Model files stored on user's device

Do not silently redesign this into a hosted inference service.

Syntara may use cloud services for optional supporting functionality such as documentation, update metadata, model discovery, package distribution, telemetry only when explicitly designed, or external integrations. Such services must not be confused with the core local inference engine.

Important principles:

- Local models belong to the user.
- The application should not require an account merely to run local models.
- Syntara should work without authentication for its core local functionality.
- Offline operation should be preserved wherever technically possible.
- The user should remain in control of downloaded models and local data.
- Never upload a user's model or private prompt data to a server unless a feature explicitly requires it and the UI/documentation makes that behavior clear.
- Do not add authentication simply because a conventional SaaS architecture would normally have it.
- Do not add a cloud database just to store data that can safely remain local.
- Do not add telemetry, tracking, or analytics casually.
- Do not make a local feature dependent on an unrelated online service.

When a feature appears to conflict with the local-first architecture, stop and examine the architecture before implementing it.


================================================================================
3. PROJECT CONTEXT
================================================================================

The repository currently contains major areas including:

    .github/
    assets/
    c/
    desktop/
    docker/
    docs/
    integrations/
    site/
    syntara/
    web/

These directories may evolve. Always inspect the repository before assuming an exact structure.

Likely architectural responsibilities:

    desktop/
        Native desktop application, desktop UI, local runtime integration,
        system-level behavior, packaging, and desktop-specific functionality.

    syntara/
        Core Syntara engine/library/services. Prefer placing reusable
        platform logic here rather than duplicating it in UI layers.

    c/
        Low-level/native components where required for performance,
        runtime bindings, hardware acceleration, or platform integration.

    integrations/
        External developer and automation integrations, including API,
        SDK, automation, and connector-facing functionality.

    web/
        Web-facing application or developer-facing web functionality.

    site/
        Public Syntara website, marketing, documentation entry points,
        downloads, product information, and related web content.

    docker/
        Containerized development, testing, or optional deployment support.

    docs/
        Architecture, developer documentation, specifications, guides,
        and implementation notes.

    assets/
        Static assets and shared project resources.

    .github/
        CI/CD, issue templates, workflows, repository automation, and
        project configuration.

Do not move code between these areas without understanding why the current
boundary exists.


================================================================================
4. REPOSITORY-FIRST BEHAVIOR
================================================================================

Before modifying code:

1. Inspect the relevant files.
2. Determine the existing architecture.
3. Identify the entry point and dependency direction.
4. Find related implementations.
5. Check existing tests and scripts.
6. Check relevant documentation.
7. Make the smallest coherent change that solves the problem.

Do not invent files, APIs, modules, environment variables, commands, or framework conventions when the repository already contains the answer.

Prefer:

    inspect → understand → modify → verify

over:

    guess → rewrite → hope


================================================================================
5. DO NOT DESTROY EXISTING WORK
================================================================================

Never perform broad destructive changes merely to make implementation easier.

Avoid:

- deleting large directories without a clear reason;
- replacing an existing architecture wholesale;
- rewriting working modules because a different style seems nicer;
- removing dependencies without checking their usage;
- changing configuration globally for a local problem;
- renaming large numbers of files without necessity;
- resetting user changes;
- overwriting unrelated work;
- deleting generated or user-owned assets without confirmation.

If a requested change requires a migration, make the migration explicit and controlled.

If a large refactor is genuinely necessary, first map the affected dependency graph and preserve behavior with tests or checkpoints.


================================================================================
6. REQUIREMENT INTERPRETATION
================================================================================

When the user gives a detailed request, use the request as the primary specification.

Do not repeatedly ask questions whose answers are already present in:

- the current message;
- repository files;
- configuration;
- documentation;
- existing implementation;
- previous decisions recorded in project docs.

If a reasonable assumption is necessary, make it explicit and proceed when the risk is low.

Ask a clarification only when proceeding would likely produce the wrong architecture, destroy data, create a security problem, or materially change the user's intended behavior.

Do not stop at analysis when the requested task is implementable.


================================================================================
7. IMPLEMENTATION WORKFLOW
================================================================================

For non-trivial tasks, use this workflow.

PHASE A — Understand

- Inspect relevant files.
- Search for existing implementations.
- Read architecture documentation.
- Identify public interfaces.
- Identify platform-specific code.
- Identify tests.

PHASE B — Plan

Determine:

- what changes;
- what must remain unchanged;
- which modules own the behavior;
- what APIs need modification;
- what tests are required;
- whether documentation needs updating.

PHASE C — Implement

- Modify the smallest sensible set of files.
- Reuse existing abstractions.
- Keep platform-specific code isolated.
- Preserve public APIs unless the task explicitly changes them.

PHASE D — Verify

Run the most relevant available checks:

- formatter;
- linter;
- type checker;
- unit tests;
- integration tests;
- build;
- package checks;
- direct smoke test.

If a check cannot run, state why.

PHASE E — Review

Before finishing:

- inspect the final diff;
- check for accidental changes;
- check error handling;
- check platform behavior;
- check user-visible behavior;
- check documentation;
- remove temporary debugging code.


================================================================================
8. LOCAL MODEL ARCHITECTURE
================================================================================

Syntara's most important abstraction is the separation between:

    Model files
    Runtime/backend
    Model manager
    Inference API
    Application integrations

Do not couple the UI directly to one model format or one runtime.

Conceptually:

    Model Registry / Model Manager
              ↓
        Model Metadata
              ↓
       Runtime Adapter
        ↙    ↓     ↘
     CPU    GPU    Hybrid
              ↓
        Inference Engine
              ↓
        Unified API
        ↙    ↓     ↘
    Desktop  SDK   Integrations


The system should be designed so that adding another model format or runtime
does not require rewriting the application layer.


================================================================================
9. UNIVERSAL MODEL SUPPORT
================================================================================

Syntara is intended to support a broad range of locally usable model formats
and runtimes.

Examples may include:

- GGUF;
- Hugging Face model repositories;
- Safetensors;
- compatible transformer checkpoints;
- runtime-specific formats;
- quantized variants;
- future formats.

Do not assume that one format is the canonical format forever.

When adding model support, separate:

    discovery
    download
    verification
    metadata
    conversion
    quantization
    storage
    runtime loading
    inference

A format conversion feature must not silently replace the user's original
model unless explicitly requested.

Preserve original files where practical.


================================================================================
10. MODEL DOWNLOADS
================================================================================

Model downloads can be extremely large.

Therefore:

- support resumable downloads where practical;
- show useful progress;
- avoid loading large model files into memory unnecessarily;
- verify downloaded content where checksums or hashes are available;
- handle interrupted downloads;
- handle insufficient disk space;
- handle permission errors;
- handle network failures;
- avoid duplicate downloads;
- allow cancellation;
- make storage locations understandable;
- never silently delete a user's model.

For remote repositories, do not assume network availability.

A failed download should produce a useful error rather than a generic crash.


================================================================================
11. MODEL STORAGE
================================================================================

Model storage should be explicit and predictable.

Do not scatter model files throughout the repository.

Keep model metadata separate from model binaries where practical.

Metadata may include:

- model identifier;
- source;
- format;
- quantization;
- architecture;
- parameter count;
- context length;
- tokenizer information;
- file size;
- checksum;
- runtime compatibility;
- hardware requirements;
- download status;
- local path.

Never hard-code a single user's filesystem path into the application.


================================================================================
12. RUNTIME ABSTRACTION
================================================================================

Syntara should expose a stable internal runtime interface.

A conceptual runtime interface may include operations such as:

    discover()
    validate()
    load()
    unload()
    generate()
    stream()
    cancel()
    capabilities()
    memory_usage()
    shutdown()

The exact names must follow the existing codebase.

Do not create a second competing abstraction when one already exists.

A runtime adapter should own runtime-specific details such as:

- command-line invocation;
- native bindings;
- GPU backend selection;
- tensor loading;
- context configuration;
- batching;
- streaming;
- runtime errors.

The application layer should not need to know those implementation details.


================================================================================
13. HARDWARE BACKENDS
================================================================================

Syntara should treat hardware acceleration as a capability layer.

Potential backends can include:

- CPU;
- CUDA;
- Vulkan;
- Metal;
- DirectML;
- ROCm;
- vendor-specific accelerators;
- future backends.

Never assume that every machine has a discrete GPU.

Never assume that GPU acceleration is available.

Always provide a sensible CPU fallback when the selected runtime supports it.

Hardware detection should be capability-based rather than model-name-based.

If a backend is unavailable:

    detect → explain → fallback when safe

Do not crash merely because an optional accelerator is absent.


================================================================================
14. MEMORY-AWARE EXECUTION
================================================================================

Local AI can be constrained by:

- system RAM;
- VRAM;
- shared GPU memory;
- storage bandwidth;
- CPU capability;
- GPU capability;
- model quantization;
- context length.

Syntara should avoid unnecessary memory duplication.

When handling large models:

- stream where possible;
- avoid reading entire files into RAM;
- release resources when no longer needed;
- expose useful resource information;
- fail gracefully when memory is insufficient.

Do not promise that a model can run merely because its file size is smaller than
available RAM. Runtime overhead, context, KV cache, tensors, and backend behavior
must be considered.


================================================================================
15. MODEL COMPATIBILITY
================================================================================

Compatibility checks should happen before expensive operations whenever possible.

A compatibility layer should consider:

- architecture;
- format;
- runtime;
- operating system;
- CPU features;
- GPU backend;
- available memory;
- required libraries;
- quantization;
- context requirements.

Do not mark a model "supported" merely because its filename matches a pattern.

Use actual metadata or runtime validation whenever available.


================================================================================
16. INFERENCE API
================================================================================

Syntara should provide a unified interface for applications.

The internal API should make it possible to:

- select a local model;
- send a prompt;
- stream output;
- cancel generation;
- configure generation;
- inspect model capabilities;
- manage conversations;
- receive structured errors.

Keep provider-specific behavior behind adapters.

Avoid leaking implementation-specific concepts into every client.

For example, application code should not need to know whether inference is
implemented by Runtime A, Runtime B, or Runtime C.


================================================================================
17. OPENAI-COMPATIBLE API
================================================================================

If Syntara exposes an OpenAI-compatible local endpoint, compatibility should
be intentional rather than superficial.

Support only the API surface that Syntara actually implements.

Do not claim compatibility with endpoints or parameters that are ignored.

Clearly distinguish:

    supported
    partially supported
    unsupported

Streaming behavior, error schemas, authentication behavior, model naming, and
request formats should be documented.

Local endpoints should bind safely by default.

Do not expose a local inference server to the public internet accidentally.


================================================================================
18. PYTHON SDK
================================================================================

The Python SDK exists to let developers use models that are running locally
through Syntara.

The SDK should not require Syntara to host the model remotely.

Conceptually:

    Python program
        ↓
    Syntara Python SDK
        ↓
    Local Syntara API / IPC / local endpoint
        ↓
    Local runtime
        ↓
    Local model


The SDK should make local usage simple while keeping the transport layer
replaceable.

A good SDK should handle:

- connection;
- model selection;
- chat/completions;
- streaming;
- errors;
- timeouts;
- cancellation;
- structured responses;
- local server discovery when feasible.

Do not force developers to manually construct HTTP requests for common tasks if
the SDK can safely abstract them.

Do not make the SDK dependent on a Syntara cloud account.


================================================================================
19. N8N AND AUTOMATION INTEGRATIONS
================================================================================

n8n integration is for orchestration and automation.

Syntara remains the local inference engine.

A typical flow can be:

    n8n
      ↓
    HTTP / Syntara node / SDK
      ↓
    Syntara local endpoint
      ↓
    local model

The n8n integration should not imply that Syntara must host models in the cloud.

If an automation workflow runs on another machine, explain the network topology
and security implications rather than silently exposing a local endpoint.

When adding n8n integration:

- provide predictable request/response schemas;
- support streaming only when the integration can use it correctly;
- provide useful error messages;
- document local networking requirements;
- avoid unnecessary authentication dependencies;
- do not expose localhost services publicly by default.


================================================================================
20. INTEGRATIONS
================================================================================

All integrations should depend on stable Syntara interfaces rather than
reimplementing model loading.

Examples include:

- Python SDK;
- OpenAI-compatible API;
- n8n;
- command-line interfaces;
- editor integrations;
- desktop applications;
- future automation systems.

Integration code should be thin.

Core behavior belongs in the core.


================================================================================
21. DESKTOP APPLICATION
================================================================================

The desktop application is a first-class Syntara client.

The desktop app should make local AI feel simple even when the underlying system
is technically complex.

Important UX areas include:

- model discovery;
- model download;
- model import;
- model deletion;
- runtime selection;
- hardware information;
- inference status;
- token/output streaming;
- model switching;
- settings;
- logs;
- errors;
- API server control;
- integrations.

Do not expose low-level implementation details unless they help the user.


================================================================================
22. NO LOGIN BY DEFAULT
================================================================================

Core Syntara usage should not require:

- account creation;
- sign-in;
- email verification;
- cloud identity;
- subscription activation.

Do not add login/signup screens to the core desktop experience unless the
architecture explicitly gains an optional online service that needs identity.

If an online feature eventually needs authentication, keep that authentication
isolated from local model functionality.

A user must still be able to use local models without being forced into the
online feature.


================================================================================
23. OFFLINE-FIRST BEHAVIOR
================================================================================

After required software and models are downloaded, core inference should be able
to operate without an internet connection.

Do not make these dependent on the internet:

- loading an already downloaded model;
- generating text;
- local API access;
- local chat history when stored locally;
- local configuration;
- local runtime management.

Online-only features should fail gracefully and should not break local inference.


================================================================================
24. PRIVACY
================================================================================

Treat local model usage as private by default.

Do not introduce:

- hidden telemetry;
- prompt uploads;
- model uploads;
- conversation uploads;
- background network calls;
- third-party analytics;

without an explicit product decision.

When network activity is required, make it visible in code and documentation.

Secrets must never be committed to the repository.


================================================================================
25. SECURITY
================================================================================

Security is especially important because Syntara may expose local inference
through APIs.

Protect against:

- arbitrary command execution;
- path traversal;
- malicious model metadata;
- unsafe archive extraction;
- untrusted downloads;
- shell injection;
- unsafe subprocess construction;
- SSRF;
- accidental public binding;
- unauthorized LAN access;
- insecure temporary files;
- dependency vulnerabilities.

Never construct shell commands by concatenating untrusted user input.

Prefer argument arrays / structured subprocess APIs.

Validate file paths before reading or writing.

Treat downloaded model metadata as untrusted input.


================================================================================
26. LOCAL SERVER BINDING
================================================================================

If Syntara starts an HTTP server, bind to localhost by default unless the user
explicitly chooses network access.

If network access is enabled:

- show the bind address;
- show the port;
- warn when binding beyond localhost;
- document LAN exposure;
- avoid exposing administrative endpoints unnecessarily;
- separate inference endpoints from sensitive management endpoints where possible.

Never silently turn a local AI server into an internet-facing server.


================================================================================
27. PROCESS MANAGEMENT
================================================================================

When Syntara launches a runtime process:

- track its PID/process handle;
- capture stdout/stderr appropriately;
- detect startup failure;
- detect unexpected exit;
- terminate cleanly;
- avoid orphan processes;
- avoid zombie processes;
- respect cancellation;
- clean up temporary resources.

Do not assume a process has started merely because a spawn call succeeded.


================================================================================
28. ERROR HANDLING
================================================================================

Errors should explain:

    what failed
    why it likely failed
    what Syntara did
    what the user can do next

Avoid:

    Error
    Failed
    Something went wrong

when a more useful message is possible.

Preserve underlying error information for logs while presenting concise messages
to end users.

Never swallow exceptions silently unless the behavior is intentionally optional
and documented.


================================================================================
29. LOGGING
================================================================================

Logs should help diagnose:

- runtime startup;
- model loading;
- backend selection;
- downloads;
- conversions;
- API requests;
- integration failures;
- crashes.

Do not log:

- API keys;
- passwords;
- authentication tokens;
- private prompts unless explicitly required for a secure debugging mode;
- sensitive local paths when unnecessary.

Use appropriate log levels.

Avoid logging the same error repeatedly in tight loops.


================================================================================
30. CONFIGURATION
================================================================================

Configuration should have clear precedence.

Prefer a structure such as:

    defaults
        ↓
    config file
        ↓
    environment variables
        ↓
    explicit CLI/API arguments

Follow the repository's existing conventions instead of inventing a competing
configuration hierarchy.

Document user-configurable options.


================================================================================
31. CROSS-PLATFORM SUPPORT
================================================================================

Syntara is intended to support major desktop operating systems.

Never assume:

- POSIX paths;
- `/tmp`;
- `/home`;
- Linux shell syntax;
- Unix-only permissions;
- a specific GPU;
- a specific package manager.

Use platform-aware path and process APIs.

Where platform-specific code is unavoidable, isolate it behind a clean interface.

Test or at minimum reason explicitly about:

- Windows;
- macOS;
- Linux.

Do not break one platform while fixing another without documenting the reason.


================================================================================
32. WINDOWS-SPECIFIC CARE
================================================================================

Windows is a major target.

Be careful with:

- `.exe` discovery;
- PowerShell vs cmd behavior;
- Windows path separators;
- long paths;
- process termination;
- file locking;
- GPU driver detection;
- Defender/SmartScreen interactions;
- installer behavior.

Never assume Bash exists on the user's machine.


================================================================================
33. MACOS-SPECIFIC CARE
================================================================================

Be careful with:

- Metal;
- application bundles;
- permissions;
- notarization/signing where applicable;
- Apple Silicon vs Intel;
- universal binaries;
- sandbox restrictions.

Do not assume x86_64 on macOS.


================================================================================
34. LINUX-SPECIFIC CARE
================================================================================

Be careful with:

- distribution differences;
- shared libraries;
- executable permissions;
- GPU driver installations;
- Wayland/X11 differences;
- system package availability.

Do not hard-code a single distribution's assumptions.


================================================================================
35. PERFORMANCE
================================================================================

Performance matters because Syntara is a local-AI platform.

Avoid:

- unnecessary model reloads;
- repeated metadata parsing;
- copying huge tensors/files;
- blocking the UI during downloads;
- synchronous network operations on UI threads;
- repeated hardware probing;
- unnecessary serialization of large payloads.

Prefer:

- streaming;
- caching;
- lazy initialization;
- background workers;
- bounded queues;
- incremental progress;
- resource cleanup.


================================================================================
36. UI / UX
================================================================================

Syntara should feel:

- modern;
- premium;
- fast;
- smooth;
- technically sophisticated;
- clean;
- confident;
- approachable.

Avoid generic dashboard templates.

The interface should prioritize:

    clarity
    speed
    hierarchy
    discoverability
    feedback

Important interaction rules:

- Every long operation needs visible progress.
- Every asynchronous operation needs a loading state.
- Errors need recovery paths.
- Destructive actions need appropriate confirmation.
- Disabled controls should explain why when useful.
- Avoid unnecessary modal dialogs.
- Avoid UI that blocks the whole application for a background operation.
- Preserve user context while navigation changes.


================================================================================
37. VISUAL DESIGN
================================================================================

Syntara's design language should support both dark and light themes.

Prefer a refined technical aesthetic rather than excessive decoration.

Use:

- strong typography;
- consistent spacing;
- restrained motion;
- meaningful depth;
- clear status indicators;
- carefully designed empty states;
- coherent iconography.

Do not introduce arbitrary colors or styles in one component that conflict with
the project's design system.

If a design system already exists, use it.


================================================================================
38. ACCESSIBILITY
================================================================================

UI work should consider:

- keyboard navigation;
- visible focus;
- sufficient contrast;
- readable text;
- semantic controls;
- screen-reader labels;
- reduced-motion preferences where applicable.

Do not make visual polish dependent on inaccessible interaction patterns.


================================================================================
39. ANIMATION
================================================================================

Animation should communicate state, not merely decorate.

Good uses:

- model loading;
- download progress;
- panel transitions;
- streaming output;
- connection state;
- success/failure feedback.

Avoid:

- excessive motion;
- constant background animation;
- animation that delays user actions;
- motion that makes dense technical interfaces harder to use.


================================================================================
40. CODE QUALITY
================================================================================

Write code that a competent developer can maintain six months later.

Prefer:

- small focused functions;
- explicit interfaces;
- meaningful names;
- predictable control flow;
- typed boundaries;
- modular components;
- clear ownership.

Avoid:

- giant functions;
- hidden global state;
- magic numbers;
- unexplained environment variables;
- duplicated business logic;
- clever abstractions without practical value.


================================================================================
41. TYPES
================================================================================

Use the project's existing type system consistently.

For TypeScript:

- avoid `any` unless justified;
- prefer discriminated unions for state machines;
- type API boundaries;
- validate untrusted external data at runtime.

For Python:

- use type hints for public APIs;
- define structured models where appropriate;
- avoid dynamically shaped dictionaries when a stable type is clearer.

For native code:

- respect ownership and lifetime rules;
- avoid undefined behavior;
- validate external input.


================================================================================
42. DEPENDENCIES
================================================================================

Before adding a dependency:

1. Check whether the repository already provides the functionality.
2. Check whether an existing dependency can do it.
3. Consider bundle size and startup cost.
4. Consider cross-platform compatibility.
5. Consider maintenance and license implications.
6. Add the smallest dependency that solves the real problem.

Do not add a package merely to avoid writing a few lines of straightforward code.

After adding a dependency, update the appropriate lockfile and verify the build.


================================================================================
43. API DESIGN
================================================================================

Public APIs should be:

- predictable;
- versionable;
- documented;
- backwards-conscious;
- explicit about errors.

Do not expose internal implementation details unnecessarily.

If changing a public API, search the repository for every caller before changing
the interface.


================================================================================
44. BACKWARD COMPATIBILITY
================================================================================

When modifying existing behavior, consider:

- existing config files;
- existing model directories;
- existing API clients;
- SDK users;
- scripts;
- integrations;
- saved state.

Prefer migration paths over abrupt breakage.

If a breaking change is unavoidable, document:

- what changed;
- why;
- how to migrate.


================================================================================
45. TESTING
================================================================================

Testing should match the risk.

For a small pure function:
    unit test.

For a runtime adapter:
    unit + integration/smoke test where practical.

For an API:
    request/response tests.

For model management:
    filesystem and failure-path tests.

For UI:
    component behavior and build validation.

For cross-platform functionality:
    isolate platform-specific behavior and test available targets.

Always test failure cases for code that handles:

- files;
- processes;
- network;
- downloads;
- model loading;
- hardware detection.


================================================================================
46. DO NOT FAKE VERIFICATION
================================================================================

Never claim:

- "tests pass";
- "build succeeds";
- "API works";
- "model loads";

unless you actually verified it or the available evidence establishes it.

If verification was not possible, say:

    "Implemented, but I could not run X because Y."

Do not invent command output.


================================================================================
47. SEARCHING THE REPOSITORY
================================================================================

Before implementing a feature, search for:

- existing function names;
- related components;
- API routes;
- configuration keys;
- environment variables;
- tests;
- documentation;
- TODOs;
- existing error messages.

Prefer repository search over guessing.

If multiple implementations exist, determine which one is active before editing.


================================================================================
48. EXTERNAL WEB RESEARCH
================================================================================

Use web research when information is likely to have changed or when the task
requires current documentation.

Examples:

- current library APIs;
- current model releases;
- current runtime support;
- current package versions;
- current operating-system behavior;
- current vendor documentation.

Do not search the web for stable programming fundamentals that can be answered
reliably from the repository and general knowledge.

When using external information, prefer primary sources such as:

- official documentation;
- official repositories;
- standards;
- release notes.

Never fabricate citations or documentation URLs.


================================================================================
49. UNKNOWN OR UNFAMILIAR TECHNOLOGY
================================================================================

If a library, model, runtime, file format, or tool is unfamiliar and the task
depends on knowing its current behavior, investigate it before implementing.

Do not infer an API from the name of a package.

Do not assume two similarly named runtimes are compatible.


================================================================================
50. GIT
================================================================================

Treat Git history and the working tree as valuable context.

Before risky changes, inspect:

- git status;
- relevant diff;
- recent commits when useful.

Never discard user changes simply to make the repository clean.

Do not run destructive Git commands such as broad resets or forced cleanups unless
the user explicitly asks for them and the consequences are clear.


================================================================================
51. DOCUMENTATION
================================================================================

Update documentation when changing:

- architecture;
- public APIs;
- installation;
- supported model formats;
- runtime requirements;
- environment variables;
- CLI commands;
- SDK usage;
- integrations;
- build instructions.

Documentation should describe actual behavior, not intended behavior that has
not been implemented.


================================================================================
52. ARCHITECTURE DOCUMENTS
================================================================================

If files such as:

    ARCHITECTURE.md
    IMPLEMENTATION_AUDIT.md
    GPU_BACKENDS.md
    CHANGELOG.md
    FINAL_10X_AUDIT.md

exist in the repository, treat them as important project context.

Before making architecture-level changes, inspect relevant documents.

If an architecture document conflicts with the implementation, investigate the
difference rather than silently assuming one is correct.


================================================================================
53. CHANGELOGS
================================================================================

Do not update changelogs for every tiny internal edit unless the repository
convention requires it.

Meaningful user-facing changes should be recorded according to the project's
existing changelog format.


================================================================================
54. COMMENTS
================================================================================

Write comments to explain:

- why;
- constraints;
- non-obvious tradeoffs;
- platform-specific behavior;
- compatibility requirements.

Do not write comments that merely restate the code.

Bad:

    // increment i
    i++;

Better:

    // Keep the runtime alive until the final stream chunk is consumed.
    // Some backends close the process as soon as the request object is released.


================================================================================
55. TEMPORARY CODE
================================================================================

Temporary debugging code must not remain in production paths.

Before finishing, search for:

- TODO added only for this task;
- console.log;
- print debugging;
- test credentials;
- temporary files;
- hard-coded local paths;
- commented-out abandoned implementations.


================================================================================
56. SECRETS
================================================================================

Never place secrets in:

- source code;
- AGENTS.md;
- documentation;
- test fixtures;
- logs;
- screenshots;
- commit messages.

Use environment variables or the project's existing secret-management approach.

If a secret is accidentally exposed, treat it as compromised and advise rotation.


================================================================================
57. ENVIRONMENT VARIABLES
================================================================================

Document required environment variables.

Do not silently introduce environment variables that are required for basic
local inference without documenting them.

Use safe defaults where possible.

Do not commit `.env` files containing secrets.


================================================================================
58. FILE OPERATIONS
================================================================================

Be conservative with large files and model binaries.

Do not read a multi-gigabyte model into memory just to inspect metadata.

Use:

- streaming;
- headers;
- metadata readers;
- bounded buffers;
- filesystem APIs.

When creating generated files, place them in the appropriate project location.


================================================================================
59. ARCHIVE EXTRACTION
================================================================================

Model and package archives are untrusted input.

Before extracting:

- validate archive entries;
- prevent path traversal;
- reject dangerous absolute paths;
- avoid overwriting unrelated files;
- ensure extraction remains within the intended directory.


================================================================================
60. SUBPROCESS EXECUTION
================================================================================

Subprocesses are a major security boundary.

Never do this with untrusted input:

    shell = "runtime " + userInput

Prefer structured arguments.

Validate:

- executable path;
- arguments;
- working directory;
- environment;
- timeout;
- exit status.

Capture stderr for diagnostics.

Clean up child processes on cancellation.


================================================================================
61. NETWORKING
================================================================================

Syntara may use the network for downloads, updates, documentation, and optional
integrations.

Network code should have:

- timeouts;
- cancellation;
- retries where appropriate;
- bounded retry counts;
- useful errors;
- TLS verification;
- response-size limits where relevant.

Do not retry indefinitely.

Do not send local prompts or model data to arbitrary endpoints.


================================================================================
62. MODEL DOWNLOAD SECURITY
================================================================================

Downloaded models should be treated as untrusted artifacts.

Where possible:

- verify source;
- verify checksum;
- verify expected format;
- validate archive structure;
- isolate conversion;
- avoid executing downloaded files.

A model file is data unless the runtime explicitly treats it otherwise.


================================================================================
63. RESOURCE CLEANUP
================================================================================

Always consider cleanup for:

- file handles;
- subprocesses;
- sockets;
- temporary directories;
- runtime sessions;
- GPU resources;
- worker threads;
- event listeners.

Prefer deterministic cleanup.

Ensure cancellation paths perform cleanup too.


================================================================================
64. CONCURRENCY
================================================================================

Local inference can involve expensive concurrent operations.

Avoid uncontrolled parallelism.

Use explicit limits for:

- simultaneous downloads;
- model loads;
- inference jobs;
- conversions;
- background scans.

Prevent two operations from corrupting the same model directory.

Use locks or atomic operations where necessary.


================================================================================
65. CACHING
================================================================================

Cache only data that is safe to cache.

Cache keys must include all relevant inputs.

Avoid stale model metadata causing incorrect runtime decisions.

When a cache is invalidated, make the invalidation rule explicit.


================================================================================
66. STATE MANAGEMENT
================================================================================

Separate:

- persistent state;
- runtime state;
- UI state;
- model metadata;
- transient inference state.

Do not use a UI component as the source of truth for core runtime state.

Core state should remain accessible to non-UI clients such as the SDK and API.


================================================================================
67. STREAMING
================================================================================

Streaming is important for local inference UX.

A stream should support, where appropriate:

- incremental text;
- cancellation;
- connection failure;
- runtime failure;
- completion;
- partial output handling.

Do not buffer the entire generation if the product promises streaming.


================================================================================
68. CANCELLATION
================================================================================

Long-running operations should be cancellable where practical:

- model download;
- model conversion;
- model loading;
- inference;
- runtime startup;
- background scans.

Cancellation must actually stop or release the underlying operation rather than
merely hiding the UI.


================================================================================
69. MODEL UNLOADING
================================================================================

When switching models, avoid keeping unnecessary models loaded.

A model manager should understand:

- active model;
- loaded models;
- memory pressure;
- unload behavior;
- runtime ownership.

Do not unload a model while an active request is using it.


================================================================================
70. MULTI-MODEL SUPPORT
================================================================================

Syntara may eventually manage multiple models simultaneously.

Do not assume:

    one application = one model.

Architecture should permit:

- multiple installed models;
- multiple runtimes;
- different model formats;
- different model configurations.

Resource constraints should be enforced explicitly.


================================================================================
71. IMPORTING EXISTING MODELS
================================================================================

Users may already have models on disk.

Import should avoid unnecessary copying when safe.

Where possible, support:

- path selection;
- metadata discovery;
- compatibility checks;
- duplicate detection;
- optional relocation.

Never delete an original model merely because it was imported.


================================================================================
72. MODEL REMOVAL
================================================================================

Model deletion is destructive.

The UI should clearly identify:

- model name;
- storage size;
- location;
- what will be deleted.

Do not delete unrelated cache or configuration data unless explicitly intended.


================================================================================
73. CLI
================================================================================

If a CLI exists or is added, it should expose automation-friendly behavior.

Good CLI characteristics:

- stable exit codes;
- machine-readable output where appropriate;
- useful `--help`;
- non-interactive mode;
- clear errors;
- configurable verbosity.

Do not make automation depend on parsing decorative human prose.


================================================================================
74. API SERVER LIFECYCLE
================================================================================

The local API server should have explicit lifecycle states:

    stopped
    starting
    ready
    degraded
    stopping
    failed

UI and clients should use actual health state rather than assuming readiness.


================================================================================
75. HEALTH CHECKS
================================================================================

A health endpoint should distinguish:

- process is alive;
- API is ready;
- runtime is available;
- model is loaded;
- inference is available.

Do not return "healthy" when the process is alive but the core runtime is broken,
unless that distinction is intentionally represented.


================================================================================
76. OBSERVABILITY
================================================================================

For difficult runtime bugs, useful observability may include:

- runtime selected;
- model selected;
- backend selected;
- startup duration;
- model load duration;
- generation duration;
- resource usage;
- exit codes.

Keep privacy in mind and avoid logging prompt content by default.


================================================================================
77. UPDATE SYSTEM
================================================================================

If Syntara includes an update mechanism:

- verify update source;
- verify downloaded artifacts;
- avoid silently replacing user data;
- support rollback where practical;
- explain what is being updated;
- preserve model files.

Application updates and model updates are separate concerns.


================================================================================
78. INSTALLERS AND PACKAGING
================================================================================

Installers should not assume network access during every step.

They should:

- install to predictable locations;
- preserve user data during updates;
- handle permissions;
- expose useful errors;
- support clean uninstall behavior.

Do not delete user model directories as a side effect of uninstall unless clearly
documented and explicitly selected.


================================================================================
79. DOCKER
================================================================================

Docker support is useful for reproducible development and optional services.

Do not assume Docker is required for normal local desktop inference.

A Docker change must not accidentally make the desktop application dependent on a
container runtime unless that is explicitly the product architecture.


================================================================================
80. CI/CD
================================================================================

CI should catch:

- formatting errors;
- type errors;
- compilation failures;
- test failures;
- packaging failures where configured.

Keep CI platform-aware.

Do not weaken tests merely to make CI green.


================================================================================
81. DEPENDENCY LOCKFILES
================================================================================

Respect existing lockfiles.

Do not regenerate an entire dependency tree for a small change unless necessary.

Unexpected lockfile churn should be investigated.


================================================================================
82. DATABASES AND PERSISTENCE
================================================================================

Syntara's core local functionality should not require a remote database.

For local persistence, choose storage according to the actual data:

- configuration;
- metadata;
- SQLite or equivalent structured storage;
- filesystem;
- embedded key-value storage.

Do not introduce a database for data that is naturally represented as files.


================================================================================
83. CLOUD SERVICES
================================================================================

Cloud services may support optional functionality.

When adding one, answer:

- Why is cloud required?
- Can the feature remain optional?
- What user data leaves the machine?
- Can the feature work offline?
- What happens when the cloud is unavailable?
- Does authentication become necessary?

The answer should be reflected in architecture and UX.


================================================================================
84. PRODUCT WEBSITE
================================================================================

The Syntara website should communicate the product clearly.

It should prominently explain:

- what Syntara is;
- local model execution;
- supported platforms;
- downloads;
- model/runtime capabilities;
- developer integrations;
- privacy/local-first architecture;
- documentation.

Do not claim support for a platform, model, or feature that the repository does
not actually implement.


================================================================================
85. DOWNLOAD EXPERIENCE
================================================================================

The public site should make downloads easy to discover.

Platform detection may be used as a convenience, but never hide the complete
platform list.

Download links should point to real release artifacts or the project's actual
distribution mechanism.

Do not fabricate release URLs.


================================================================================
86. SEO
================================================================================

For public web pages:

- use meaningful page titles;
- use semantic headings;
- use descriptive metadata;
- use canonical URLs where appropriate;
- provide crawlable content;
- avoid rendering important information only after client-side interaction.

Do not use misleading SEO claims.


================================================================================
87. WEBSITE PERFORMANCE
================================================================================

Keep the public site fast.

Avoid:

- unnecessary client-side JavaScript;
- huge assets;
- blocking third-party scripts;
- unnecessary animation;
- oversized images.

Optimize images and bundles where practical.


================================================================================
88. DESIGN CONSISTENCY
================================================================================

The desktop app and website can have different interaction models but should feel
like the same product family.

Shared elements may include:

- typography;
- logo treatment;
- visual language;
- spacing philosophy;
- status colors;
- icon style.

Do not force identical UI components into unrelated platforms.


================================================================================
89. DOCUMENTATION FOR DEVELOPERS
================================================================================

Developer documentation should make it easy to answer:

    How do I install Syntara?
    How do I add a model?
    How do I run inference?
    How do I expose the local API?
    How do I use the Python SDK?
    How do I connect n8n?
    How do I add a runtime backend?
    How do I add a model format?
    How do I build the desktop application?

Documentation examples should be runnable or clearly marked as pseudocode.


================================================================================
90. DOCUMENTATION FOR USERS
================================================================================

User documentation should avoid unnecessary internal terminology.

Explain:

- what a runtime is;
- what a model is;
- what quantization means;
- what RAM/VRAM affects;
- why a model may run slowly;
- how to choose a compatible model;
- how to remove a model;
- how to troubleshoot failures.

Do not overwhelm users with compiler-level details unless they are relevant.


================================================================================
91. RESPONSE STYLE TO THE USER
================================================================================

When reporting work:

Start with what was changed.

Then briefly state:

- important files changed;
- verification performed;
- anything that remains unverified;
- important caveats.

Do not produce an enormous narrative about obvious implementation details.

For code-review findings, prioritize actual bugs and architectural risks over style
preferences.

Be direct and technically honest.


================================================================================
92. NO FAKE CONFIDENCE
================================================================================

Never say:

    "This is definitely fixed."

unless verification supports that statement.

Prefer:

    "Implemented and verified with X."

or:

    "Implemented; I could not run X because Y."

Accuracy is more important than sounding confident.


================================================================================
93. HANDLING AMBIGUITY
================================================================================

When the requested outcome is clear but implementation details are ambiguous,
choose the approach that:

- fits existing architecture;
- minimizes breaking changes;
- preserves user control;
- is easiest to maintain;
- can be tested.

Ask only when the ambiguity materially changes the outcome.


================================================================================
94. REFACTORING
================================================================================

Refactor when it improves:

- correctness;
- maintainability;
- reuse;
- testability;
- performance;
- architecture.

Do not refactor merely for aesthetic reasons during an unrelated feature task.

Separate large refactors from feature work when practical.


================================================================================
95. MIGRATIONS
================================================================================

For migrations:

1. preserve old data where possible;
2. provide deterministic conversion;
3. validate migrated state;
4. avoid partial migrations;
5. provide rollback or backups where practical;
6. update documentation.

Never silently discard user data.


================================================================================
96. FEATURE FLAGS
================================================================================

Use feature flags only when they solve a real deployment or rollout problem.

Do not scatter feature-flag conditionals throughout core logic.

Centralize feature decisions where practical.


================================================================================
97. EXPERIMENTAL FEATURES
================================================================================

Experimental features should be isolated.

Clearly identify unstable APIs internally.

Do not let experimental code dictate the architecture of stable features unless
the design has been validated.


================================================================================
98. THIRD-PARTY INTEGRATIONS
================================================================================

Treat third-party integrations as optional boundaries.

An unavailable third-party service should not crash unrelated local functionality.

Handle:

- timeouts;
- rate limits;
- authentication failures;
- malformed responses;
- API changes.

Keep third-party-specific code out of the core runtime whenever possible.


================================================================================
99. MODEL PROVIDER TERMINOLOGY
================================================================================

Do not call Syntara a cloud AI provider unless a specific feature actually makes
it one.

Use precise terminology:

    local model
    runtime
    backend
    model format
    local API
    SDK
    integration

Do not imply that Syntara itself owns or hosts every model it can run.


================================================================================
100. AI-GENERATED CODE
================================================================================

Generated code must be reviewed like human-written code.

Never trust generated code merely because it compiles.

Check:

- security;
- resource usage;
- error handling;
- concurrency;
- cross-platform behavior;
- API correctness;
- maintainability.


================================================================================
101. SECURITY-SENSITIVE REQUESTS
================================================================================

Do not implement malware, credential theft, destructive payloads, unauthorized
access, or other clearly malicious functionality.

Legitimate security engineering is allowed when it improves Syntara's defense,
testing, isolation, or reliability.

When a security task is ambiguous, prioritize defensive implementation.


================================================================================
102. USER DATA SAFETY
================================================================================

Never destroy user data to simplify implementation.

For operations involving:

- model deletion;
- data migration;
- cache cleanup;
- configuration reset;
- uninstall;

make scope explicit.


================================================================================
103. PERFORMANCE REGRESSIONS
================================================================================

When changing core runtime behavior, consider:

- startup time;
- model load time;
- first-token latency;
- tokens/second;
- memory usage;
- disk usage;
- CPU usage;
- GPU usage.

Do not optimize one metric by silently damaging another.

Measure when practical.


================================================================================
104. LARGE MODEL FILES
================================================================================

Never include model binaries in source control unless the repository explicitly
requires a small test fixture.

Use tiny fixtures or mocked metadata for tests.

Do not accidentally commit:

- `.gguf`;
- `.safetensors`;
- checkpoints;
- cache directories;
- downloaded archives;
- generated runtime binaries.


================================================================================
105. TEST FIXTURES
================================================================================

Tests for model handling should use minimal fixtures.

A fixture should reproduce the behavior being tested without requiring a massive
real-world model unless the repository has a dedicated integration-test system.


================================================================================
106. BUILD OUTPUTS
================================================================================

Do not commit generated build directories unless the repository explicitly tracks
them.

Respect the existing `.gitignore`.


================================================================================
107. FILE NAMING
================================================================================

Use the project's existing naming conventions.

Do not introduce random naming styles across modules.

Prefer names that communicate responsibility.


================================================================================
108. CODE OWNERSHIP
================================================================================

Each subsystem should have a clear owner.

Examples:

    Model Manager → model lifecycle
    Runtime Adapter → runtime-specific execution
    API Layer → protocol/interface
    SDK → developer ergonomics
    Desktop → presentation and desktop interaction
    Integrations → external automation
    Site → public web experience

Avoid placing logic in the wrong layer merely because it is convenient.


================================================================================
109. DEPENDENCY DIRECTION
================================================================================

Prefer:

    UI → application/service layer → core → runtime adapter

and:

    SDK/API → application/service layer → core → runtime adapter

Avoid:

    runtime → UI
    core → website
    core → specific integration

The core should remain reusable.


================================================================================
110. AVOID CIRCULAR ARCHITECTURE
================================================================================

If adding an import creates a circular dependency, do not immediately patch around
it with lazy imports or global state.

First determine whether the responsibility belongs in another layer.


================================================================================
111. STATE MACHINES
================================================================================

For complicated lifecycle states such as model loading or server startup, use an
explicit state machine rather than many loosely related booleans.

Example:

    idle
    downloading
    validating
    loading
    ready
    generating
    stopping
    error


================================================================================
112. USER FEEDBACK
================================================================================

Every operation that may take noticeable time should communicate:

    pending → progress → success/failure

For model downloads and conversions, progress should be meaningful.

For inference, streaming output is preferred when supported.


================================================================================
113. ACCESSIBLE ERROR RECOVERY
================================================================================

An error message should, when possible, tell the user what action can recover it.

Example:

    "CUDA backend unavailable. Syntara switched to CPU because no compatible
    CUDA runtime was detected."

is more useful than:

    "Backend error."


================================================================================
114. FEATURE COMPLETENESS
================================================================================

When implementing a feature, do not stop at the central function if the feature
also needs:

- UI;
- API;
- configuration;
- error handling;
- tests;
- documentation;
- integration wiring.

However, do not implement unrelated speculative functionality.


================================================================================
115. "DONE" CHECKLIST
================================================================================

Before declaring a non-trivial task complete, verify:

[ ] Requirement understood.
[ ] Existing implementation inspected.
[ ] Correct architectural layer selected.
[ ] Code implemented.
[ ] Errors handled.
[ ] Security implications considered.
[ ] Cross-platform implications considered.
[ ] Relevant tests/checks run.
[ ] Build/type/lint status known.
[ ] No accidental unrelated changes.
[ ] Documentation updated if needed.
[ ] Temporary debugging code removed.
[ ] Final behavior honestly reported.


================================================================================
116. PRIORITY ORDER WHEN INSTRUCTIONS CONFLICT
================================================================================

Use this priority order:

1. Safety and security.
2. Explicit user requirements.
3. Existing Syntara architecture and repository contracts.
4. Correctness and data integrity.
5. Local-first/privacy-first product principles.
6. Cross-platform compatibility.
7. Maintainability.
8. Performance.
9. UX polish.
10. Convenience.

If an instruction conflicts with repository reality, inspect the repository and
choose the approach that preserves actual correctness.


================================================================================
117. DO NOT INVENT IMPLEMENTATION STATUS
================================================================================

If a feature is only planned, call it planned.

If it is partially implemented, call it partial.

If it is implemented but untested, say so.

If a document describes a feature that is absent from the code, do not claim the
feature exists merely because the document says it should.


================================================================================
118. DO NOT SILENTLY CHANGE PRODUCT DIRECTION
================================================================================

The agent may improve implementation quality, but should not silently change
Syntara's fundamental product direction.

Do not turn:

    local-first → cloud-first
    no-account core → mandatory accounts
    user-controlled models → hosted proprietary models
    universal runtime → one-runtime lock-in

without an explicit product decision.


================================================================================
119. FINAL ENGINEERING STANDARD
================================================================================

Syntara should be built as a serious local-AI platform, not merely as a demo.

Every subsystem should aim for:

    correct
    modular
    observable
    secure
    cross-platform
    performant
    testable
    understandable

The user should be able to download Syntara, obtain a compatible local model,
run it on their own hardware, and use that model through Syntara's applications
and developer integrations without being forced into unnecessary cloud
dependencies.

When there is a choice between a flashy shortcut and a clean architecture,
choose the clean architecture.

When there is a choice between guessing and inspecting the repository, inspect.

When there is a choice between claiming success and verifying it, verify.

When there is a choice between hiding complexity and giving the user clear
control, expose the right amount of useful control.

Build Syntara as the universal local-AI layer it is intended to become.