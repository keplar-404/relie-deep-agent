# Relie AI — Autonomous AI Web Engineering Platform

Relie AI is a production-grade autonomous agentic engineering platform that builds, customizes, and iterates on modern full-stack web applications and websites through natural language. Operating inside isolated Daytona Debian containers running Bun and Vite, the agent executes filesystem operations, interprets code in sandboxed QuickJS, extracts visual assets using AI vision, uploads to Neon S3 Object Storage, and preserves persistent multi-day graph state via Neon Serverless Postgres and LangGraph checkpointers.

---

![Relie AI Architecture](/public/relie-architecture.jpg)

---

## High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client["Next.js 16 Web IDE (Client)"]
        UI["Chat Interface & IDE Shell"]
        Preview["Signed Sandbox Preview (Port 3000)"]
    end

    subgraph IngestionPipeline["Media & Document Ingestion Engine"]
        Uploads["User Uploads\n(PDF, Image, SVG, URL)"]
        FileProc["fileProcessor (MuPDF C/WASM + Sharp)\n- AsyncGenerator Streaming\n- Zero Disk I/O & O(1) Memory\n- 50-Page Safe Ceiling"]
    end

    subgraph AuthLayer["Authentication & Ingestion"]
        Clerk["Clerk Edge Middleware (proxy.ts)"]
        Resolver["User Mirror Resolver (currentUser.ts)"]
        API["POST /api/v1/agent Route Handler"]
    end

    subgraph StorageLayer["Neon Backend (Database & Storage)"]
        Postgres["Neon Serverless Postgres\n- users\n- projects\n- chat_history\n- llm_executions"]
        Saver["LangGraph PostgresSaver\n- checkpoints\n- checkpoint_blobs\n- checkpoint_writes"]
        S3["Neon S3 Object Storage\n(project-assets bucket)"]
    end

    subgraph DecisionLayer["Decision & Intent Routing (TypeSafe Jev)"]
        Router["TypeSafe Jev Router (src/lib/agent/agentRouter)\n1. modelSelection (<40ms System One)\n- Task: write_code | review_code | normal_chat\n- 100% Vision Models (Gemini Flash, GPT-4o Mini, Claude 3.7)\n2. toolSelection (<40ms System One)\n- Evaluates 17 Agent Tools (fsOperations, assets, screenshot)\n- Multi-Tool Returns (score >= 1.2)\n3. skillSelection (<40ms System One)\n- Evaluates 7 Curated Parent Skills\n- Dynamic Skill Context Injection (score >= 1.2)\n4. workflowSelection (<40ms System One)\n- Dispatches to 'ship' (visual QA loop) or 'normal' (single-pass)"]
    end

    subgraph AgentCore["Deep Agent Pipeline (deepagents v1.14)"]
        LLM["Dynamic OpenRouter Vision LLM\n- Light: Gemini 2.0 Flash\n- Standard: GPT-4o Mini\n- Flagship: Claude 3.7 Sonnet"]
        MW1["1. QuickJS Interpreter"]
        MW2["2. Call Limit Guardrail (20 Max)"]
        MW3["3. Context Editor (40k Truncate)"]
        MW4["4. Task Planner (TodoList)"]
        MW5["5. Compaction Summarizer (80k Compress)"]
    end

    subgraph ToolEcosystem["Tool Registry (17 Structured Tools)"]
        FSTools["15 Daytona FS Tools\n(read, write, insert, delete, search, move, glob)"]
        VisionTool["extract_website_assets\n(Gemini 3.6 Flash + Sharp In-Memory Crop)"]
        ScreenshotTool["sandboxcodeprescreenshottool\n(Playwright Headless + 4 Viewports + S3)"]
    end

    subgraph Sandbox["Daytona Cloud Sandbox"]
        Debian["Debian Linux (oven/bun:1-debian)"]
        ViteDev["Vite Dev Server (Port 3000)"]
        AppFiles["/home/daytona/app Web Application Code"]
    end

    UI -->|HTTP POST /api/v1/agent| Clerk
    UI --> Uploads
    Uploads --> FileProc
    FileProc --> API
    Clerk --> Resolver
    Resolver --> Postgres
    Resolver --> API
    API --> Postgres
    API --> DecisionLayer
    DecisionLayer --> AgentCore
    AgentCore <--> Saver
    AgentCore --> ToolEcosystem
    FSTools --> AppFiles
    VisionTool -->|1. Locate Coordinates| LLM
    VisionTool -->|2. In-Memory Slice| S3
    S3 -->|3. Public URL Return| AgentCore
    AppFiles --> ViteDev
    ViteDev -.->|Live Signed HMR URL| Preview
