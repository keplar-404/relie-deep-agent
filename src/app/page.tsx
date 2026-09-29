import { HomeHeader } from "@/app/_components/home-header";
import { ZapIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      <HomeHeader />
      <main className="flex flex-1 flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full text-center sm:text-left">
        <div className="flex flex-col gap-6 items-center sm:items-start w-full">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/60 text-xs font-medium text-muted-foreground">
            <ZapIcon className="size-3.5 text-amber-500" />
            <span>Relie AI Agent</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight max-w-xl">
            AI Agent for your Shopify Store
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg">
            Automate store actions, manage inventory, execute deep workflows, and monitor operations seamlessly.
          </p>
        </div>
      </main>
    </div>
  );
}
