"use client";

import { useState } from "react";
import { EyeIcon, LayersIcon, RotateCwIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComponentGallery } from "./ComponentGallery";

export interface ProjectPreviewPanelProps {
  initialUrl?: string | null;
}

export function ProjectPreviewPanel({ initialUrl }: ProjectPreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "flow">("flow");
  const [iframeKey, setIframeKey] = useState(0);

  const displayUrl = initialUrl || "http://localhost:3000";

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-hidden">
      {/* Top Bar matching reference repo */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 px-3 bg-muted/20">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Workspace View
        </span>

        <div className="flex items-center gap-2">
          {activeTab === "preview" && initialUrl && (
            <div className="hidden lg:flex items-center h-6 px-2 text-[11px] text-muted-foreground bg-background rounded-md border border-border/40 truncate max-w-xs font-mono">
              {displayUrl}
            </div>
          )}

          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border/40">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === "preview"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <EyeIcon className="size-3.5" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("flow")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === "flow"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayersIcon className="size-3.5" />
              <span>Flow</span>
            </button>
          </div>

          {activeTab === "preview" && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIframeKey((k) => k + 1)}
                className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Refresh preview"
              >
                <RotateCwIcon className="size-3" />
                <span className="sr-only">Refresh preview</span>
              </Button>
              {initialUrl && (
                <a
                  href={initialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLinkIcon className="size-3" />
                  <span className="sr-only">Open in new tab</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "preview" ? (
          initialUrl ? (
            <iframe
              key={iframeKey}
              src={initialUrl}
              title="Sandbox Preview"
              className="h-full w-full border-none bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-muted/10 p-8 text-center animate-fade-in duration-300">
              <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              <div className="space-y-1">
                <p className="text-sm font-semibold tracking-tight text-foreground">
                  Provisioning Code Sandbox
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Setting up your preview environment and installing dependencies...
                </p>
              </div>
            </div>
          )
        ) : (
          <ComponentGallery />
        )}
      </div>
    </div>
  );
}
