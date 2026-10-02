import { and, eq, asc } from "drizzle-orm";
import { db } from "../drizzle";
import chatHistorySchema from "../schema/chatHistorySchema";
import toolCallHistorySchema from "../schema/toolCallHistorySchema";
import { createChatHistorySchema, type CreateChatHistory } from "../validators";

export async function createChatMessage(input: CreateChatHistory) {
  const data = createChatHistorySchema.parse(input);
  const [row] = await db.insert(chatHistorySchema).values(data).returning();
  return row;
}

export async function getChatMessages(projectId: string, userId: string) {
  const messages = await db
    .select()
    .from(chatHistorySchema)
    .where(
      and(
        eq(chatHistorySchema.projectId, projectId),
        eq(chatHistorySchema.userId, userId),
      ),
    )
    .orderBy(asc(chatHistorySchema.createdAt));

  if (!messages.length) return [];

  const executions = await db
    .select()
    .from(toolCallHistorySchema)
    .where(eq(toolCallHistorySchema.projectId, projectId))
    .orderBy(asc(toolCallHistorySchema.sequence));

  const executionsByChatId = new Map<string, typeof executions>();
  for (const exec of executions) {
    const list = executionsByChatId.get(exec.chatHistoryId) || [];
    list.push(exec);
    executionsByChatId.set(exec.chatHistoryId, list);
  }

  return messages.map((m) => {
    const execs = executionsByChatId.get(m.id) || [];
    const routing = execs.find((e) => e.type === "workflow_routing");
    const visual = execs.find((e) => e.type === "visual_verification");
    const routingOutput = (routing?.output as Record<string, unknown>) || {};
    const visualOutput = (visual?.output as Record<string, unknown>) || {};

    return {
      ...m,
      model: (routingOutput.model as string) || undefined,
      workflow: (routingOutput.workflow as string) || undefined,
      tools: (routingOutput.tools as string[]) || [],
      screenshots: (visualOutput.screenshots as unknown[]) || [],
      executions: execs,
    };
  });
}
