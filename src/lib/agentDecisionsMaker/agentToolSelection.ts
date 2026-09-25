import { fsTools } from "@/lib/agent/tools/fsOperations";
import { assetExtractionTool } from "@/lib/agent/tools/assetExtraction";
import { jev, score } from "./index";

const allTools = [...fsTools, assetExtractionTool];

function getToolSummary(description: string): string {
  const line = description.split("\n").find((l) => l.includes("What it does:"));
  return line ? line.replace("What it does:", "").trim() : description.split("\n")[0];
}

// Score levels: 0 = Not needed, 1 = Useful, 2 = Essential
// Questions are static schema; state is injected per-call at runtime.
const toolQuestions = Object.fromEntries(
  allTools.map((t) => [
    t.name,
    score(
      `How relevant and necessary is tool "${t.name}" for completing this task? Purpose: ${getToolSummary(t.description)}`,
      [
        "Not needed: Unrelated or unnecessary for this request",
        "Useful: Supporting, reading, or exploratory step",
        "Essential: Directly required to complete this task",
      ]
    ),
  ])
);

/**
 * Evaluates all tools against the given task text (and optional file links)
 * using TypeSafe Jev, and returns tool names that score >= 1.2 (Useful and Essential).
 */
export async function agentToolSelection(
  text: string,
  fileUrls: string[] = []
): Promise<string[]> {
  const state: Record<string, string | string[]> = { user_message: text };
  if (fileUrls.length > 0) state.file_links = fileUrls;

  const res = await jev.systemOne({ state, questions: toolQuestions });

  // Threshold >= 1.2 captures all relevant Useful and Essential tools
  return Object.entries(res.answers)
    .filter(([, ans]) => (ans as { score: number }).score >= 1.2)
    .sort((a, b) => (b[1] as { score: number }).score - (a[1] as { score: number }).score)
    .map(([name]) => name);
}

export default agentToolSelection;
