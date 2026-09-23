import { createDeepAgent, FilesystemBackend } from "deepagents";
import { createCodeInterpreterMiddleware } from "@langchain/quickjs";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import {
  summarizationMiddleware,
  contextEditingMiddleware,
  ClearToolUsesEdit,
  todoListMiddleware,
  modelCallLimitMiddleware,
} from "langchain";
import { fsTools } from "./tools/fsOperations";
import systemPromt from "./prompts/systemPromt";
import { pgPool } from "@/lib/db/drizzle";

const backend = new FilesystemBackend({
  rootDir: process.cwd(),
  virtualMode: true,
});

// PostgresSaver uses the Neon pool and writes checkpoints to Neon DB.
// thread_id = projectId — each project has its own isolated graph state.
// Docs: https://docs.langchain.com/oss/javascript/langgraph/checkpointers
const checkpointer = new PostgresSaver(pgPool);

let _setupDone = false;
export async function ensureCheckpointerReady() {
  if (_setupDone) return;
  await checkpointer.setup();
  _setupDone = true;
}

export const agent = createDeepAgent({
  model: "openrouter:minimax/minimax-m2.7",
  systemPrompt: systemPromt,
  checkpointer,
  permissions: [
    {
      operations: ["write"],
      paths: ["/src/lib/agent/skills/**"],
      mode: "deny",
    },
  ],
  backend,
  skills: ["/src/lib/agent/skills/"],
  middleware: [
    /**
     * 1. In-Memory QuickJS Code Interpreter
     * - WHERE IT WORKS: Injects an isolated JavaScript sandbox tool (`execute_code`) into the agent's tool loop.
     * - WHEN IT WORKS:  Triggers when the agent needs to test pure JS logic, compute responsive layout math,
     *                   format JSON, or validate Shopify Storefront GraphQL query variables in-memory
     *                   without touching the Daytona filesystem or running shell commands.
     */
    createCodeInterpreterMiddleware(),

    /**
     * 2. Runaway Loop & Cost Guardrail (Model Call Limit)
     * - WHERE IT WORKS: Intercepts the LangGraph loop before each LLM generation (`beforeModel` hook).
     * - WHEN IT WORKS:  Triggers during an active user prompt. If the agent gets stuck in a repetitive
     *                   error-fixing loop (e.g., repeatedly failing TypeScript typecheck or circular CSS imports)
     *                   and hits 20 model calls in a single turn, it terminates gracefully (`exitBehavior: "end"`),
     *                   preventing runaway API billing and server timeouts.
     */
    modelCallLimitMiddleware({
      runLimit: 20,
      exitBehavior: "end",
    }),

    /**
     * 3. Token Pruning & Stale File Cleaner (Context Editing)
     * - WHERE IT WORKS: Runs before each model call (`beforeModel` hook) by inspecting historical `ToolMessage` tokens.
     * - WHEN IT WORKS:  Triggers whenever total conversation tokens exceed 40,000. In storefront coding, the agent
     *                   frequently reads multiple large files (`Header.tsx`, `ProductGrid.tsx`, `CartDrawer.tsx`).
     *                   This replaces older raw file read outputs with `[cleared]` while preserving the 3 most
     *                   recent tool results. The agent still remembers *that* it read the file (call signature intact),
     *                   drastically reducing prompt tokens and eliminating context degradation.
     */
    contextEditingMiddleware({
      edits: [
        new ClearToolUsesEdit({
          trigger: { tokens: 40_000 },
          keep: { messages: 3 },
          clearToolInputs: false,
          placeholder: "[cleared]",
        }),
      ],
    }),

    /**
     * 4. Multi-Component Task Planner (To-Do List)
     * - WHERE IT WORKS: Injects the `write_todos` tool and task-decomposition instructions into the agent prompt.
     * - WHEN IT WORKS:  Triggers on complex multi-step coding prompts (e.g., "Build an entire luxury jewelry storefront").
     *                   The agent creates a visible checklist, marks tasks (`in_progress`, `completed`), and stays
     *                   focused on building components sequentially (Navbar → Hero → ProductGrid → Cart) without
     *                   stopping halfway or forgetting remaining items.
     */
    todoListMiddleware(),

    /**
     * 5. Multi-Day Conversation Compactor (In-Model Summarization)
     * - WHERE IT WORKS: Wraps LLM generation (`wrapModelCall` hook) inside the compiled LangGraph pipeline.
     * - WHEN IT WORKS:  Triggers during long, multi-day editing sessions when the conversation history crosses
     *                   80,000 tokens. It uses MiniMax M2.7 to summarize older dialogue turns into working memory,
     *                   preserves the most recent 20 messages verbatim, and archives transcripts to
     *                   `/conversation_history/{projectId}.md`.
     */
    summarizationMiddleware({
      model: "openrouter:minimax/minimax-m2.7",
      trigger: { tokens: 80_000 },
      keep: { messages: 20 },
    }),
  ],
  tools: [...fsTools],
});
