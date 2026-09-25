import { jev, choice, score } from "./index";

export type TaskType = "write_code" | "review_code" | "normal_chat";

export interface ModelRoute {
  model: string;
  taskType: TaskType;
  complexityScore: number;
}

// OpenRouter model tiers with native Vision & Tool-Calling capabilities
const MODELS = {
  light: "openrouter:google/gemini-2.0-flash-001",
  standard: "openrouter:openai/gpt-4o-mini",
  flagship: "openrouter:anthropic/claude-3.7-sonnet",
} as const;

export async function routeModel(input: string): Promise<string> {
  const res = await jev.systemOne({
    state: { user_message: input },
    questions: {
      task_type: choice("What is the primary nature of this request?", {
        write_code: "Writing, generating, or modifying code or files",
        review_code: "Reviewing, inspecting, auditing, or explaining existing code or any attached files",
        normal_chat: "General conversation, conceptual explanation, or greeting",
      }),
      complexity: score("How complex, architecturally involved, or difficult is this request?", [
        "Trivial: Conversational greeting or simple question needing no code editing",
        "Simple: Minor one-line snippet, basic syntax fix, or quick review",
        "Moderate: Building a standard UI component, form, state hook, or reviewing a module",
        "Complex: Multi-file architecture, full database/auth feature, or deep refactoring",
      ]),
    },
  });

  const taskType = res.answers.task_type.choice as TaskType;
  const complexityScore = res.answers.complexity.score;

  let model: string;

  if (taskType === "normal_chat") {
    model = complexityScore >= 2.5
      ? MODELS.flagship
      : MODELS.light;
  } else {
    model = complexityScore >= 2.0
      ? MODELS.flagship
      : complexityScore < 0.8
        ? MODELS.light
        : MODELS.standard;
  }

  return model;
}

export default routeModel;
