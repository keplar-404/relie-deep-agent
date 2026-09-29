import { createAgent, ensureCheckpointerReady } from "@/lib/agent";
import {
  routeModel,
  routeTools,
  jev,
  noul,
  score,
} from "@/lib/agent/agentRouter";
import {
  captureResponsiveScreenshots,
  ScreenshotResult,
} from "@/lib/sandbox/captureResponsiveScreenshots";

export interface ShipWorkflowInput {
  userMessage: string;
  fileUrls?: string[];
  projectId: string;
  sandBoxId: string;
  targetUrl?: string;
  maxAttempts?: number;
}

export interface ShipWorkflowResult {
  success: boolean;
  iterations: number;
  model: string;
  tools: string[];
  screenshots: ScreenshotResult[];
  finalResponse: string;
  noul: number;
  score: number;
}

/**
 * Ship Feature Workflow:
 * 1. Resolves model and tool selection via TypeSafe AI.
 * 2. Appends routing metadata and tool priority to user prompt and invokes main agent with the routed model.
 * 3. Captures full-page responsive screenshots (desktop, laptop, tablet, mobile).
 * 4. Runs TypeSafe Jev System One visual verification against user requirements.
 * 5. If incomplete, loops back to agent with visual feedback (max 4 attempts to save cost).
 */
export async function shipWorkflow({
  userMessage,
  fileUrls = [],
  projectId,
  sandBoxId,
  targetUrl = "http://localhost:3000",
  maxAttempts = 4,
}: ShipWorkflowInput): Promise<ShipWorkflowResult> {
  await ensureCheckpointerReady();

  // 1. Initial TypeSafe routing (<50ms)
  const [model, tools] = await Promise.all([
    routeModel(userMessage),
    routeTools(userMessage, fileUrls),
  ]);

  const agent = createAgent(model);

  // 2. Append routing directives and tool priority instructions to user prompt
  const initialPrompt = [
    userMessage,
    "",
    "---",
    `[Routed Model Tier]: ${model}`,
    `[Priority Tools]: ${tools.length > 0 ? tools.join(", ") : "conversational (no tools required)"}`,
    "Execution Instructions: Prioritize using the priority tools listed above to complete this request. All tools in the registry remain accessible and you may utilize any other tools if needed.",
  ].join("\n");

  const initialContent =
    fileUrls.length > 0
      ? [
          { type: "text" as const, text: initialPrompt },
          ...fileUrls.map((url) => ({
            type: "image_url" as const,
            image_url: { url },
          })),
        ]
      : initialPrompt;

  // 3. First agent execution pass (implements/updates the website)
  const firstPass = await agent.invoke(
    { messages: [{ role: "user", content: initialContent }] },
    { configurable: { thread_id: projectId, sandBoxId } },
  );

  let lastMsg = firstPass.messages[firstPass.messages.length - 1];
  let finalResponse =
    typeof lastMsg?.content === "string"
      ? lastMsg.content
      : JSON.stringify(lastMsg?.content ?? "");

  let currentScreenshots: ScreenshotResult[] = [];
  let latestNoul = 0;
  let latestScore = 0;
  let iteration = 0;

  // 4. Visual Verification & Refinement Loop (max 4 iterations)
  for (iteration = 1; iteration <= maxAttempts; iteration++) {
    // Capture responsive screenshots across desktop, laptop, tablet, and mobile
    currentScreenshots = await captureResponsiveScreenshots({
      sandBoxId,
      url: targetUrl,
    });

    const shotMap = Object.fromEntries(
      currentScreenshots.map((s) => [s.label, s.url]),
    );

    // TypeSafe Jev System One visual verification (<40ms)
    const verification = await jev.systemOne({
      state: {
        user_request: userMessage,
        desktop_screenshot: shotMap.desktop || "",
        laptop_screenshot: shotMap.laptop || "",
        tablet_screenshot: shotMap.tablet || "",
        mobile_screenshot: shotMap.mobile || "",
        file_links: currentScreenshots.map((s) => s.url),
      },
      questions: {
        is_complete: noul(
          "Based on the captured responsive screenshots, has the user's requested website work been completely and correctly implemented with no visual or layout defects?",
          {
            true: "The website completely fulfills the user's request across all responsive viewports with no broken layout, missing elements, or errors",
            false:
              "The website is incomplete, missing requested features, or has layout/responsive bugs",
          },
        ),
        completion_score: score(
          "How thoroughly does the rendered website match the user's request across all responsive viewports?",
          [
            "Incomplete: Missing key components or significantly broken",
            "Partially complete: Main structure exists but features or styles need adjustment",
            "Fully complete: Completely satisfies user request with clean responsive styling",
          ],
        ),
      },
    });

    latestNoul = verification.answers.is_complete.noul;
    latestScore = verification.answers.completion_score.score;

    // Verified complete: matches user query, exit early without taking redundant screenshots
    if (latestNoul >= 0.8 || latestScore >= 1.6) {
      return {
        success: true,
        iterations: iteration,
        model,
        tools,
        screenshots: currentScreenshots,
        finalResponse,
        noul: latestNoul,
        score: latestScore,
      };
    }

    // If not complete and we have attempts remaining, instruct agent to fix the site
    if (iteration < maxAttempts) {
      const feedbackPrompt = [
        "Visual verification detected that the website is not yet fully completed or has responsive/layout defects.",
        `Verification Confidence: ${(latestNoul * 100).toFixed(1)}% | Quality Score: ${latestScore.toFixed(2)}/2.0`,
        "",
        "Captured Responsive Screenshots:",
        `- Desktop (1920x1080): ${shotMap.desktop || "N/A"}`,
        `- Laptop (1440x900): ${shotMap.laptop || "N/A"}`,
        `- Tablet (820x1180): ${shotMap.tablet || "N/A"}`,
        `- Mobile (390x844): ${shotMap.mobile || "N/A"}`,
        "",
        `Original User Request: "${userMessage}"`,
        "Please inspect the screenshots, locate what is missing or broken on the page, and immediately use your filesystem tools to fix and complete the code.",
      ].join("\n");

      const feedbackContent = [
        { type: "text" as const, text: feedbackPrompt },
        ...currentScreenshots.map((s) => ({
          type: "image_url" as const,
          image_url: { url: s.url },
        })),
      ];

      const fixResult = await agent.invoke(
        { messages: [{ role: "user", content: feedbackContent }] },
        { configurable: { thread_id: projectId, sandBoxId } },
      );

      lastMsg = fixResult.messages[fixResult.messages.length - 1];
      finalResponse =
        typeof lastMsg?.content === "string"
          ? lastMsg.content
          : JSON.stringify(lastMsg?.content ?? "");
    }
  }

  return {
    success: latestNoul >= 0.8,
    iterations: maxAttempts,
    model,
    tools,
    screenshots: currentScreenshots,
    finalResponse,
    noul: latestNoul,
    score: latestScore,
  };
}

export default shipWorkflow;
