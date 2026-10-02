"use server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema/user";

export default async function getUser(userID: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userID))
    .limit(1);

  if (!user) return null;
  return user;
}