```

---

## Key Project Features & Capabilities

Relie AI delivers an autonomous full-stack software engineering platform. Below is the comprehensive, in-depth breakdown of every platform feature:

### 1. 100% Vision Dynamic Model Routing (TypeSafe Jev)
* **Sub-40ms System One Classification:** Evaluates user prompt intent prior to invoking heavyweight reasoning models with zero output token generation latency.
* **Dual-Head Calibrated Probing:**
  * **Task Intent (`task_type` via `choice`):** Evaluates whether the request is `"write_code"` (generating or modifying files), `"review_code"` (auditing, explaining, or quality-checking code), or `"normal_chat"` (conceptual discussions, greetings).
  * **Complexity Scoring (`complexity` via `score`):** Calibrates prompt complexity on a continuous 0 to 3 scale (`0 = Trivial conversational`, `1 = Minor syntax/snippet edit`, `2 = Standard component/form/hook`, `3 = Multi-file architecture/full refactor`).
* **100% Vision-Capable Multi-Tier Model Selection:**
  * **Lightweight Tier (`openrouter:google/gemini-2.0-flash-001`):** Serves instant conversational answers and trivial one-line tweaks with sub-second response times and multimodal vision.
  * **Standard Coding Workhorse (`openrouter:openai/gpt-4o-mini`):** Primary engine for component development, form wiring, state integration, and code/design reviews with high-accuracy vision and tool calling.
  * **Flagship Architecture Tier (`openrouter:anthropic/claude-3.7-sonnet`):** Reserved for complex multi-file architectural refactors, schema overhauls, and full-stack integrations with pixel-perfect multimodal reasoning.

### 2. Autonomous Multi-Tool Selection Router (TypeSafe Jev System One)
* **Pure Functional Design (`agentToolSelection`):** Ingests prompt text and optional attached file links, evaluating which tools the agent needs before starting execution.
* **Direct Tool Suite Ingestion:** Dynamically evaluates all 15 active tools imported from `fsOperations` (14 tools) and `assetExtraction` (1 tool), using their real names and descriptions.
* **Calibrated 3-Level Evaluation:** Scores each tool on a continuous 0 to 2 scale (`0 = Not needed`, `1 = Useful`, `2 = Essential`).
* **Calibrated `>= 1.2` Multi-Tool Threshold:** Filters tools scoring $\ge 1.2$, accurately capturing both core essential actions (e.g. `upload_file`, `extract_website_assets`) and supporting steps (e.g. `read_files_text`, `search_files`) while eliminating irrelevant tools (`0.0 - 0.2`).
* **Multi-Tool Return:** Returns an array of selected tool names sorted by relevance score in descending order, returning `[]` for pure conversational chat.

### 3. Autonomous ReAct Agent Loop & 5-Layer Defensive Guardrails
* **ReAct Agent Reasoning (`deepagents` v1.14):** Autonomous reasoning-action loop powered by LangChain and LangGraph state machines.
* **Layer 1 — QuickJS Sandboxed Interpreter:** In-memory QuickJS sandbox executing pure JavaScript calculations, geometry, and layout logic without touching the container disk.
* **Layer 2 — Model Call Guardrail (20 Max Turns):** Hard cap of 20 model calls per prompt execution to prevent runaway compiler retry loops and token exhaustion.
* **Layer 3 — Context Pruning at 40k Tokens:** Monitors prompt token consumption; once exceeding 40,000 tokens, it replaces older filesystem read outputs with `[cleared]` while keeping the 3 most recent file reads intact.
* **Layer 4 — Automated Todo Checklist Planner:** Automatically generates multi-step structured implementation plans (`Navbar -> Hero -> Feature Grid -> State Hook -> Build`) to prevent scope drifting on large tasks.
* **Layer 5 — In-Model 80k Compaction Summarizer:** Automatically summarizes older conversation turns at 80,000 tokens using MiniMax, preserving the 20 most recent messages for continuous context.

### 4. Isolated Cloud Sandboxes & Live HMR Preview (Daytona SDK)
* **Dedicated Cloud Containers:** Provisions isolated Debian Linux containers (`oven/bun:1-debian`) for safe, unconstrained code execution.
* **Pre-Warmed Web Application Templates:** Automatically deploys `template-react-project` running Bun and Vite development server on port 3000.
* **Cryptographically Signed Live Previews:** Emits signed 1-hour public preview URLs (`sb.getSignedPreviewUrl(3000, 3600)`) embedded directly into the Next.js client iframe with live Hot Module Replacement (HMR).
* **Auto-Stop Idle Conservation:** Suspends sandbox containers automatically after 20 minutes of inactivity (`autoStopInterval: 20`) to conserve compute resources.

### 5. Comprehensive 15-Tool Filesystem & Code Manipulation Suite
* **Directory Management:**
  * `list_fs`: Traverses and renders workspace file and folder trees.
  * `create_folder`: Recursively provisions new directories.
* **Atomic File Synthesis & Persistence:**
  * `upload_file`: Writes or overwrites single code files.
  * `upload_files`: Batch writes multiple source files in an atomic operation.
  * `insert_text_at_line`: Inserts code lines, imports, components, or newline gaps at an exact 1-indexed line position without rewriting the entire file.
  * `delete_file`: Recursively deletes files or directories.
  * `move_files`: Atomically renames or relocates files and folders.
* **Inspection & Code Retrieval:**
  * `get_file_details`: Inspects file size, timestamps, and metadata.
  * `read_file_text`: Reads UTF-8 file contents into memory.
  * `read_files_text`: Concurrently reads multiple files in a single turn.
  * `download_file_stream`: Streams binary assets directly from the sandbox.
* **Semantic Code Search & Refactoring:**
  * `search_files`: In-workspace Grep text pattern and regex search with line-by-line citations.
  * `find_files`: Locates files matching glob expressions (e.g. `**/*.tsx`).
  * `replace_in_files`: Batch pattern replacement across multiple files simultaneously.
* **Container Security & Permissions:**
  * `set_file_permissions`: Updates Unix file permissions (chmod) within the sandbox.

### 6. AI Vision Asset Extraction & In-Memory Graphic Slicing
* **Autonomous Visual Discovery:** Detects and extracts graphical elements (logos, hero mockups, badges, illustrations) from mockup URLs and screenshots.
* **Normalized 2D Bounding Box Prediction:** Leverages OpenRouter Gemini 3.6 Flash structured output with normalized coordinate detection (0–1000 scale) for up to 25 assets per batch.
* **C-Level In-Memory Slicing (`sharp`):** Normalizes EXIF orientation and slices pixel rectangles directly in RAM using `libvips` without writing intermediate files to disk.
* **Zero-Base64 Context Hygiene:** Directly uploads cropped PNG buffers to Neon S3 (`project-assets` bucket), returning clean public CDN URLs and saving 100k+ tokens per prompt.

### 7. Full-Page Responsive Screenshot Verification (Playwright & Object Storage)
* **Automated Multi-Device Viewport Slicing:** Uses headless Playwright inside the Daytona sandbox to capture pixel-perfect full-page screenshots across 4 standard viewports:
  * `desktop`: 1920 × 1080
  * `laptop`: 1440 × 900
  * `tablet`: 820 × 1180
  * `mobile`: 390 × 844
* **Network & Font Idle Synchronization:** Awaits `networkidle`, `document.fonts.ready`, and full DOM load before capturing to eliminate blank or half-rendered images.
* **Direct Object Storage Persistence:** Automatically streams captured PNG buffers to Neon S3 (`project-assets` bucket) and returns public CDN URLs for visual inspection.
* **Visual Bug & Regression Detection:** Enables the agent to inspect rendered layout overflow, broken CSS flex/grid structures, overlapping text, and responsiveness bugs across all device sizes.

### 8. Streaming Document & Media Ingestion Engine (MuPDF & Sharp)
* **Polymorphic File Input Handling:** Transparently ingests diverse file inputs (`Buffer`, `Uint8Array`, `Blob`, `File`, remote URLs, data URIs) into normalized memory buffers.
* **Zero-Latency Pass-Through:** Immediately passes PNG, JPEG, WebP, GIF, and SVG files through without re-encoding or image degradation.
* **Embedded Artifex MuPDF C/WASM Engine:** Embedded `mupdf` (v1.28.1) rasterizes multi-page PDF documents in-memory with sub-millisecond trailer parsing without pre-indexing.
* **AsyncGenerator Memory Isolation:** Streams rendered page buffers one-by-one (`yield page`) with $O(1)$ memory consumption, eliminating Out-Of-Memory crashes on 200+ page documents.
* **Defensive Page Ceiling:** Automatically limits document parsing to a safe 50-page maximum.

### 9. Transactional State & LangGraph Checkpointing (Neon Serverless Postgres)
* **Thread-Isolated Agent Checkpointing:** Persists execution graph state using `@langchain/langgraph-checkpoint-postgres` keyed by `projectId`, enabling multi-day workflow resumption across disconnects or restarts.
* **Strict Relational Schema (Drizzle ORM):**
  * `users`: Mirrors Clerk user identities with unique indexed IDs.
  * `projects`: Scopes workspaces, container IDs, and sandbox metadata with cascading deletes.
  * `chat_history`: Stores multi-modal conversation logs with typed JSONB attachment payloads.
  * `llm_executions`: Stores sequenced execution traces (`reasoning`, `tool_call`, `tool_done`) linked directly to assistant turns.
* **Serverless Connection Pooling:** Fully managed serverless PostgreSQL pool with instant branch-scoped scaling.

### 10. Real-Time Streaming SSE Agent API & Atomic Trace Auditing
* **Real-Time Natural Arrival Streaming:** Next.js 16 App Router streaming endpoint (`POST /api/v1/agent`) streaming `AIMessageChunk` reasoning tokens and `ToolMessage` events as they occur.
* **Crash-Resilient Persistence:** Sequentially buffers reasoning and tool call lifecycle events in-memory, committing full execution traces atomically to Neon Postgres on stream completion.
* **Compaction Noise Suppression:** Automatically intercepts and filters internal LangGraph summarization events (`metadata.lcSource === "summarization"`), ensuring clean client-facing streams.

### 11. Zero-Trust Edge Authentication & Lazy Identity Synchronization
* **Edge Middleware Protection:** Clerk Edge middleware (`src/proxy.ts`) authenticates all API and application routes before requests hit server runtimes.
* **On-Demand Lazy User Mirroring:** Resolves Clerk user IDs into internal relational Postgres records (`src/lib/auth/currentUser.ts`), fetching profile details from Clerk REST API only when absent.

### 11. Progressive AI Skills Framework
* **On-Demand Skill Disclosure:** Exposes skill names and summaries to the agent prompt initially, loading comprehensive guides and reference files only when triggered by relevant tasks.
* **`ponytail` / `codeoptimizer` Skill:** Enforces minimalist software engineering — standard library first, native HTML5/CSS primitives over extra packages, and zero unrequested bloat.
* **`design-motion-principles` Skill:** Curated motion design standards from Emil Kowalski, Jakub Krehel, and Jhey Tompkins, enforcing 180ms duration budgets, Frequency Gate, and accessibility rules.
* **`typesafe-ai` Skill:** Provides System One classification, confidence-gated escalation, and surgical code injection primitives.

### 12. Direct S3 Object Storage Upload Pipeline
* **Neon S3 Object Storage (`@aws-sdk/client-s3`):** High-speed path-style S3 bucket uploads branch-scoped with the database.
* **Dedicated Upload Route (`POST /api/v1/upload`):** Accepts multi-part form data uploads for project assets, documents, and reference imagery, returning public CDN URLs.

---

## Core Technology Stack

| Layer | Technology | Version | Architectural Responsibility |
|---|---|---|---|
| **App Framework** | Next.js (App Router) | `16.3.5` | React Server Components, client IDE shell, API routing |
| **UI Runtime** | React | `19.2.8` | Concurrent client-side state, streaming UI rendering |
| **Agent Framework** | `deepagents` + `@langchain/core` | `1.14.0` / `1.2.12` | ReAct reasoning loop, memory backend, tool execution |
| **Decision, Tool, Skill & Workflow Router** | TypeSafe Jev (`@typesafe-ai/sdk`) | `0.6.0` | Sub-50ms System One vision model routing (`modelSelection`), autonomous multi-tool selection (`toolSelection`), skill routing (`skillSelection`), & workflow routing (`workflowSelection`) |
| **Primary LLMs** | OpenRouter (`gpt-4o-mini`, `claude-3.7-sonnet`, `gemini-2.0-flash-001`) | — | 100% native vision tiering: standard code synthesis, complex architecture, and light chat |
| **Vision Detector** | OpenRouter (`google/gemini-3.6-flash`) | — | Sub-second 2D normalized object bounding-box detection |
| **PDF & Doc Engine** | MuPDF (`mupdf`) | `1.28.1` | Ultra-fast C/WASM PDF rasterization & streaming page splitting (zero disk I/O) |
| **Object Storage** | Neon Object Storage (`@aws-sdk/client-s3`) | `3.1139.0` | Copy-on-write S3 bucket (`forcePathStyle: true`) branching with DB |
| **Image Processing** | `sharp` | `0.35.4` | C-level `libvips` in-memory EXIF auto-rotation and rectangular cropping |
| **Database** | Neon Serverless Postgres | `1.1.0` | Serverless SQL connection pool and transactional state |
| **ORM** | Drizzle ORM | `1.0.0-rc.4` | Strictly typed relational schemas, foreign keys, migrations |
| **Checkpointer** | `@langchain/langgraph-checkpoint-postgres` | `1.0.5` | Thread-isolated graph resumption (`thread_id: projectId`) |
| **Code Sandbox** | Daytona SDK | `0.214.0` | Ephemeral Debian containers running Bun + React template |
| **Auth** | Clerk | `7.9.4` | Session verification, lazy mirroring into internal Neon schema |
| **Client State** | Zustand | `5.0.15` | Reactive sandbox identifiers and IDE panel coordination |
| **Type Validation** | Zod | `4.6.5` | Runtime schema validation across API bodies, DB models, and tools |

---

## Detailed Feature Matrix: Where, When, Why & How

### 1. Authentication & Lazy Identity Synchronization
- **Where:** `src/lib/auth/currentUser.ts` and `src/proxy.ts`.
- **When:** Invoked at the boundary of every authenticated request (`POST /api/v1/agent`, dashboard routing, project loading).
- **Why:** Decouples Clerk's external authentication system from the application's internal relational integrity. Neon Postgres requires internal UUIDs to enforce relational foreign keys across `projects`, `chat_history`, and `llm_executions`.
- **How:**
  1. `proxy.ts` verifies the session token at the Edge.
  2. `currentUser()` extracts `userId` (`clerkId`).
  3. Queries internal `users` table via `drizzle-orm` where `users.clerkId == clerkId`.
  4. If user does not exist, it lazily queries Clerk's REST API for user profile metadata, executes an `INSERT INTO users`, and returns the internal user record.
  5. Subsequent invocations resolve in a single index-accelerated `SELECT` query.

---

### 2. Intelligent Dynamic Model Routing (TypeSafe Jev System One)
- **Where:** `src/lib/agent/agentRouter/modelSelection.ts` and `src/lib/agent/agentRouter/index.ts`.
- **When:** Evaluated on every incoming user prompt before invoking the deep agent reasoning loop.
- **Why:** Full-stack autonomous engineering requests range from conversational greetings and conceptual questions to high-volume UI component generation and complex multi-file architectural refactors. Routing every prompt to an expensive flagship model incurs unnecessary latency ($2{-}5\text{s}$) and costs, while routing complex builds to lightweight models degrades code quality. TypeSafe Jev evaluates requests in $<40\text{ms}$ with zero output token overhead using calibrated probability heads, mapping prompts directly to the optimal OpenRouter model tier.
- **How:**
  1. **Dual System One Evaluation:** Evaluates the prompt in a single pass using Jev's `choice` and `score` primitives:
     - `task_type` (`choice`): Categorizes intent into `"write_code"`, `"review_code"`, or `"normal_chat"`.
     - `complexity` (`score`): Evaluates difficulty on a calibrated 0 to 3 scale (0 = trivial greeting/question, 1 = minor one-liner/syntax fix, 2 = standard component/feature/review, 3 = multi-file architecture/refactoring).
  2. **Multi-Tier Routing Matrix (100% Vision-Capable):**
     - **Normal Chat:** Defaults to `openrouter:google/gemini-2.0-flash-001` for instantaneous conversational answers; escalates to `openrouter:anthropic/claude-3.7-sonnet` if complexity $\ge 2.5$.
     - **Code Writing & Code Review:**
       - **Lightweight (`< 0.8`):** `openrouter:google/gemini-2.0-flash-001` (simple snippets, basic syntax edits, sub-second responses).
       - **Standard Workhorse (`0.8` to `< 2.0`):** `openrouter:openai/gpt-4o-mini` (primary engine for building UI components, forms, hooks, layout, and visual code/design reviews with high-accuracy tool calling).
       - **Flagship (`>= 2.0`):** `openrouter:anthropic/claude-3.7-sonnet` (complex multi-file architectures, deep refactors, and full-stack integrations with pixel-perfect multimodal reasoning).
  3. **Zero Output Token Latency:** Unlike generative LLM classification which outputs Markdown/JSON and requires parsing, TypeSafe Jev returns typed judgment objects directly from model probability logits in $<40\text{ms}$.

```mermaid
flowchart TD
    Prompt["User Prompt Ingested"] --> Jev["TypeSafe Jev System One (<40ms)\n(src/lib/agent/agentRouter/modelSelection.ts)"]
    Jev --> TaskChoice{"task_type (choice)"}
    Jev --> CompScore{"complexity (score: 0-3)"}
    
    TaskChoice -->|normal_chat| ChatBranch{"complexity >= 2.5?"}
    ChatBranch -- Yes --> Claude["Flagship: Claude 3.7 Sonnet"]
    ChatBranch -- No --> Gemini["Light: Gemini 2.0 Flash"]

    TaskChoice -->|write_code / review_code| CodeBranch{"complexity score"}
    CodeBranch -- "score < 0.8" --> Gemini
    CodeBranch -- "0.8 <= score < 2.0" --> GPT["Standard Workhorse: GPT-4o Mini\n(Components, Forms, Reviews)"]
    CodeBranch -- "score >= 2.0" --> Claude
```

```typescript
import { routeModel, modelSelection } from "@/lib/agent/agentRouter";

const model = await routeModel(userPrompt);
// e.g. "Create a responsive pricing table in Tailwind"
// => "openrouter:openai/gpt-4o-mini"
```

---

### 3. Autonomous Multi-Tool Selection Router (TypeSafe Jev System One)
- **Where:** `src/lib/agent/agentRouter/toolSelection.ts` and `src/lib/agent/agentRouter/index.ts`.
- **When:** Evaluated on every incoming prompt (and optional attached file links) prior to initializing or configuring the agent's active tool execution list.
- **Why:** Full-stack autonomous agents have 17 specialized tools across filesystem operations, visual asset extraction, and responsive browser screenshots. Providing all tools unconditionally to every prompt increases prompt token overhead, distracts the model, increases latency, and increases hallucinations. `toolSelection` dynamically evaluates which tools are genuinely needed in $<50\text{ms}$ using TypeSafe Jev `score()` on a continuous 0-2 scale (`0 = Not needed`, `1 = Useful`, `2 = Essential`).
- **How:**
  1. **Pure Functional Ingestion:** Accepts user prompt text and optional attached `fileUrls` array:
     ```typescript
     routeTools(text: string, fileUrls?: string[]): Promise<string[]>
     // alias: toolSelection
     ```
  2. **Active Tool Suite Ingestion:** Dynamically evaluates all 17 active tools imported from `fsOperations` (15 tools including line-targeted `insertTextAtLineTool`), `assetExtraction` (1 tool), and `sandboxcodeprescreenshottool` (1 tool), using their actual names and descriptions.
  3. **Calibrated 3-Level Evaluation:** Scores each tool against the calibrated 0 to 2 rubric:
     - `0`: Not needed for this request
     - `1`: Useful supporting tool for this request
     - `2`: Essential primary tool for this request
  4. **Calibrated `>= 1.2` Multi-Tool Threshold:** Filters tools scoring $\ge 1.2$. This calibrated threshold reliably includes both Essential (`>= 1.6`) and Useful (`1.2 - 1.59`) tools, while eliminating irrelevant tools (`0.0 - 0.2`).
  5. **Sorted Multi-Tool Return:** Returns an array of selected tool names sorted by relevance score descending (`Promise<string[]>`), or `[]` if the prompt is purely conversational.

```mermaid
flowchart TD
    Prompt["User Prompt + Optional File URLs"] --> Jev["TypeSafe Jev score() (<50ms)\n(src/lib/agent/agentRouter/toolSelection.ts)"]
    Jev --> ToolEval["Evaluate 17 Real Tools in Parallel\n(15 fsOperations + 1 assetExtraction + 1 screenshotTool)"]
    ToolEval --> Scoring["Rubric (0-2 Scale):\n0 = Not needed\n1 = Useful\n2 = Essential"]
    Scoring --> Cutoff{"score >= 1.2 ?"}
    Cutoff -- Yes --> Keep["Selected Tools (Sorted by Relevance)"]
    Cutoff -- No --> Discard["Omitted Tools"]
    Keep --> AgentInit["Agent Configured with Targeted Tool Subset\n(Zero Token Waste / Focused Reasoning)"]
```

```typescript
import { routeTools, toolSelection } from "@/lib/agent/agentRouter";

// Scenario 1: Feature creation prompt
const tools = await toolSelection("from this project create user table feature with pricing");
// => ["upload_file", "upload_files", "read_files_text", "search_files", "get_file_details", ...]

// Scenario 2: Visual design asset extraction prompt
const visualTools = await toolSelection(
  "From this document get the context of the design and update my website structure but make sure review it first",
  ["https://cdn.example.com/mockup.png"]
);
// => ["extract_website_assets", "upload_file", "read_files_text", "search_files", ...]

// Scenario 3: Responsive preview audit prompt
const auditTools = await toolSelection("Audit the live site across mobile and desktop for layout overflow");
// => ["sandboxcodeprescreenshottool", "read_files_text", ...]

// Scenario 4: Conversational prompt
const chatTools = await toolSelection("How can I create or update a button in this project?");
// => [] (Pure conversational guidance, no filesystem tools needed)
```

---

### 3b. Autonomous Skill Selection Router (TypeSafe Jev System One)
- **Where:** `src/lib/agent/agentRouter/skillSelection.ts` and `src/lib/agent/agentRouter/index.ts`.
- **When:** Evaluated alongside tool selection on incoming user prompts to determine which specialized parent design, craft, or engineering skill guidelines should be dynamically injected into the agent context.
- **Why:** Relie features 7 curated parent skills covering frontend design taste, UI craft, minimal engineering, code review, and communication. Unconditionally injecting all skills into every prompt burns tens of thousands of tokens and causes guideline collision. `skillSelection` evaluates prompt requirements in $<40\text{ms}$ and injects only the relevant domain skill guidelines.
- **How:**
  1. **Evaluates 7 Parent Engineering Skills:**
     - `frontend-design-taste`: Modern aesthetics, anti-slop principles, responsive rhythm.
     - `ui-craft-impeccable`: Micro-interactions, visual hierarchy, polished design systems.
     - `frontend-code-craft`: Surgical TypeScript architecture, clean component separation.
     - `ponytail-engineering`: Minimalist, lazy, standard-library-first engineering.
     - `frontend-quality-review`: Security audit, diff review, bug diagnosis.
     - `agent-communication`: Clear intent, requirement planning, concise responses.
     - `architectural-principles`: 23 core engineering principles and domain modeling.
  2. **Calibrated `>= 1.2` Selection Threshold:** Selects and sorts skills matching the request intent in descending order of relevance.

```typescript
import { routeSkills, skillSelection } from "@/lib/agent/agentRouter";

// Design prompt
const skills = await skillSelection("Redesign the hero section with modern glassmorphism and subtle animations");
// => ["frontend-design-taste", "ui-craft-impeccable"]

// Refactoring prompt
const refactorSkills = await skillSelection("Simplify this messy form component and strip out unused dependencies");
// => ["ponytail-engineering", "frontend-code-craft"]
```

---

### 3c. Autonomous Agent Workflow Pipelines (Ship & Normal Workflows)
- **Where:** `src/lib/agent/agentWorkflow/` (`normalWorkflow.ts`, `shipWorkflow.ts`, `index.ts`).
- **When:** Invoked to execute agent tasks with structured routing and optional automated visual verification.
- **Why:** Full-stack UI creation requires more than blind code generation—it demands automated verification that the website actually rendered correctly across all device viewports. The workflows encapsulate end-to-end execution:
  1. **Normal Workflow (`normalWorkflow`):** Single-pass execution that routes model and tools via TypeSafe Jev System One, augments the prompt, and executes the agent once.
  2. **Ship Feature Workflow (`shipWorkflow`):** Production-ready visual QA loop. Runs the initial agent build pass, captures full-page responsive screenshots (desktop, laptop, tablet, mobile), evaluates them with TypeSafe Jev System One (`noul` + `score`), and if defects or missing features are found, re-engages the agent with visual feedback to fix the code. Bounded to a maximum of 4 iterations to prevent runaway token costs.

```mermaid
flowchart TD
    Req["Workflow Input (Prompt, File URLs, Project & Sandbox ID)"] --> Route["1. TypeSafe Routing\n- routeModel (<40ms)\n- routeTools (<50ms)"]
    Route --> Aug["2. Augment Prompt with Routing Metadata"]
    Aug --> Exec["3. Agent Build Pass (agent.invoke)"]
    Exec --> Branch{"Workflow Type"}
    
    Branch -->|Normal| DoneNormal["Return Response + Selected Metadata"]
    
    Branch -->|Ship| Cap["4. captureResponsiveScreenshots()\n(Desktop, Laptop, Tablet, Mobile)"]
    Cap --> JevVerify["5. TypeSafe Jev Visual Verification\n- is_complete (noul: 0-1)\n- completion_score (score: 0-2)"]
    JevVerify --> Pass{"noul >= 0.8 OR score >= 1.6?"}
    Pass -- Yes --> DoneShip["Verified Complete: Ship Website\n(No redundant screenshots taken)"]
    Pass -- No --> Limit{"Attempt < 4?"}
    Limit -- Yes --> Fix["Feed Screenshots + Critique to Agent to Fix Code"]
    Fix --> Cap
    Limit -- No --> MaxExit["Halt (4-Attempt Cost Bound Reached)"]
```

```typescript
import { routeWorkflow, evaluateWorkflow } from "@/lib/agent/agentRouter";
import { runWorkflow, shipWorkflow, normalWorkflow } from "@/lib/agent/agentWorkflow";

// 1. Dynamic workflow routing (<40ms TypeSafe Jev System One)
const workflow = await routeWorkflow("Can you change the navbar background to glassmorphism?");
// => "ship" (detects frontend UI change, even when framed as a question)

const infoWorkflow = await routeWorkflow("How does authentication work in this repo?");
// => "normal" (detects informational non-visual inquiry)

// 2. Automated execution with runWorkflow (auto-dispatches to ship or normal)
const result = await runWorkflow({
  userMessage: "Build a responsive pricing section with monthly/annual toggle and 3 tier cards",
  projectId: "...",
  sandBoxId: "...",
});

if (result.workflow === "ship") {
  console.log(result.success);     // true (visually verified)
  console.log(result.iterations);  // number of visual QA passes
  console.log(result.screenshots); // 4 viewport CDN URLs (desktop, laptop, tablet, mobile)
} else {
  console.log(result.response);    // direct text response
}
```

---

### 4. Deep Agent Orchestration & 5-Layer Middleware Pipeline
- **Where:** `src/lib/agent/index.ts`.
- **When:** Initialized as a singleton execution graph and invoked per user chat prompt.
- **Why:** High-autonomy coding agents frequently suffer from prompt bloat, infinite compilation retry loops, and context degradation. Relie deploys a 5-layer middleware pipeline to guarantee deterministic execution bounds.
- **How:**

```mermaid
flowchart TD
    Prompt["User Prompt Ingested"] --> M1["Layer 1: QuickJS Sandbox\nEvaluates pure JS, math, layout logic without touching disk"]
    M1 --> M2["Layer 2: Model Call Guardrail\nCaps model calls at 20 per turn; halts runaway compiler retry loops"]
    M2 --> M3["Layer 3: Context Editing\nTriggers at 40,000 tokens; clears old file reads to [cleared], preserves 3 most recent"]
    M3 --> M4["Layer 4: Todo Task Planner\nGenerates multi-component build checklist (Navbar -> Hero -> Features)"]
    M4 --> M5["Layer 5: In-Model Summarization\nTriggers at 80,000 tokens; MiniMax summarizes old turns, preserves last 20 messages"]
    M5 --> LLM["LLM Generates Code / Calls Tools"]
```

---

### 5. AI Visual Asset Extraction & Neon Object Storage Pipeline
- **Where:** 
  - `src/lib/agent/tools/assetExtraction/engine.ts`
  - `src/lib/agent/tools/assetExtraction/assetExtractionTool.ts`
  - `src/lib/objectStorage/index.ts`
- **When:** Triggered when the agent calls `extract_website_assets` with source image URLs and desired labels (e.g. logos, hero images, badges).
- **Why:** Web UI design requires slicing high-resolution assets from mockups. Transmitting Base64 strings back to the LLM burns 100k+ context tokens and causes prompt exhaustion. Instead, assets are cropped in-memory and immediately uploaded to Neon Object Storage.
- **How:**

```mermaid
sequenceDiagram
    participant Agent as Deep Agent (GPT-4o Mini)
    participant Tool as extract_website_assets
    participant Gemini as OpenRouter (Gemini 3.6 Flash)
    participant Sharp as Sharp (libvips)
    participant NeonS3 as Neon S3 Object Storage

    Agent->>Tool: extract_website_assets({ imageUrls, labels })
    Tool->>Tool: Fetch image URLs into memory buffers
    Tool->>Sharp: Normalize EXIF orientation & convert to PNG buffer
    Tool->>Gemini: withStructuredOutput(AssetDetectionBatchSchema)
    Note over Tool,Gemini: Sends images + label requests (max 25 per batch)
    Gemini-->>Tool: Bounding boxes [ymin, xmin, ymax, xmax] (0-1000 scale)
    Tool->>Sharp: sharp(buffer).extract({ left, top, width, height })
    Sharp-->>Tool: In-memory cropped PNG Buffer
    Tool->>NeonS3: s3.send(PutObjectCommand)
    Note over Tool,NeonS3: Path-style upload to project-assets bucket
    NeonS3-->>Tool: Public asset URL (${AWS_ENDPOINT_URL_S3}/project-assets/...)
    Tool-->>Agent: JSON [{ label, url }]
    Note over Agent: Agent embeds clean URL into JSX components (Zero Base64 in context!)
```

---

### 6. High-Performance Document Ingestion & Streaming Media Engine (MuPDF & Sharp)
- **Where:** `src/lib/utils/fileProcessor.ts` and `src/lib/utils/index.ts`.
- **When:** Invoked whenever users attach assets to chat prompts (multi-page PDF specifications, architecture wireframe decks, SVG logos, PNG/JPEG mockups, data URIs, or remote URLs).
- **Why:** Real-world autonomous engineering prompts frequently attach multi-page specifications (often 20–200+ pages). In traditional architectures:
  1. Parsing and buffering entire multi-page PDFs into memory causes severe memory spikes (uncompressed canvas bitmaps consume ~14MB per page, meaning 200 pages easily triggers 2GB+ Node.js Out-Of-Memory crashes).
  2. Sending raw PDF blobs or dozens of full-resolution images into LLM prompts burns hundreds of thousands of tokens and triggers gateway timeouts.
  3. External binary wrappers (like `poppler-utils` or Ghostscript) require complex host dependencies that break in serverless or minimal container environments.
- **How:**
  1. **Polymorphic Ingestion:** Resolves any `FileInput` type (`Buffer`, `Uint8Array`, `Blob`, `File`, data URIs, remote URLs, or local paths) via `toBuffer()`.
  2. **Zero-Latency Pass-Through for Images & SVGs:** Inspects buffer with `sharp(buffer).metadata()`. If an image or SVG format is detected, it immediately returns the original input unmodified ($0$ re-encoding latency, zero data mutation).
  3. **In-Process MuPDF C/WASM Engine:** If a PDF header (`%PDF-`) is detected, it initializes Artifex MuPDF compiled to WebAssembly (`mupdf`). Unlike PDF.js, MuPDF parses the trailer in 1ms without pre-indexing every object.
  4. **AsyncGenerator Streaming & Memory Isolation:** Yields page image buffers one-by-one (`yield page`) via an `AsyncGenerator`. Only a single page image resides in RAM at any given moment ($O(1)$ memory allocation), allowing preceding pages to be immediately garbage-collected or streamed to object storage.
  5. **50-Page Safe Ceiling:** Automatically caps sequential processing at `maxPages: 50` by default, protecting host serverless/container instances against runaway document processing.

```mermaid
flowchart LR
    Input["Input File\n(Buffer / File / URL / SVG / PDF)"] --> Norm["toBuffer() Resolver"]
    Norm --> Check{"Image or SVG?"}
    Check -- Yes --> Pass["Pass-Through Unmodified\n(Zero latency / No mutation)"]
    Check -- No (PDF) --> MuPDF["MuPDF C/WASM Engine\n(In-Memory / Zero Disk I/O)"]
    MuPDF --> Guard{"Page <= 50?"}
    Guard -- Yes --> Stream["AsyncGenerator yield Buffer\n(O(1) memory per page)"]
    Guard -- No --> End["Halt Stream (Safety Ceiling)"]
```

```typescript
import { processFileToImages, processFileToImagesArray } from "@/lib/utils/fileProcessor";

// Pattern A: Streaming consumption (Zero memory accumulation for 200+ page PDFs)
for await (const pageBuffer of processFileToImages(uploadedFile, { maxPages: 50 })) {
  // Upload each page directly to Neon S3 or dispatch to vision detector
}

// Pattern B: Direct batch array retrieval
const images = await processFileToImagesArray(uploadedFile);
```

---

### 7. Daytona Isolated Cloud Sandbox Environment
- **Where:** `src/lib/sandbox/index.ts` and `src/lib/sandbox/fileOperation/`.
- **When:** Initialized upon project creation or resumed when an active project is loaded.
- **Why:** Prevents untrusted arbitrary code execution on host infrastructure. Provides a real, running Vite/React web application with hot-reloading in the cloud.
- **How:**
  1. `createSandBox()` verifies or provisions the `react-vite-bun-v2` snapshot (based on `oven/bun:1-debian`).
  2. The snapshot clones `template-react-project` to `/home/daytona/app` and runs `bun install`.
  3. Daytona initiates the container running `bun run --cwd /home/daytona/app dev -- --host 0.0.0.0 --port 3000`.
  4. Returns a 1-hour signed preview URL (`sb.getSignedPreviewUrl(3000, 3600)`) embedded directly into the Next.js client iframe.
  5. The container is configured with `autoStopInterval: 20` (suspends automatically after 20 minutes of idle time to conserve compute).

---

### 8. The 15 Agent Tool Ecosystem
Every tool is registered via LangChain's `tool(...)` helper and provides strict Zod schema validation:

| Tool Identifier | Module | Description | Input Parameters | Output Signature |
|---|---|---|---|---|
| `extract_website_assets` | `assetExtraction/` | AI vision detection & S3 upload | `{ imageUrls: string[], labels: string[] }` | `[{ label: string, url: string \| null }]` |
| `list_fs` | `fsOperations/listFsTool.ts` | List directory files and folders | `{ path?: string }` | Formatted directory listing string |
| `get_file_details` | `fsOperations/getFileDetailsTool.ts` | Inspect file metadata & size | `{ path: string }` | Metadata object string |
| `create_folder` | `fsOperations/createFolderTool.ts` | Create recursive directory trees | `{ path: string }` | Confirmation string |
| `upload_file` | `fsOperations/uploadFileTool.ts` | Write/overwrite single file | `{ content: string, path?: string }` | Success status message |
| `upload_files` | `fsOperations/uploadFilesTool.ts` | Batch write multiple source files | `{ files: Array<{ path: string, content: string }> }` | Batch confirmation status |
| `read_file_text` | `fsOperations/readFileTextTool.ts` | Read file contents as UTF-8 | `{ path: string }` | Complete file text string |
| `read_files_text` | `fsOperations/readFilesTextTool.ts` | Batch read multiple files concurrently | `{ paths: string[] }` | Map of paths to file text |
| `delete_file` | `fsOperations/deleteFileTool.ts` | Remove file or recursive folder | `{ path: string }` | Deletion confirmation |
| `set_file_permissions` | `fsOperations/setFilePermissionsTool.ts` | Update Unix access permissions | `{ path: string, mode: string }` | Confirmation string |
| `search_files` | `fsOperations/searchFilesTool.ts` | Grep text pattern in workspace | `{ pattern: string, path?: string }` | Matching files and line excerpts |
| `find_files` | `fsOperations/findFilesTool.ts` | Search files by glob pattern | `{ pattern: string, path?: string }` | Array of relative matched paths |
| `replace_in_files` | `fsOperations/replaceInFilesTool.ts` | Find and replace text across files | `{ find: string, replace: string, paths?: string[] }` | Replacement summary counts |
| `move_files` | `fsOperations/moveFilesTool.ts` | Move or rename file/directory | `{ source: string, destination: string }` | Relocation status message |
| `download_file_stream`| `fsOperations/downloadFileStreamTool.ts` | Stream binary content | `{ path: string }` | Base64/stream data representation |

---

### 9. Streaming API & Sequenced Database Persistence Pipeline
- **Where:** `src/app/api/v1/agent/route.ts`.
- **When:** Executes when the client sends a `POST` request with `{ projectId, message }`.
- **Why:** Real-time web applications must show streaming reasoning steps and tool execution progress, but server crashes or client disconnections must never corrupt trace history. Everything is sequenced server-side and batch-committed to Neon Postgres.
- **How:**
  1. Validates `bodySchema` with Zod (valid UUID and message string or attachment tuple).
  2. Persists user prompt to `chat_history`.
  3. Lazily provisions checkpointer tables via `ensureCheckpointerReady()`.
  4. Initiates `agent.stream({ messages }, { streamMode: "messages", configurable: { thread_id: projectId } })`.
  5. Iterates through chunks:
     - Accumulates reasoning tokens (`msg.additional_kwargs.reasoning_content` or `msg.text`).
     - Upon encountering `tool_call_chunks`, flushes accumulated reasoning as a `reasoning` execution record.
     - Intercepts `ToolMessage` instances and records structured input/output as `tool_call` and `tool_done`.
  6. Filters out internal `metadata.lcSource === "summarization"` compaction chunks.
  7. Inserts assistant reply into `chat_history`.
  8. Batch-inserts all execution steps into `llm_executions` with deterministic sequence numbers linked by foreign key to the assistant message ID.

---

### 12. Relational Database Schema (Drizzle ORM & PostgresSaver)

```mermaid
erDiagram
    users ||--o{ projects : "owns"
    users ||--o{ chat_history : "creates"
    projects ||--o{ chat_history : "contains"
    projects ||--o{ llm_executions : "scopes"
    chat_history ||--o{ llm_executions : "produces"

    users {
        uuid id PK "defaultRandom()"
        varchar clerkId UK "unique, indexed"
        varchar email
        varchar name
        varchar image
        timestamp createdAt "defaultNow()"
    }

    projects {
        uuid id PK "defaultRandom()"
        uuid userId FK "references users.id on cascade"
        varchar name
        text description
        varchar sandboxId
        timestamp createdAt "defaultNow()"
    }

    chat_history {
        uuid id PK "defaultRandom()"
        uuid projectId FK "references projects.id on cascade"
        uuid userId FK "references users.id on cascade"
        enum role "system | user | assistant | tool"
        text content
        jsonb attachments "validated Attachment[]"
        timestamp createdAt "defaultNow()"
    }

    llm_executions {
        uuid id PK "defaultRandom()"
        uuid chatHistoryId FK "references chat_history.id on cascade"
        uuid projectId FK "references projects.id on cascade"
        integer sequence "arrival sequence index"
        varchar type "reasoning | tool_call | tool_done"
        varchar toolName
        jsonb input "structured JSON parameters"
        jsonb output "structured JSON output / URL"
        jsonb attachments
        timestamp createdAt "defaultNow()"
    }
```

In addition, Neon Postgres hosts the tables managed by LangGraph's `@langchain/langgraph-checkpoint-postgres`:
- `checkpoints`: Execution state metadata, channel versions, and checkpoint IDs.
- `checkpoint_blobs`: Serialized message history, graph channel states, and middleware variables.
- `checkpoint_writes`: Pending writes and intermediate task executions.

---

### 13. 3-Tier Progressive Skills System (AgentSkills.io Spec)
- **Where:** `src/lib/agent/skills/` (Active Parent Routers) and `.agents/skills/` (Preserved Library Warehouse).
- **Architecture & Context Protection:** Instead of loading 95+ flat skill summaries into the system prompt at startup (which consumes ~5,000 tokens on *every* turn and causes choice paralysis), Relie AI adheres strictly to the official [AgentSkills.io Specification](https://agentskills.io) using **3-Tier Progressive Disclosure**:
  1. **Level 1 — Startup Metadata (~300 tokens):** The agent runtime (`deepagents`) loads only the `name` and `description` of the **7 Core Parent Domains** on startup, achieving a **94% token reduction**.
  2. **Level 2 — Parent Activation (< 2,500 tokens):** When a user prompt triggers a domain, the parent `SKILL.md` router is loaded to determine the exact specialized sub-skill needed.
  3. **Level 3 — On-Demand Reference Loading:** Specific guides, workflows, and rule sets are read from `references/` on-demand only when executing that specific sub-task, keeping the context window light and focused.
  4. **Filesystem Write Guard:** All skill definitions in `/src/lib/agent/skills/**` are write-protected (`mode: "deny"`) to prevent accidental modification during code generation runs.

```
src/lib/agent/skills/
├── frontend-design-taste/       <-- Parent: One-shot website creation & aesthetics
│   ├── SKILL.md                 <-- Short router & index (Startup: ~35 tokens)
│   └── references/              <-- Loaded ONLY on-demand:
│       ├── design-taste-frontend.md, gpt-taste.md, high-end-visual-design.md
│       ├── stitch-design-taste.md, minimalist-ui.md, industrial-brutalist-ui.md
│       └── image-to-code.md, imagegen-frontend-web.md, imagegen-frontend-mobile.md
│
├── ui-craft-impeccable/         <-- Parent: Design consistency & component polish
│   ├── SKILL.md                 <-- Short router & index (Startup: ~30 tokens)
│   └── references/
│       ├── impeccable.md, design-motion-principles.md, redesign-existing-projects.md
│       └── brandkit.md, make-bot-ui.md
│
├── frontend-code-craft/         <-- Parent: Production TypeScript & component architecture
│   ├── SKILL.md                 <-- Short router & index (Startup: ~35 tokens)
│   └── references/
│       ├── typescript-best-practices.md, surgical-patch.md, safe-refactor.md
│       ├── tdd.md, lean-build.md, codebase-design.md, domain-modeling.md
│       ├── architect.md, implement.md, implement-spec.md, prototype.md
│       └── resolving-merge-conflicts.md, setup-ts-deep-modules.md, migrate-to-shoehorn.md
│
├── ponytail-engineering/        <-- Parent: YAGNI & zero-dependency mindset
│   ├── SKILL.md                 <-- Short router & index (Startup: ~35 tokens)
│   └── references/
│       ├── ponytail.md, ponytail-review.md, ponytail-audit.md
│
├── frontend-quality-review/     <-- Parent: Verification, security & bug diagnosis
│   ├── SKILL.md                 <-- Short router & index (Startup: ~35 tokens)
│   └── references/
│       ├── vibe-security.md, code-review.md, caveman-review.md, verify-and-stop.md
│       ├── investigate-first.md, diagnosing-bugs.md, blast-radius.md, interrogate.md
│       └── create-verification-skill.md, maintain-verification-skill.md, setup-pre-commit.md
│
├── agent-communication/         <-- Parent: Dialogue, anti-slop & requirement planning
│   ├── SKILL.md                 <-- Short router & index (Startup: ~35 tokens)
│   └── references/
│       ├── caveman.md, caveman-commit.md, caveman-compress.md, caveman-help.md
│       ├── bro.md, no-ai-slop.md, unslop.md, poteto-mode.md, grill-me.md, grilling.md
│       ├── grill-with-docs.md, loop-me.md, to-spec.md, to-tickets.md, to-questionnaire.md
│       └── how.md, why.md, wait-what.md, teach.md, research.md, pr.md, retro.md...
│
├── architectural-principles/    <-- Parent: 23 distilled mental models
│   ├── SKILL.md                 <-- Short router & index (Startup: ~35 tokens)
│   └── references/
│       ├── core-principles.md (10 core simplicity & laziness heuristics)
│       ├── architecture-principles.md (6 domain modeling & boundary guards)
│       └── execution-principles.md (7 verification, proof & root-cause rules)
│
└── codeoptimizer/               <-- Standalone code optimization helper
```

---

### 14. Direct S3 Object Storage Upload Pipeline
- **Where:** `src/app/api/v1/upload/route.ts` and `src/lib/objectStorage/index.ts`.
- **When:** Invoked when users upload binary assets, screenshots, or documents via the Web IDE chat interface.
- **Why:** Keeps large binary payloads out of the database and memory, storing assets directly in high-performance S3 object storage co-located with Neon Serverless Postgres.
- **How:**
  1. Accepts `multipart/form-data` uploads via `POST /api/v1/upload`.
  2. Extracts and sanitizes file metadata, validating file types and size bounds.
  3. Uploads the buffer to Neon Object Storage (`project-assets` bucket) with path-style S3 endpoint configuration (`forcePathStyle: true`).
  4. Returns the deterministic public CDN URL (`${AWS_ENDPOINT_URL_S3}/${NEON_STORAGE_BUCKET}/${key}`) for direct embedding into prompt attachments and JSX components.

---

## Environment Variables

Create `.env` or `.env.local` in your project root:

```env
# Database (Neon Serverless Postgres)
DATABASE_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Providers & Intent Routing
OPENROUTER_API_KEY=sk-or-v1-...
TYPESAFE=ts_...

# Daytona Sandbox Environment
DAYTONA_API_KEY=dtn_...
DAYTONA_SERVER_URL=https://app.daytona.io/api
DAYTONA_TARGET=us

# Neon Object Storage (AWS S3-compatible, branch-scoped)
AWS_ACCESS_KEY_ID=your_neon_storage_key_id
AWS_SECRET_ACCESS_KEY=your_neon_storage_secret
AWS_ENDPOINT_URL_S3=https://ep-xyz.storage.us-east-2.aws.neon.tech
AWS_REGION=us-east-2
NEON_STORAGE_BUCKET=project-assets

# Application Environment
NODE_ENV=development
```

---

## Getting Started

### 1. Install Dependencies
```bash
bun install
```

### 2. Push Database Schema to Neon
```bash
bun run db:push
```

### 3. Launch Drizzle Studio (Database GUI)
```bash
bun run db:studio
```

### 4. Run Development Server
```bash
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the Relie AI Web IDE.

---

## Available NPM / Bun Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Start Next.js local development server |
| `build` | `next build` | Compile Next.js production build |
| `start` | `next start` | Run Next.js production server |
| `lint` | `eslint` | Run ESLint checks across the codebase |
| `db:push` | `drizzle-kit push` | Synchronize Drizzle schema directly to Neon DB |
| `db:generate`| `drizzle-kit generate` | Generate SQL migration artifacts |
| `db:migrate` | `drizzle-kit migrate` | Execute pending SQL migrations |
| `db:studio` | `drizzle-kit studio` | Launch local visual Drizzle Studio database explorer |
| `db:reset` | `bun run db:drop && bun run db:push` | Drop all application tables and re-apply schema |
| `db:drop` | `bun ./scripts/drop-tables.js` | Drop all database tables |

---

## Acknowledgments & Skill Credits

All individual skills, architectural heuristics, and design frameworks integrated into Relie AI's skill ecosystem are the intellectual property of their original creators and contributors. Full credit, gratitude, and recognition are extended to the open-source engineering, design, and AI communities:

* **Matt Pocock & Engineering Community:** For the battle-tested TypeScript best practices, deep module designs, domain modeling heuristics, and the 23 foundational architectural principles.
* **Emil Kowalski, Jakub Krehel, & Jhey Tompkins:** For the foundational micro-motion curves, interaction design rules, and animation timing budgets codified into `design-motion-principles`.
* **The Impeccable & Anti-Slop Design Authors:** For the visual hierarchy standards, typographic scale rules, and design director guidelines codified into `impeccable`, `design-taste-frontend`, and `high-end-visual-design`.
* **The AgentSkills.io Community:** For defining and pioneering the open standard of 3-Tier Progressive Disclosure via `SKILL.md` frontmatter and `references/` directory structures.

*All rights, trademarks, and copyrights for respective skills belong entirely to their original authors.*

