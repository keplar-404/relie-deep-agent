"use client";

import { useWatch, type Control } from "react-hook-form";
import Image from "next/image";
import type { ProjectFormData } from "../types";

interface CardPreviewProps {
  control: Control<ProjectFormData>;
  previewImage: string;
}

/**
 * Isolated Card Preview — useWatch ensures keystrokes only re-render
 * this preview card, not the entire form.
 */
export function CardPreview({ control, previewImage }: CardPreviewProps) {
  const name = useWatch({ control, name: "name" });
  const description = useWatch({ control, name: "description" });

  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border/50 bg-card/60 p-2.5 mt-1">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Card Preview
      </span>
      <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-border/40 bg-muted">
        <Image
          src={previewImage}
          alt="Preview"
          width={640}
          height={360}
          priority
          loading="eager"
          className="h-full w-full object-cover"
          unoptimized
        />
      </div>
      <div className="pt-2 px-0.5">
        <p className="truncate text-xs font-medium text-foreground">
          {name || "Untitled Project"}
        </p>
        <p className="truncate text-[11px] text-muted-foreground mt-0.5">
          {description || "No description provided"}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          Updated just now
        </p>
      </div>
    </div>
  );
}
