import path from "path";
import { createDeepAgent, FilesystemBackend } from "deepagents";
import { ChatOpenRouter } from "@langchain/openrouter";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { InMemoryStore } from "@langchain/langgraph";
import {
  todoListMiddleware,
  modelRetryMiddleware,
  toolRetryMiddleware,
  modelCallLimitMiddleware,
  toolCallLimitMiddleware,
} from "langchain";
import { fsTools } from "./tools/fsOperations";
import { assetExtractionTool } from "./tools/assetExtraction";
import { imageGenerationTool } from "./tools/imageGenerationTool";
import { sandboxcodeprescreenshottool } from "./tools/sandboxcodeprescreenshottool";
import systemPromt from "./prompts/systemPromt";
import { pgPool } from "@/lib/db/drizzle";
import { env } from "@/lib/utils/env";

// Restrict the host filesystem backend strictly to the skills directory.
// virtualMode prevents any escape outside of this folder.
const skillsDirectory = path.resolve(process.cwd(), "src/lib/agent/skills");
const backend = new FilesystemBackend({
  rootDir: skillsDirectory,
  virtualMode: true,
});

// Shared in-memory store for agent cross-tool state
const store = new InMemoryStore();

// PostgresSaver uses the Neon pool and writes checkpoints to Neon DB.
// thread_id = projectId — each project has its own isolated graph state.
export const checkpointer = new PostgresSaver(pgPool);

let _setupDone = false;
export async function ensureCheckpointerReady() {
  if (_setupDone) return;
  await checkpointer.setup();
  _setupDone = true;
}

export const createAgent = (modelName = "openai/gpt-4o-mini") => {
  // Normalize model identifier for ChatOpenRouter
  const cleanModel = modelName.replace(/^openrouter:/, "");
  const chatModel = new ChatOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
    model: cleanModel,
    temperature: 0.7,
  });

  return createDeepAgent({
    name: "relie-deep-agent",
    model: chatModel,
    systemPrompt: systemPromt,
    checkpointer,
    store,
    // Strictly deny all write operations on the backend — agent only has read-only access to skills
    permissions: [
      {
        operations: ["write"],
        paths: ["/**"],
        mode: "deny",
      },
    ],
    backend,
    skills: ["/"],
    middleware: [
      todoListMiddleware(),
      modelRetryMiddleware({
        maxRetries: 3,
        backoffFactor: 2.0,
        initialDelayMs: 1000,
      }),
      toolRetryMiddleware({
        maxRetries: 2,
        tools: ["extract_assets", "image_generation"],
      }),
      modelCallLimitMiddleware({ runLimit: 50 }),
      toolCallLimitMiddleware({ runLimit: 150 }),
    ],
    tools: [
      ...fsTools,
      assetExtractionTool,
      imageGenerationTool,
      sandboxcodeprescreenshottool,
    ],
  });
};

export const agent = createAgent();
