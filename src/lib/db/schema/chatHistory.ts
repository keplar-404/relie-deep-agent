import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import type { Attachment } from "../validators";
import { users } from "./user";
import { projects } from "./project";

export const chatRole = pgEnum("chat_role", [
  "system",
  "user",
  "assistant",
  "tool",
]);

export const chatHistory = pgTable("chat_history", {
  id: uuid().primaryKey().defaultRandom(),
  projectId: uuid()
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: chatRole().notNull(),
  content: text(),
  attachments: jsonb("attachments")
    .$type<Attachment[]>()
    .default([])
    .notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});