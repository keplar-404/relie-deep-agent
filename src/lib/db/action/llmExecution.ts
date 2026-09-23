import { db } from "../drizzle";
import { llmExecutions } from "../schema/llmExecution";
import {
  createLlmExecutionSchema,
  type CreateLlmExecution,
} from "../validators";

export async function createLlmExecution(input: CreateLlmExecution) {
  const data = createLlmExecutionSchema.parse(input);
  const [row] = await db.insert(llmExecutions).values(data).returning();
  return row;
}

export async function createLlmExecutions(inputs: CreateLlmExecution[]) {
  if (!inputs.length) return [];
  const data = inputs.map((i) => createLlmExecutionSchema.parse(i));
  return db.insert(llmExecutions).values(data).returning();
}