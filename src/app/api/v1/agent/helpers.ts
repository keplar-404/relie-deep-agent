import type { CreateLlmExecution } from "@/lib/db/action";
import type { RunWorkflowResult } from "@/lib/agent/agentWorkflow";

export function buildUserAttachments(fileUrls: string[]) {
  return fileUrls.map((url, i) => {
    const isImage =
      /\.(png|jpe?g|webp|gif|svg)$/i.test(url) || url.includes("/image");
    const name = url.split("/").pop()?.split("?")[0] || `file-${i + 1}`;
    return {
      id: crypto.randomUUID(),
      type: (isImage ? "image" : "file") as "image" | "file",
      name,
      url,
      mimeType: isImage ? "image/png" : "application/octet-stream",
      size: 0,
    };
  });
}

export function buildAssistantAttachments(
  screenshots: { label: string; url: string }[]
) {
  return screenshots.map((s) => ({
    id: crypto.randomUUID(),
    type: "image" as const,
    name: `${s.label}.png`,
    url: s.url,
    mimeType: "image/png",
    size: 0,
  }));
}

export function buildLlmExecutions(
  chatHistoryId: string,
  projectId: string,
  result: RunWorkflowResult
): CreateLlmExecution[] {
  const executions: CreateLlmExecution[] = [
    {
      chatHistoryId,
      projectId,
      sequence: 0,
      type: "workflow_routing",
      output: {
        workflow: result.workflow,
        model: result.model,
        tools: result.tools,
      },
    },
  ];

  if (result.workflow === "ship") {
    executions.push({
      chatHistoryId,
      projectId,
      sequence: 1,
      type: "visual_verification",
      output: {
        success: result.success,
        iterations: result.iterations,
        score: result.score,
        noul: result.noul,
        screenshots: result.screenshots,
      },
    });
  }

  return executions;
}
