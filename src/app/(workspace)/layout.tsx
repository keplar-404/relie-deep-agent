import "server-only";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) {
    redirect("/");
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background text-foreground">
      {children}
    </div>
  );
}
