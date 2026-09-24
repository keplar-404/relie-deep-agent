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

    subgraph AgentCore["Deep Agent Pipeline (deepagents v1.14)"]
        LLM["OpenRouter (MiniMax M2.7)"]
        MW1["1. QuickJS Interpreter"]
        MW2["2. Call Limit Guardrail (20 Max)"]
        MW3["3. Context Editor (40k Truncate)"]
        MW4["4. Task Planner (TodoList)"]
        MW5["5. Compaction Summarizer (80k Compress)"]
    end

    subgraph ToolEcosystem["Tool Registry (15 Structured Tools)"]
        FSTools["14 Daytona FS Tools\n(read, write, delete, search, move, glob)"]
        VisionTool["extract_website_assets\n(Gemini 3.6 Flash + Sharp In-Memory Crop)"]
    end

    subgraph Sandbox["Daytona Cloud Sandbox"]
        Debian["Debian Linux (oven/bun:1-debian)"]
        ViteDev["Vite Dev Server (Port 3000)"]
        AppFiles["/home/daytona/app Web Application Code"]
    end

    UI -->|HTTP POST /api/v1/agent| Clerk
    Clerk --> Resolver
    Resolver --> Postgres
    Resolver --> API
    API --> Postgres
    API --> AgentCore
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

## Core Technology Stack

| Layer | Technology | Version | Architectural Responsibility |
|---|---|---|---|
| **App Framework** | Next.js (App Router) | `16.3.5` | React Server Components, client IDE shell, API routing |
| **UI Runtime** | React | `19.2.8` | Concurrent client-side state, streaming UI rendering |
| **Agent Framework** | `deepagents` + `@langchain/core` | `1.14.0` / `1.2.12` | ReAct reasoning loop, memory backend, tool execution |
| **Primary LLM** | OpenRouter (`minimax/minimax-m2.7`) | — | High-capacity reasoning, multi-file code synthesis |
| **Vision Detector** | OpenRouter (`google/gemini-3.6-flash`) | — | Sub-second 2D normalized object bounding-box detection |
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

### 2. Deep Agent Orchestration & 5-Layer Middleware Pipeline
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

### 3. AI Visual Asset Extraction & Neon Object Storage Pipeline
- **Where:** 
  - `src/lib/agent/tools/assetExtraction/engine.ts`
  - `src/lib/agent/tools/assetExtraction/assetExtractionTool.ts`
  - `src/lib/objectStorage/index.ts`
- **When:** Triggered when the agent calls `extract_website_assets` with source image URLs and desired labels (e.g. logos, hero images, badges).
- **Why:** Web UI design requires slicing high-resolution assets from mockups. Transmitting Base64 strings back to the LLM burns 100k+ context tokens and causes prompt exhaustion. Instead, assets are cropped in-memory and immediately uploaded to Neon Object Storage.
- **How:**

```mermaid
sequenceDiagram
    participant Agent as Deep Agent (MiniMax M2.7)
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

### 4. Daytona Isolated Cloud Sandbox Environment
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

### 5. The 15 Agent Tool Ecosystem
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

### 6. Streaming API & Sequenced Database Persistence Pipeline
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

### 7. Relational Database Schema (Drizzle ORM & PostgresSaver)

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

### 8. Progressive Skills System
- **Where:** `src/lib/agent/skills/`.
- **Skills Included:**
  1. **`codeoptimizer`** (`SKILL.md`): Enforces "Ponytail" minimalist engineering — YAGNI, standard library first, zero unrequested bloat, native HTML5/CSS primitives over extra packages.
  2. **`design-motion-principles`** (`SKILL.md`): Enforces the Frequency Gate, duration budgets (180ms sweet spot), `prefers-reduced-motion` compliance, and anti-AI-slop checks. Includes reference libraries from Emil Kowalski, Jakub Krehel, and Jhey Tompkins.
- **Progressive Disclosure:** Only skill names and descriptions are exposed in the system prompt at startup. Full workflows and reference files are read on-demand only when a relevant design or optimization task is requested. Write access to skill definitions is denied (`mode: "deny"`).

---

## Environment Variables

Create `.env` or `.env.local` in your project root:

```env
# Database (Neon Serverless Postgres)
DATABASE_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Provider (OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-...

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
