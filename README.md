# Relie AI — AI-Powered Shopify Storefront Builder

Relie AI is an autonomous agentic engineering platform that enables users to build, customize, and iterate on modern Shopify storefronts through a natural language interface. The agent operates inside isolated Daytona sandboxes, executes filesystem operations, interprets code, and maintains full graph state persistence via Neon Postgres and LangGraph checkpointers.

---

## Architecture Overview

```
                      ┌────────────────────────┐
                      │   Next.js 16 Client    │
                      │  (Chat UI / Web IDE)   │
                      └───────────┬────────────┘
                                  │ HTTP POST /api/v1/agent
                                  ▼
                      ┌────────────────────────┐
                      │    Clerk Auth Check    │
                      │    & User Resolver     │
                      └───────────┬────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
       ┌─────────────────────┐         ┌──────────────────────┐
       │  Neon Postgres DB   │         │     Deep Agent       │
       │  - chat_history     │         │  (deepagents v1.14)  │
       │  - llm_executions   │◄───────┤  - OpenRouter        │
       │  - checkpointer     │ checkpoints  (MiniMax M2.7)   │
       │    (PostgresSaver)  │         │  - QuickJS Sandbox   │
       └─────────────────────┘         │  - Skills System     │
                                       │  - 14 FS Tools       │
                                       └──────────┬───────────┘
                                                  │ Workspace actions
                                                  ▼
                                       ┌──────────────────────┐
                                       │   Daytona Sandbox    │
                                       │  (Vite + Bun + React)│
                                       └──────────────────────┘
```

---

## Core Stack

| Layer | Technology | Description |
|---|---|---|
| **Framework** | Next.js 16.3.5 (App Router) + React 19.2.8 | Server components, API route handlers, and client IDE |
| **Language** | TypeScript 5 (Strict Mode) | Zero compiler errors across schemas, actions, and agent tools |
| **Styling** | Tailwind CSS v4 + Radix UI (`@base-ui/react`) + Lucide Icons | Design system and interface primitives |
| **Auth** | Clerk (`@clerk/nextjs` v7.9) | User authentication auto-synced into internal Neon DB |
| **Database** | Neon Serverless Postgres (`@neondatabase/serverless`) | Serverless connection pooling and persistent relational storage |
| **ORM** | Drizzle ORM (`drizzle-orm` v1.0.0-rc.4) | Type-safe SQL schema definitions, migrations, and queries |
| **AI Agent** | `deepagents` (v1.14) + LangChain (`langchain` v1.5) | Single streamlined ReAct deep agent with streaming and filesystem tools |
| **Model** | OpenRouter (`minimax/minimax-m2.7`) | High-capacity reasoning and code generation model |
| **Checkpointer** | `@langchain/langgraph-checkpoint-postgres` | Persistent graph execution states keyed by `projectId` (`thread_id`) |
| **Code Execution** | `@langchain/quickjs` | Sandboxed JavaScript code interpreter middleware |
| **Sandboxes** | Daytona SDK (`@daytona/sdk` v0.214) | Isolated container sandboxes running Bun + Vite on Debian |
| **State** | Zustand (`zustand` v5) | Lightweight client-side application state |
| **Validation** | Zod (`zod` v4) | Runtime request validation and DB input schemas |

---

## Architectural Principles & Decisions

### 1. Single Streamlined Agent (No Subagents)
Rather than spawning nested subagents with multi-turn delegation overhead, Relie uses a single high-capacity deep agent equipped with 14 filesystem tools and QuickJS. This keeps token usage predictable, eliminates delegation latency, and provides a direct, traceable reasoning loop.

### 2. Strict Project Isolation (No Cross-Project Long-Term Memory)
Relie deliberately avoids global or cross-thread long-term memory (`/memories/` store backends). Every Shopify storefront project has its own branding, design tokens, and domain rules. Cross-project memory risks hallucinating or leaking styles between client stores. Project state is strictly scoped to the project's own graph checkpoints and chat history.

