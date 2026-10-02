import { db } from "../drizzle";
import toolCallHistorySchema from "../schema/toolCallHistorySchema";
import {
  createLlmExecutionSchema,
  type CreateLlmExecution,
} from "../validators";

export async function createLlmExecution(input: CreateLlmExecution) {
  const data = createLlmExecutionSchema.parse(input);
  const [row] = await db.insert(toolCallHistorySchema).values(data).returning();
  return row;
}

export async function createLlmExecutions(inputs: CreateLlmExecution[]) {
  if (!inputs.length) return [];
  const data = inputs.map((i) => createLlmExecutionSchema.parse(i));
  return db.insert(toolCallHistorySchema).values(data).returning();
}
