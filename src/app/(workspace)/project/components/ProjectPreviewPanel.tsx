"use client";

import { useCallback, useState } from "react";
import { RotateCwIcon, ExternalLinkIcon } from "lucide-react";
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewConsole,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
} from "@/components/ai-elements/web-preview";

export interface ProjectPreviewPanelProps {
  initialUrl?: string | null;
}

export function ProjectPreviewPanel({ initialUrl }: ProjectPreviewPanelProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [currentUrl, setCurrentUrl] = useState(initialUrl ?? "");

  const handleRefresh = useCallback(() => setIframeKey((k) => k + 1), []);

  if (!initialUrl) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-muted/10 p-8 text-center">
        <div className="size-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
        <div className="space-y-1">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            Provisioning Code Sandbox
          </p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Setting up your preview environment and installing dependencies...
          </p>
        </div>
      </div>
    );
  }

  return (
    <WebPreview
      className="h-full w-full rounded-none border-none"
      defaultUrl={initialUrl}
      onUrlChange={setCurrentUrl}
    >
      <WebPreviewNavigation>
        {/* Refresh */}
        <WebPreviewNavigationButton tooltip="Refresh preview" onClick={handleRefresh}>
          <RotateCwIcon className="size-3.5" />
          <span className="sr-only">Refresh preview</span>
        </WebPreviewNavigationButton>

        {/* Editable URL bar */}
        <WebPreviewUrl />

        {/* Open in new tab */}
        <WebPreviewNavigationButton
          tooltip="Open in new tab"
          onClick={() => window.open(currentUrl, "_blank", "noreferrer")}
        >
          <ExternalLinkIcon className="size-3.5" />
          <span className="sr-only">Open in new tab</span>
        </WebPreviewNavigationButton>
      </WebPreviewNavigation>

      {/* Live iframe — key triggers hard refresh */}
      <WebPreviewBody key={iframeKey} />

      {/* Collapsible console — ready for agent log injection */}
      <WebPreviewConsole />
    </WebPreview>
  );
}


