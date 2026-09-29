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
import { assetExtractionTool } from "./tools/assetExtraction";
import { sandboxcodeprescreenshottool } from "./tools/sandboxcodeprescreenshottool";
import systemPromt from "./prompts/systemPromt";
import { pgPool } from "@/lib/db/drizzle";

const backend = new FilesystemBackend({
  rootDir: process.cwd(),
  virtualMode: true,
});

// PostgresSaver uses the Neon pool and writes checkpoints to Neon DB.
// thread_id = projectId — each project has its own isolated graph state.
// Docs: https://docs.langchain.com/oss/javascript/langgraph/checkpointers
export const checkpointer = new PostgresSaver(pgPool);

let _setupDone = false;
export async function ensureCheckpointerReady() {
  if (_setupDone) return;
  await checkpointer.setup();
  _setupDone = true;
}

export const createAgent = (model = "openrouter:minimax/minimax-m2.7") =>
  createDeepAgent({
    model,
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
      createCodeInterpreterMiddleware(),
      modelCallLimitMiddleware({
        runLimit: 20,
        exitBehavior: "end",
      }),
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
      todoListMiddleware(),
      summarizationMiddleware({
        model: "openrouter:minimax/minimax-m2.7",
        trigger: { tokens: 80_000 },
        keep: { messages: 20 },
      }),
    ],
    tools: [...fsTools, assetExtractionTool, sandboxcodeprescreenshottool],
  });

export const agent = createAgent();
