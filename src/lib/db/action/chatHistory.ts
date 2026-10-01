import { and, eq, asc } from "drizzle-orm";
import { db } from "../drizzle";
import { chatHistory } from "../schema/chatHistory";
import { llmExecutions } from "../schema/llmExecution";
import { createChatHistorySchema, type CreateChatHistory } from "../validators";

export async function createChatMessage(input: CreateChatHistory) {
  const data = createChatHistorySchema.parse(input);
  const [row] = await db.insert(chatHistory).values(data).returning();
  return row;
}

export async function getChatMessages(projectId: string, userId: string) {
  const messages = await db
    .select()
    .from(chatHistory)
    .where(and(eq(chatHistory.projectId, projectId), eq(chatHistory.userId, userId)))
    .orderBy(asc(chatHistory.createdAt));

  if (!messages.length) return [];

  const executions = await db
    .select()
    .from(llmExecutions)
    .where(eq(llmExecutions.projectId, projectId))
    .orderBy(asc(llmExecutions.sequence));

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

