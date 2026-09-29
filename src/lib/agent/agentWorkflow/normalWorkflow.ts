import { createAgent, ensureCheckpointerReady } from "@/lib/agent";
import { routeModel, routeTools } from "@/lib/agent/agentRouter";

export interface NormalWorkflowInput {
  userMessage: string;
  fileUrls?: string[];
  projectId: string;
  sandBoxId: string;
}

export interface NormalWorkflowResult {
  response: string;
  model: string;
  tools: string[];
}

/**
 * Normal Agent Workflow:
 * Evaluates model and tool selection, appends routing directives and tool priority to user prompt,
 * and executes agent reasoning with the routed model tier.
 */
export async function normalWorkflow({
  userMessage,
  fileUrls = [],
  projectId,
  sandBoxId,
}: NormalWorkflowInput): Promise<NormalWorkflowResult> {
  await ensureCheckpointerReady();

  // 1. Parallel model & tool routing (<50ms)
  const [model, tools] = await Promise.all([
    routeModel(userMessage),
    routeTools(userMessage, fileUrls),
  ]);

  // 2. Append routing directives and tool priority instructions to user prompt
  const augmentedPrompt = [
    userMessage,
    "",
    "---",
    `[Routed Model Tier]: ${model}`,
    `[Priority Tools]: ${tools.length > 0 ? tools.join(", ") : "conversational (no tools required)"}`,
    "Execution Instructions: Prioritize using the priority tools listed above to complete this request. All tools in the registry remain accessible and you may utilize any other tools if needed.",
  ].join("\n");

  // 3. Assemble multimodal content if file URLs are attached
  const content =
    fileUrls.length > 0
      ? [
          { type: "text" as const, text: augmentedPrompt },
          ...fileUrls.map((url) => ({
            type: "image_url" as const,
            image_url: { url },
          })),
        ]
      : augmentedPrompt;

  // 4. Execute agent with the dynamic model resolved by routeModel
  const agent = createAgent(model);
  const result = await agent.invoke(
    { messages: [{ role: "user", content }] },
    { configurable: { thread_id: projectId, sandBoxId } },
  );

  const lastMsg = result.messages[result.messages.length - 1];
  const response =
    typeof lastMsg?.content === "string"
      ? lastMsg.content
      : JSON.stringify(lastMsg?.content ?? "");

  return { response, model, tools };
}

export default normalWorkflow;
