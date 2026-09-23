import "server-only";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema/user";

/**
 * Resolves the current Clerk session into your internal `users` table.
 *
 * - Returns `null` when no one is signed in.
 * - On first request per Clerk user, lazily mirrors their profile into `users`
 *   using `clerkId` as the lookup key. Subsequent requests are a single SELECT.
 *
 * After this returns, `user.id` (your UUID) is safe to use as a foreign key
 * for projects, chat_history, llm_executions, etc.
 */
export async function currentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (existing) return existing;

  const { clerkClient } = await import("@clerk/nextjs/server");
  const profile = await (await clerkClient()).users.getUser(clerkId);
  const name =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.username ||
    "User";

  const [created] = await db
    .insert(users)
    .values({
      clerkId,
      email: profile.primaryEmailAddress?.emailAddress ?? "",
      name,
      image: profile.imageUrl,
    })
    .returning();

  return created;
}