### 3. Progressive Skills Disclosure
Skills are loaded from `/src/lib/agent/skills/` with write protection (`mode: "deny"`). DeepAgents uses progressive disclosure: only skill names and descriptions are added to the system prompt at startup. The agent inspects full skill documentation on-demand only when a relevant task arises, saving thousands of tokens per turn:
- **`codeoptimizer`**: Minimalist "Ponytail" engineering philosophy (YAGNI, standard library first, zero bloat).
- **`design-motion-principles`**: Motion and interaction design guidelines (Emil Kowalski, Jhey Tompkins).

### 4. Middleware & Automated Context Engineering
Relie AI configures a targeted suite of LangChain prebuilt middlewares inside `src/lib/agent/index.ts`:
- **Code Execution (`createCodeInterpreterMiddleware`)**: Sandboxed QuickJS code interpreter for instant mathematical and logical evaluations.
- **Runaway Loop Guardrail (`modelCallLimitMiddleware`)**: Enforces `runLimit: 20` model calls per user turn to prevent infinite fix/edit loops if a compiler error occurs.
- **Context Editing (`contextEditingMiddleware` + `ClearToolUsesEdit`)**: Replaces older tool outputs with `[cleared]` when conversation tokens reach 40,000, while preserving the 3 most recent tool results. This prevents stale file reads from bloating prompt memory.
- **To-Do Planning (`todoListMiddleware`)**: Equips the agent with the `write_todos` tool to plan and track multi-component Shopify storefront builds.
- **In-Model Summarization (`summarizationMiddleware`)**: Compresses older conversational turns into a concise summary when token count reaches 80,000, retaining the last 20 messages. Transcripts are archived to `/conversation_history/{projectId}.md`.
- **Compaction Filter**: Streaming chunks flagged with `metadata.lcSource === "summarization"` are filtered out in the API route, preventing internal compaction tokens from leaking into user chat or DB execution tables.
- **Large Output Truncation**: DeepAgents' `FilesystemMiddleware` automatically detects tool outputs exceeding 20,000 tokens (~80,000 characters) and substitutes them with filesystem pointers.

### 5. Multi-Day Session Resumption
LangGraph's `PostgresSaver` binds each project's execution graph to `configurable: { thread_id: projectId }`. When a user closes their browser and returns days later, the agent resumes from the exact checkpoint without re-evaluating historical steps. `ensureCheckpointerReady()` lazily provisions the checkpointer tables on first use.

### 6. Guaranteed Server-Side DB Persistence
All intermediate steps stream and persist server-side in natural arrival order:
1. **User Message**: Persisted to `chat_history`.
2. **Reasoning Segments**: Flushed to `llm_executions` (`type: "reasoning"`) before any tool runs.
3. **Tool Invocations**: Assembled from streaming chunks and logged to `llm_executions` (`type: "tool_call"`) with structured JSON inputs.
4. **Tool Results**: Intercepted from `ToolMessage` outputs into `llm_executions` (`type: "tool_done"`).
5. **Final Assistant Reply**: Persisted to `chat_history`.
6. **Execution Batch Insert**: All execution records are batch-inserted into `llm_executions` linked via foreign key to the assistant message with deterministic sequence numbers.
Even if the user disconnects mid-stream, the server completes execution and records full traces to Neon DB.

---

## File and Folder Structure

