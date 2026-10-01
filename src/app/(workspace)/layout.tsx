import "server-only";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Agentation } from "agentation";

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
       {process.env.NODE_ENV === "development" && <Agentation />}
    </div>
  );
}
