"use client";

import { use, useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ProjectChatPanel } from "../components/ProjectChatPanel";
import { ProjectPreviewPanel } from "../components/ProjectPreviewPanel";

interface ProjectData {
  id: string;
  name: string;
  daytonaSandboxId?: string | null;
  daytonaPreviewUrl?: string | null;
}

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = use(params);
  const projectId = slug?.[0];
  const [project, setProject] = useState<ProjectData | null>(null);

  useEffect(() => {
    if (!projectId) return;

    fetch(`/api/v1/project?id=${projectId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.project) {
          setProject((prev) => (prev ? { ...prev, ...data.project } : data.project));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch project:", err);
      });

    // Fetch Daytona preview URL on-demand
    fetch(`/api/v1/project/preview?projectId=${projectId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.previewUrl) {
          setProject((prev) => (prev ? { ...prev, daytonaPreviewUrl: data.previewUrl } : null));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch Daytona preview URL:", err);
      });
  }, [projectId]);

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
      {/* Left Panel: Chat Interface */}
      <ResizablePanel
        defaultSize="40%"
        minSize="20%"
        maxSize="60%"
        className="flex flex-col h-full bg-background border-r border-border"
      >
        <ProjectChatPanel projectName={project?.name} projectId={projectId} />
      </ResizablePanel>

      <ResizableHandle withHandle className="after:w-4" />

      {/* Right Panel: Web Preview & Code View */}
      <ResizablePanel className="hidden md:flex flex-col h-full bg-background">
        <ProjectPreviewPanel initialUrl={project?.daytonaPreviewUrl} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
