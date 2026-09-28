import { NextRequest } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { getProject } from "@/lib/db/action";
import { createChatMessage } from "@/lib/db/action/chatHistory";
import {
  createLlmExecutions,
  type CreateLlmExecution,
} from "@/lib/db/action";
import { runWorkflow } from "@/lib/agent/agentWorkflow";

const bodySchema = z.object({
  projectId: z.uuid("Invalid project ID format (UUID expected)"),
  message: z
    .string()
    .trim()
    .min(1, "User query cannot be empty")
    .max(100_000, "User query exceeds character limit"),
  fileUrls: z
    .array(
      z
        .url("Invalid URL format")
        .refine(
          (url) => url.startsWith("https://") || url.startsWith("http://"),
          "File URL must use https or http protocol"
        )
    )
    .max(20, "Maximum of 20 file attachments allowed")
    .optional()
    .default([]),
});

export async function POST(req: NextRequest) {
  // 1. Single-gate authentication at the API boundary
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Validate request payload: message and attached file URLs
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return Response.json({ error: "Malformed or empty JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { projectId, message, fileUrls } = parsed.data;

  // 3. Single DB lookup: verify project ownership and retrieve Daytona sandbox ID
  const project = await getProject(projectId, user.id);
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.sandboxId) {
    return Response.json(
      { error: "Project has no active sandbox" },
      { status: 400 }
    );
  }

  try {
    // 4. Save user message to chat history
    const userAttachments = fileUrls.map((url, i) => {
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

    await createChatMessage({
      projectId,
      userId: user.id,
      role: "user",
      content: message,
      attachments: userAttachments,
    });

    // 5. Execute workflow selection router (TypeSafe Jev: "ship" vs "normal")
    const result = await runWorkflow({
      userMessage: message,
      fileUrls,
      projectId,
      sandBoxId: project.sandboxId,
    });

    const responseText =
      result.workflow === "ship" ? result.finalResponse : result.response;

    const screenshots = result.workflow === "ship" ? result.screenshots : [];

    // 6. Save assistant response to chat history
    const assistantAttachments = screenshots.map((s) => ({
      id: crypto.randomUUID(),
      type: "image" as const,
      name: `${s.label}.png`,
      url: s.url,
      mimeType: "image/png",
      size: 0,
    }));

    const assistantMsg = await createChatMessage({
      projectId,
      userId: user.id,
      role: "assistant",
      content: responseText,
      attachments: assistantAttachments,
    });

    // 7. Record LLM execution traces linked to the assistant message
    const executions: CreateLlmExecution[] = [
      {
        chatHistoryId: assistantMsg.id,
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
        chatHistoryId: assistantMsg.id,
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

    await createLlmExecutions(executions);

    // 8. Return response
    return Response.json({
      ok: true,
      workflow: result.workflow,
      model: result.model,
      tools: result.tools,
      response: responseText,
      screenshots,
      ...(result.workflow === "ship"
        ? {
            success: result.success,
            iterations: result.iterations,
            score: result.score,
            noul: result.noul,
          }
        : {}),
    });
  } catch (error) {
    console.error("[POST /api/v1/agent error]:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