```
relie/
├── drizzle/                    # Generated SQL migration files
├── public/                     # Static public assets
├── scripts/
│   └── drop-tables.js          # DB reset utility script
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── dashboard/      # Project listing and dashboard views
│   │   │   │   └── [...slug]/
│   │   │   ├── project/        # Web IDE workspace per project
│   │   │   │   └── [...slug]/
│   │   │   └── layout.tsx      # Authenticated app shell layout
│   │   ├── (auth)/             # Clerk sign-in and sign-up pages
│   │   ├── (marketing)/        # Public marketing & landing pages
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── agent/
│   │   │           └── route.ts # Agent execution & ordered DB persistence API
│   │   ├── globals.css         # Tailwind v4 theme and custom styles
│   │   ├── layout.tsx          # Root HTML layout with ClerkProvider
│   │   └── page.tsx            # Root redirect/entry page
│   ├── backgroundJobs/         # Reserved for async task runners (Trigger.dev)
│   ├── components/
│   │   └── ui/                 # Reusable UI components (button, card, dialog)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/
│   │   ├── agent/
│   │   │   ├── prompts/        # System prompts and persona definitions
│   │   │   ├── skills/         # In-agent skills (codeoptimizer, design-motion)
│   │   │   ├── tools/          # Custom agent tools
│   │   │   │   └── fsOperations/ # 14 Daytona filesystem tools
│   │   │   ├── index.ts        # createDeepAgent setup, backend & checkpointer
│   │   │   └── invokeAgent.ts  # StreamEvents SSE adapter
│   │   ├── auth/
│   │   │   ├── currentUser.ts  # Clerk session to Neon user resolver
│   │   │   └── index.ts        # Auth exports
│   │   ├── db/
│   │   │   ├── action/         # Typed database query and mutation actions
│   │   │   │   ├── chatHistory.ts
│   │   │   │   ├── llmExecution.ts
│   │   │   │   ├── project.ts
│   │   │   │   └── user.ts
│   │   │   ├── schema/         # Drizzle schema definitions
│   │   │   │   ├── chatHistory.ts
│   │   │   │   ├── llmExecution.ts
│   │   │   │   ├── project.ts
│   │   │   │   └── user.ts
│   │   │   ├── drizzle.ts      # HTTP DB client & Serverless Pool setup
│   │   │   ├── index.ts        # DB barrel export
│   │   │   └── validators.ts   # Zod validation schemas
│   │   ├── llm/
│   │   │   └── invokeAgent.ts  # Simple direct agent invocation helper
│   │   ├── sandbox/
│   │   │   ├── fileOperation/  # 19 direct Daytona SDK operations
│   │   │   └── index.ts        # createSandBox lifecycle manager
│   │   └── utils/
│   │       ├── env.ts          # Zod-validated environment variables
│   │       └── ui.ts           # Classnames & styling utilities
│   ├── store/
│   │   └── sandBoxId.ts        # Zustand sandbox state store
│   └── proxy.ts                # Clerk edge authentication middleware
├── components.json             # Shadcn component configuration
├── drizzle.config.ts           # Drizzle kit configuration
├── package.json                # Dependencies, engines, and scripts
└── tsconfig.json               # TypeScript compiler configuration
```

---

## Agent Filesystem Tools

14 LangChain-compatible structured tools that translate agent actions directly into Daytona sandbox operations:

| Tool | Action | Description |
|---|---|---|
| `listFsTool` | `listFs` | List directory contents and structure |
| `getFileDetailsTool` | `getFileDetails` | Inspect file metadata, permissions, and byte size |
| `createFolderTool` | `createFolder` | Create single or recursive directory trees |
| `uploadFileTool` | `uploadFile` | Write or overwrite a single file |
| `uploadFilesTool` | `uploadFiles` | Batch write multiple files in one call |
| `readFileTextTool` | `readFileText` | Read single file contents as UTF-8 text |
| `readFilesTextTool` | `readFilesText` | Batch read multiple files simultaneously |
| `deleteFileTool` | `deleteFile` | Delete a file or recursive directory tree |
| `setFilePermissionsTool` | `setFilePermissions` | Adjust file access permissions |
| `searchFilesTool` | `searchFiles` | Grep text pattern inside file contents |
| `findFilesTool` | `findFiles` | Search for files by pattern or glob |
| `replaceInFilesTool` | `replaceInFiles` | Perform search-and-replace across files |
| `moveFilesTool` | `moveFiles` | Rename or relocate files and directories |
| `downloadFileStreamTool` | `downloadFileStream` | Stream binary or large file content |

