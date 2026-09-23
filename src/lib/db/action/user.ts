import { db } from "../drizzle";
import { users } from "../schema/user";
import { createUserSchema, type CreateUser } from "../validators";

export async function createUser(input: CreateUser) {
  const data = createUserSchema.parse(input);
  const [row] = await db.insert(users).values(data).returning();
  return row;
}