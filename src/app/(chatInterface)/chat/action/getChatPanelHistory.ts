"use server";

import { db } from "@/lib/db/drizzle";
import chatHistory from "@/lib/db/schema/chatHistorySchema";
import toolCallHistory from "@/lib/db/schema/toolCallHistorySchema";
import { and, eq, asc, lt } from "drizzle-orm";

export default async function getChatPanelHistory(
  userId: string,
  projectId: string,
  limit = 30,
  beforeId?: string
) {
  let cursorDate: Date | undefined;

  if (beforeId) {
    const [cursor] = await db
      .select({ createdAt: chatHistory.createdAt })
      .from(chatHistory)
      .where(eq(chatHistory.id, beforeId))
      .limit(1);

    cursorDate = cursor?.createdAt;
  }

  const messages = await db
    .select()
    .from(chatHistory)
    .where(
      and(
        eq(chatHistory.userId, userId),
        eq(chatHistory.projectId, projectId),
        cursorDate ? lt(chatHistory.createdAt, cursorDate) : undefined
      )
    )
    .orderBy(asc(chatHistory.createdAt))
    .limit(limit);

  if (!messages.length) {
    return { messages: [], hasMore: false };
  }

  const messageIds = messages.map((m) => m.id);

  const toolCalls = await db
    .select()
    .from(toolCallHistory)
    .where(eq(toolCallHistory.projectId, projectId))
    .orderBy(asc(toolCallHistory.sequence));

  const toolCallsByMessageId = new Map<string, typeof toolCalls>();
  for (const toolCall of toolCalls) {
    if (!messageIds.includes(toolCall.chatHistoryId)) continue;
    const list = toolCallsByMessageId.get(toolCall.chatHistoryId) ?? [];
    list.push(toolCall);
    toolCallsByMessageId.set(toolCall.chatHistoryId, list);
  }

  const enriched = messages.map((message) => {
    const messagetoolCalls = toolCallsByMessageId.get(message.id) ?? [];
    const routing = messagetoolCalls.find((t) => t.type === "workflow_routing");
    const visual = messagetoolCalls.find((t) => t.type === "visual_verification");
    const routingOutput = (routing?.output as Record<string, unknown>) ?? {};
    const visualOutput = (visual?.output as Record<string, unknown>) ?? {};

    return {
      id: message.id,
      role: message.role,
      content: message.content ?? "",
      attachments: message.attachments,
      createdAt: message.createdAt,
      model: routingOutput.model as string | undefined,
      workflow: routingOutput.workflow as string | undefined,
      tools: (routingOutput.tools as string[] | undefined) ?? [],
      screenshots: (visualOutput.screenshots as unknown[] | undefined) ?? [],
      generatedImages: (visualOutput.generatedImages as unknown[] | undefined) ?? [],
      toolCalls: messagetoolCalls,
    };
  });

  return {
    messages: enriched,
    hasMore: messages.length === limit,
    oldestId: messages[0]?.id,
  };
}
