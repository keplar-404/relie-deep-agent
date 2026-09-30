"use client";

import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { ModeToggle } from "@/app/(app)/components/ModeToggle";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Top Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3 bg-background">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary cursor-pointer"
          >
            <ChevronLeftIcon className="size-3.5" />
            <span>Dashboard</span>
          </Link>
          <span className="text-muted-foreground/40 text-xs">/</span>
          <span className="text-xs font-medium">Chat Workspace</span>
        </div>
        <ModeToggle />
      </header>

      <ResizablePanelGroup orientation="horizontal" className="flex-1 w-full">
        {/* Left Panel */}
        <ResizablePanel
          defaultSize={40}
          minSize={20}
          maxSize={60}
          className="flex flex-col h-full bg-background border-r border-border"
        >
          <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
            Chat & Prompt Interface
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="after:w-4" />

        {/* Right Panel */}
        <ResizablePanel className="flex flex-col h-full bg-background">
          <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
            Live Sandbox Preview
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
