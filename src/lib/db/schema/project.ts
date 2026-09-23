import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./user";

export const projects = pgTable("projects", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  sandboxId: varchar({ length: 255 }),
  createdAt: timestamp().notNull().defaultNow(),
});