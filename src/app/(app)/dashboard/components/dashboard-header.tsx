"use client";

import * as React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/app/(app)/components/mode-toggle";
import { CalendarIcon, GaugeIcon } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/70 px-4">
      <div className="flex items-center gap-2.5">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-1 h-4 opacity-50" />
        <div className="flex size-7 items-center justify-center rounded-md bg-secondary/80 border border-border/60 text-foreground">
          <GaugeIcon className="size-3.5" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Dashboard</span>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Date Range controls */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="text-muted-foreground font-normal">Date Range</span>
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/80 bg-secondary/50 text-foreground hover:bg-secondary transition-colors cursor-pointer text-xs"
          >
            <span>10 December</span>
            <CalendarIcon className="size-3 text-muted-foreground" />
          </button>
          <span className="text-muted-foreground font-normal">To</span>
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/80 bg-secondary/50 text-foreground hover:bg-secondary transition-colors cursor-pointer text-xs"
          >
            <span>12 December</span>
            <CalendarIcon className="size-3 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="text-amber-500 hover:text-amber-400 font-medium px-1 cursor-pointer transition-colors text-xs"
          >
            Clear
          </button>
        </div>

        <Separator orientation="vertical" className="hidden sm:block h-4 opacity-50" />
        <ModeToggle />
      </div>
    </header>
  );
}
