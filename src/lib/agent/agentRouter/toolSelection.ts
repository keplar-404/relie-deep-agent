import { fsTools } from "@/lib/agent/tools/fsOperations";
import { assetExtractionTool } from "@/lib/agent/tools/assetExtraction";
import { sandboxcodeprescreenshottool } from "@/lib/agent/tools/sandboxcodeprescreenshottool";
import { jev, score } from "./index";

const allTools = [
  ...fsTools,
  assetExtractionTool,
  sandboxcodeprescreenshottool,
];

function getToolSummary(description: string): string {
  const line = description.split("\n").find((l) => l.includes("What it does:"));
  return line
    ? line.replace("What it does:", "").trim()
    : description.split("\n")[0];
}

// Score questions for all tools: 0 = Not needed, 1 = Useful, 2 = Essential
const toolQuestions = Object.fromEntries(
  allTools.map((t) => [
    t.name,
    score(
      `How relevant and necessary is tool "${t.name}" for completing this task? Purpose: ${getToolSummary(t.description)}`,
      [
        "Not needed: Unrelated or unnecessary for this request",
        "Useful: Supporting, reading, or exploratory step",
        "Essential: Directly required to complete this task",
      ],
    ),
  ]),
);

/**
 * Evaluates and selects the required tools for an incoming user task.
 * Evaluates all 17 agent tools in a single parallel TypeSafe System One call.
 *
 * @param input The user prompt or task description.
 * @param fileUrls Optional attached files/image URLs.
 * @returns Array of selected tool names sorted by relevance score in descending order.
 */
export async function routeTools(
  input: string,
  fileUrls: string[] = [],
): Promise<string[]> {
  const state: Record<string, string | string[]> = { user_message: input };
  if (fileUrls.length > 0) {
    state.file_links = fileUrls;
  }

  const res = await jev.systemOne({
    state,
    questions: toolQuestions,
  });

  return Object.entries(res.answers)
    .filter(([, ans]) => (ans as { score: number }).score >= 1.2)
    .sort(
      (a, b) =>
        (b[1] as { score: number }).score - (a[1] as { score: number }).score,
    )
    .map(([name]) => name);
}

export const toolSelection = routeTools;
export const agentToolSelection = routeTools;
export default routeTools;
