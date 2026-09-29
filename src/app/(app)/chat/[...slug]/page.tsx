"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function ChatPage() {
  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
      {/* Left Panel */}
      <ResizablePanel
        defaultSize="40%"
        minSize="20%"
        maxSize="60%"
        className="flex flex-col h-full bg-background border-r border-border"
      >
        <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
          Left Side
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle className="after:w-4" />

      {/* Right Panel */}
      <ResizablePanel className="flex flex-col h-full bg-background">
        <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
          Right Side
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
