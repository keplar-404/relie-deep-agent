"use client";

import { useState } from "react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import type { Project } from "../types";

export function ProjectCard({
  project,
  priority = false,
  onEdit,
  onDelete,
}: {
  project: Project;
  priority?: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}) {
  const [imgSrc, setImgSrc] = useState(() => {
    if (!project.image || project.image.startsWith("blob:")) return "/sass.jpg";
    return project.image;
  });

  return (
    <article className="project-card group cursor-pointer overflow-hidden rounded-md border border-border/40 bg-card transition-all duration-200 hover:border-border/80 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20">
      {/* Preview image with fallback */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <Image
          src={imgSrc}
          alt={project.title}
          width={640}
          height={360}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          className="h-full w-full object-cover"
          onError={() => setImgSrc("/sass.jpg")}
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/70 via-transparent to-transparent" />
      </div>

      {/* Meta section */}
      <div className="px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Title */}
          <span className="flex-1 truncate text-sm font-medium text-foreground">
            {project.title}
          </span>

          {/* 3-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -mr-0.5 focus:outline-none focus:ring-0"
                />
              }
            >
              <MoreHorizontalIcon className="size-3.5" />
              <span className="sr-only">Project options</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(project);
                }}
              >
                <PencilIcon className="size-3" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(project);
                }}
              >
                <Trash2Icon className="size-3" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description & Timeline */}
        {project.description && (
          <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
            {project.description}
          </p>
        )}
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          Updated {project.updatedAt}
        </p>
      </div>
    </article>
  );
}
