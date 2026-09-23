import { db } from "../drizzle";
import { chatHistory } from "../schema/chatHistory";
import {
  createChatHistorySchema,
  type CreateChatHistory,
} from "../validators";

export async function createChatMessage(input: CreateChatHistory) {
  const data = createChatHistorySchema.parse(input);
  const [row] = await db.insert(chatHistory).values(data).returning();
  return row;
}