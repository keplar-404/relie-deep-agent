import { jev, choice, noul, score } from "./index";

export type WorkflowType = "ship" | "normal";

export interface WorkflowRouteResult {
  workflow: WorkflowType;
  confidence: number;
  requiresVisualVerification: boolean;
  reason: string;
  metrics: {
    noulUiChanges: number;
    scoreVisualNeed: number;
    choiceWorkflow: "ship" | "normal";
  };
}

/**
 * Evaluates whether an incoming user request requires the "ship" workflow
 * (autonomous visual QA loop with multi-viewport screenshot verification)
 * or the "normal" workflow (standard single-pass execution).
 *
 * Uses TypeSafe Jev System One (<40ms) to analyze semantic intent:
 * - Differentiates simple conversational questions ("how does this work?") from
 *   questions that demand live website changes ("can you change this button color?").
 * - Evaluates visual importance, layout impact, and presence of design attachments.
 */
export async function evaluateWorkflow(
  input: string,
  fileUrls: string[] = []
): Promise<WorkflowRouteResult> {
  const state: Record<string, string | string[]> = {
    user_request: input,
  };

  if (fileUrls.length > 0) {
    state.attached_file_links = fileUrls;
  }

  const res = await jev.systemOne({
    state,
    questions: {
      // 1. Does this request involve UI, visual, layout, or design changes on the website?
      requires_ui_changes: noul(
        "Does this user request require creating, modifying, restyling, refactoring, or fixing user-facing frontend UI components, web pages, layout, or visual design in the web application?",
        {
          true: "The user intends to create, edit, style, build, or fix frontend visual components, website layout, CSS/Tailwind styles, responsive breakpoints, or interactive UI elements on the live site (even if framed as a question like 'can you change X' or 'why is Y misaligned').",
          false: "The request is purely conversational, conceptual explanation, architecture inquiry, backend logic, non-visual utility function, or database discussion that does not modify the rendered frontend UI.",
        }
      ),

      // 2. Which workflow best fits this operational scope?
      workflow_choice: choice(
        "Which execution workflow best matches this user request?",
        {
          ship: "Ship Workflow: The user wants to build, redesign, restyle, or fix website UI components or pages where full-page responsive screenshot verification (desktop, laptop, tablet, mobile) is needed to guarantee visual correctness and catch layout bugs.",
          normal: "Normal Workflow: Standard single-pass execution for questions, code analysis, backend logic, non-visual utilities, git commands, or general programming queries requiring no multi-viewport visual verification loop.",
        }
      ),

      // 3. Degree of visual verification need
      visual_verification_need: score(
        "How necessary is multi-viewport responsive screenshot verification (desktop, laptop, tablet, mobile) for confirming this task was implemented accurately?",
        [
          "Unnecessary: No visual frontend changes; conversational response, backend code, or general coding question.",
          "Low: Minor non-visual edit or trivial text tweak where visual layout verification is optional.",
          "Essential: Component creation, page layout, CSS/Tailwind restyling, responsive fix, or design mockup implementation where visual verification is required to prevent visual regression.",
        ]
      ),
    },
  });

  const noulUiChanges = res.answers.requires_ui_changes.noul;
  const choiceWorkflow = res.answers.workflow_choice.choice as "ship" | "normal";
  const scoreVisualNeed = res.answers.visual_verification_need.score;
  const choiceConfidence = res.answers.workflow_choice.confidence;

  // Decision logic:
  // Route to "ship" if:
  // 1. Explicit choice is "ship", OR
  // 2. High probability of UI changes (>= 0.65) AND visual verification need >= 0.8, OR
  // 3. Design file attachments are present AND UI change probability >= 0.4
  const hasDesignFiles = fileUrls.length > 0;
  const isShip =
    choiceWorkflow === "ship" ||
    (noulUiChanges >= 0.65 && scoreVisualNeed >= 0.8) ||
    (hasDesignFiles && noulUiChanges >= 0.4);

  const workflow: WorkflowType = isShip ? "ship" : "normal";
  const requiresVisualVerification = isShip && scoreVisualNeed >= 0.8;

  let reason: string;
  if (isShip) {
    reason =
      hasDesignFiles
        ? "Attached design assets detected with UI modification intent; requires responsive visual verification."
        : "Frontend visual/layout modification detected; requires responsive multi-viewport screenshot verification loop.";
  } else {
    reason =
      "Request does not require frontend visual layout changes; routing to standard single-pass workflow.";
  }

  return {
    workflow,
    confidence: choiceConfidence,
    requiresVisualVerification,
    reason,
    metrics: {
      noulUiChanges,
      scoreVisualNeed,
      choiceWorkflow,
    },
  };
}

/**
 * Fast Workflow Router:
 * Returns "ship" or "normal" based on TypeSafe Jev System One evaluation (<40ms).
 *
 * @param input The user prompt or task description.
 * @param fileUrls Optional attached files/images URLs.
 * @returns "ship" | "normal"
 */
export async function routeWorkflow(
  input: string,
  fileUrls: string[] = []
): Promise<WorkflowType> {
  const result = await evaluateWorkflow(input, fileUrls);
  return result.workflow;
}

export const workflowSelection = routeWorkflow;
export default routeWorkflow;
