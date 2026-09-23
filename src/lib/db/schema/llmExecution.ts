import { pgTable, uuid, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./user";
import { projects } from "./project";
import { chatHistory } from "./chatHistory";

export const llmExecutions = pgTable("llm_executions", {
  id: uuid().primaryKey().defaultRandom(),
  chatHistoryId: uuid()
    .notNull()
    .references(() => chatHistory.id, { onDelete: "cascade" }),
  projectId: uuid()
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  sequence: integer().notNull(),
  type: varchar({ length: 255 }).notNull(),
  toolName: varchar({ length: 255 }),
  input: jsonb(),
  output: jsonb(),
  attachments: jsonb(),
  createdAt: timestamp().notNull().defaultNow(),
});