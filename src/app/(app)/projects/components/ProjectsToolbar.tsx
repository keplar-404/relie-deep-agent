"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, PlusIcon } from "lucide-react";

export const TABS = ["My Projects", "Templates"] as const;
export type Tab = (typeof TABS)[number];

interface ProjectsToolbarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onNewProject: () => void;
}

export function ProjectsToolbar({
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  onNewProject,
}: ProjectsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
      <div className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`rounded-sm px-3.5 py-1 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          onClick={onNewProject}
          className="size-8.5 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-transparent cursor-pointer"
          title="New Project"
        >
          <PlusIcon className="size-3" />
        </Button>
        <div className="relative w-64 sm:w-72">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search projects…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8.5 pl-9 pr-3 text-sm bg-background border-border/70 focus-visible:ring-0 focus-visible:border-foreground/40 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
