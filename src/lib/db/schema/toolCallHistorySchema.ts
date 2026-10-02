import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import projectSchema from "./projectSchema";
import chatHistorySchema from "./chatHistorySchema";

const toolCallHistorySchema = pgTable("llm_executions", {
  id: uuid().primaryKey().defaultRandom(),
  chatHistoryId: uuid()
    .notNull()
    .references(() => chatHistorySchema.id, { onDelete: "cascade" }),
  projectId: uuid()
    .notNull()
    .references(() => projectSchema.id, { onDelete: "cascade" }),
  sequence: integer().notNull(),
  type: varchar({ length: 255 }).notNull(),
  toolName: varchar({ length: 255 }),
  input: jsonb(),
  output: jsonb(),
  attachments: jsonb(),
  createdAt: timestamp().notNull().defaultNow(),
});

export default toolCallHistorySchema;
