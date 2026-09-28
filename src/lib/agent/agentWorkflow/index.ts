import { routeWorkflow } from "@/lib/agent/agentRouter";
import {
  normalWorkflow,
  NormalWorkflowResult,
} from "./normalWorkflow";
import {
  shipWorkflow,
  ShipWorkflowInput,
  ShipWorkflowResult,
} from "./shipWorkflow";

export type RunWorkflowInput = ShipWorkflowInput;
export type RunWorkflowResult =
  | ({ workflow: "ship" } & ShipWorkflowResult)
  | ({ workflow: "normal" } & NormalWorkflowResult);

/**
 * Automatically routes and executes the best workflow ("ship" vs "normal")
 * using TypeSafe Jev System One (<40ms).
 */
export async function runWorkflow(
  input: RunWorkflowInput
): Promise<RunWorkflowResult> {
  const selected = await routeWorkflow(input.userMessage, input.fileUrls);

  if (selected === "ship") {
    const res = await shipWorkflow(input);
    return { workflow: "ship", ...res };
  }

  const res = await normalWorkflow(input);
  return { workflow: "normal", ...res };
}

export * from "./normalWorkflow";
export * from "./shipWorkflow";
