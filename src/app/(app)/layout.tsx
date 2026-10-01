import "server-only";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Agentation } from "agentation";

/**
 * Protected app layout — wraps every route under (app)/
 *
 * - Protects all internal app routes: unauthenticated users redirect to "/"
 * - Syncs authenticated Clerk user with internal database
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
       {process.env.NODE_ENV === "development" && <Agentation />}
    </div>
  );
}