---

## Daytona Sandbox Environment

- **Container Base**: Debian Linux container based on `oven/bun:1-debian`.
- **Pre-configured Stack**: React + Vite + Bun template pre-cloned and ready.
- **Port**: Auto-exposes Vite dev server on port `3000`.
- **Lifecycle**: Automatic idle shutdown after 20 minutes of inactivity.
- **Operations Library**: 19 SDK operations implemented in `src/lib/sandbox/fileOperation/` covering filesystem, log streaming, type checking, and path resolution. Sandbox execution management is decoupled from the agent prompt for security and modularity.

---

## Database Schema

Configured with Drizzle ORM on Neon Serverless Postgres:

- **`users`** (`src/lib/db/schema/user.ts`):
  - `id`: UUID (Primary Key)
  - `clerkId`: Varchar (Unique, indexed)
  - `email`, `name`, `image`: Varchar
  - `createdAt`: Timestamp
- **`projects`** (`src/lib/db/schema/project.ts`):
  - `id`: UUID (Primary Key)
  - `userId`: UUID (Foreign Key -> `users.id`, on delete cascade)
  - `name`, `description`: Varchar / Text
  - `sandboxId`: Varchar
  - `createdAt`: Timestamp
- **`chat_history`** (`src/lib/db/schema/chatHistory.ts`):
  - `id`: UUID (Primary Key)
  - `projectId`: UUID (Foreign Key -> `projects.id`, on delete cascade)
  - `userId`: UUID (Foreign Key -> `users.id`)
  - `role`: Enum (`user`, `assistant`, `system`, `tool`)
  - `content`: Text
  - `attachments`: JSONB
  - `createdAt`: Timestamp
- **`llm_executions`** (`src/lib/db/schema/llmExecution.ts`):
  - `id`: UUID (Primary Key)
  - `chatHistoryId`: UUID (Foreign Key -> `chat_history.id`, on delete cascade)
  - `projectId`: UUID (Foreign Key -> `projects.id`)
  - `sequence`: Integer (Sequential order of arrival)
  - `type`: Varchar (`reasoning`, `tool_call`, `tool_done`)
  - `toolName`: Varchar
  - `input`: JSONB
  - `output`: JSONB
  - `attachments`: JSONB
  - `createdAt`: Timestamp
- **Checkpointer Tables**: Automatically provisioned by `PostgresSaver` for storing LangGraph states.

---

## Environment Variables

Create a `.env` or `.env.local` file in the root directory:

```env
# Database (Neon Serverless Postgres)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Provider (OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-...

# Sandbox Environment (Daytona)
DAYTONA_API_KEY=dtn_...
DAYTONA_SERVER_URL=https://app.daytona.io/api
DAYTONA_TARGET=us

# Application
NODE_ENV=development
```

---

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Set Up Database

Push the Drizzle schema to your Neon database:

```bash
bun run db:push
```

To launch the Drizzle Studio visual database inspector:

```bash
bun run db:studio
```

### 3. Run the Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Start Next.js development server |
| `build` | `next build` | Create production build |
| `start` | `next start` | Run production build |
| `lint` | `eslint` | Run ESLint checks across codebase |
| `db:push` | `drizzle-kit push` | Push Drizzle schema changes directly to Neon DB |
| `db:generate`| `drizzle-kit generate` | Generate SQL migration files from schema |
| `db:migrate` | `drizzle-kit migrate` | Execute pending SQL migrations |
| `db:studio` | `drizzle-kit studio` | Launch local Drizzle Studio GUI |
| `db:reset` | `bun run db:drop && bun run db:push` | Drop all DB tables and re-push schema |
| `db:drop` | `bun ./scripts/drop-tables.js` | Drop existing database tables |
