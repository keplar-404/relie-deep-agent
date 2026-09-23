import "server-only";
import { currentUser } from "@/lib/auth";

/**
 * Protected app layout. Runs for every route under (app)/*.
 *
 * proxy.ts has already redirected unauth'd visitors to /sign-in,
 * so by the time this renders, Clerk has a valid session.
 *
 * `await currentUser()` is the lazy sync from Clerk → users table.
 * First request per Clerk user: INSERT (one round-trip to Clerk + one INSERT).
 * Subsequent requests: a single SELECT.
 *
 * After this returns, child pages / actions can call `requireUser()` and
 * use `user.id` (UUID) as a foreign key for projects, chat_history, etc.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await currentUser();
  return children;
}