"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FolderPlusIcon, PlusIcon } from "lucide-react";
import type { Project } from "../types";
import { ProjectCard } from "./ProjectCard";
import type { Tab } from "./ProjectsToolbar";

interface ProjectsGridProps {
  activeTab: Tab;
  isLoading: boolean;
  projects: Project[];
  search: string;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onCreateNew: () => void;
}

export function ProjectsGrid({
  activeTab,
  isLoading,
  projects,
  search,
  onEdit,
  onDelete,
  onCreateNew,
}: ProjectsGridProps) {
  if (activeTab === "Templates") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <p className="text-base font-semibold">Templates coming soon</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Pre-built agent templates for Shopify workflows will appear here soon.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="overflow-hidden rounded-md border border-border/40 bg-card p-3 flex flex-col gap-3"
          >
            <Skeleton className="aspect-video w-full rounded-sm" />
            <Skeleton className="h-4 w-3/4 rounded-sm" />
            <Skeleton className="h-3 w-1/2 rounded-sm" />
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-16 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted/50 mb-3 text-muted-foreground">
          <FolderPlusIcon className="size-5" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          {search ? "No matching projects" : "No projects yet"}
        </p>
        <p className="text-xs text-muted-foreground max-w-xs mb-4">
          {search
            ? `No projects found matching "${search}". Try another term.`
            : "Create your first AI agent project workspace to get started."}
        </p>
        <Button
          type="button"
          size="sm"
          onClick={onCreateNew}
          className="gap-1.5"
        >
          <PlusIcon className="size-3.5" />
          Create Project
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          priority={index < 4}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
