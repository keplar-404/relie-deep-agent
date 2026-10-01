import { NextRequest } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { getProject } from "@/lib/db/action";
import { createChatMessage } from "@/lib/db/action/chatHistory";
import { createLlmExecutions } from "@/lib/db/action";
import { runWorkflow } from "@/lib/agent/agentWorkflow";
import {
  buildUserAttachments,
  buildAssistantAttachments,
  buildLlmExecutions,
  extractGeneratedImages,
} from "./helpers";

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
  model: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const userAttachments = buildUserAttachments(fileUrls);
    await createChatMessage({
      projectId,
      userId: user.id,
      role: "user",
      content: message,
      attachments: userAttachments,
    });

    const result = await runWorkflow({
      userMessage: message,
      fileUrls,
      projectId,
      sandBoxId: project.sandboxId,
    });

    const responseText =
      result.workflow === "ship" ? result.finalResponse : result.response;
    const screenshots = result.workflow === "ship" ? result.screenshots : [];

    const generatedImages = extractGeneratedImages(responseText);
    const assistantAttachments = buildAssistantAttachments(screenshots, generatedImages);
    const assistantMsg = await createChatMessage({
      projectId,
      userId: user.id,
      role: "assistant",
      content: responseText,
      attachments: assistantAttachments,
    });

    const executions = buildLlmExecutions(assistantMsg.id, projectId, result);
    await createLlmExecutions(executions);

    return Response.json({
      ok: true,
      workflow: result.workflow,
      model: result.model,
      tools: result.tools,
      response: responseText,
      screenshots,
      generatedImages,
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
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
