import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Agentation } from "agentation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
