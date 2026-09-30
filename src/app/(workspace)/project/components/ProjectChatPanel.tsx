"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, SparklesIcon } from "lucide-react";
import { ModeToggle } from "@/app/(app)/components/ModeToggle";
import { PromptBar } from "@/components/PromptBar";

const SUGGESTIONS = [
  "Analyze API performance and optimize bottlenecks",
  "Implement Redis cache layer for slow routes",
  "Audit endpoint latencies and database queries",
  "Run the automated test suite and benchmarks",
];

interface ProjectChatPanelProps {
  projectName?: string;
}

export function ProjectChatPanel({ projectName }: ProjectChatPanelProps) {
  const [input, setInput] = useState("");

  const handleSend = (text: string, attachments?: unknown) => {
    if (!text.trim() && (!Array.isArray(attachments) || attachments.length === 0)) return;
    setInput("");
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      {/* Chat Header matching reference repo */}
      <header className="flex h-12 shrink-0 items-center justify-between px-3 border-b border-border/40 bg-card/40">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/projects"
            className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
            title="Back to Projects"
          >
            <ChevronLeftIcon className="size-4" />
          </Link>
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <SparklesIcon className="size-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-foreground leading-tight truncate">
              {projectName || "Relie AI Agent"}
            </span>
            <span className="text-[10px] text-muted-foreground">AI Assistant</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ModeToggle />
        </div>
      </header>

      {/* Messages / Welcome View */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-end gap-4">
        <div className="flex flex-col items-center text-center max-w-sm mx-auto mb-auto pt-8">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 shadow-xs">
            <SparklesIcon className="size-5" />
          </div>
          <h2 className="text-sm font-semibold text-foreground mb-1">
            Deep Agent Workspace
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            I can inspect your codebase, edit components, run benchmarks in the live sandbox, and automate complex engineering workflows.
          </p>
        </div>

        {/* Quick starter suggestions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto w-full mb-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setInput(suggestion)}
              className="text-left p-2.5 rounded-lg border border-border/50 bg-card/60 hover:bg-card hover:border-border transition-colors text-[11px] text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Footer using PromptBar */}
      <footer className="p-3 border-t border-border/40 bg-background/95">
        <PromptBar
          value={input}
          onValueChange={setInput}
          onSend={handleSend}
          placeholder="Ask Relie AI to inspect code, run benchmarks, or optimize services…"
        />
      </footer>
    </div>
  );
}
