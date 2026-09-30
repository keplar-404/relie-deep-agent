"use client";

import type { LucideIcon } from "lucide-react";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import type { FlowStepStatus } from "./flowTypes";

interface FlowNodeItemProps {
  name: string;
  status: FlowStepStatus;
  loadingText: string;
  loaderVariant?: "Drive" | "Dots" | "Orbit";
  icon: LucideIcon;
  isLast?: boolean;
  children: React.ReactNode;
}

export function FlowNodeItem({
  name,
  status,
  loadingText,
  loaderVariant = "Drive",
  icon: Icon,
  isLast = false,
  children,
}: FlowNodeItemProps) {
  if (status === "pending") return null;

  return (
    <div className="relative flex gap-3 pb-6 group">
      {/* Vertical trunk connector line */}
      {!isLast && (
        <div
          aria-hidden="true"
          className="absolute left-[13px] top-[26px] bottom-0 w-[2px] bg-border/60 transition-colors"
        />
      )}

      {/* Node Dot / Icon (•--) */}
      <div className="relative z-10 flex items-center shrink-0">
        <div
          className={`flex size-7 items-center justify-center rounded-full border transition-all ${
            status === "loading"
              ? "border-primary bg-primary/10 text-primary shadow-xs ring-4 ring-primary/10"
              : "border-border bg-card text-foreground shadow-2xs"
          }`}
        >
          {status === "loading" ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <Icon className="size-3.5" />
          )}
        </div>

        {/* Horizontal connector (-- to content card) */}
        <div
          aria-hidden="true"
          className={`h-[2px] w-3 transition-colors ${
            status === "loading" ? "bg-primary/50" : "bg-border/60"
          }`}
        />
      </div>

      {/* Content Card */}
      <div className="flex-1 min-w-0 rounded-xl border border-border/60 bg-card/50 p-3 shadow-xs transition-all">
        {/* Step Header */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-border/40">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-foreground truncate">
              {name}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight ${
              status === "loading"
                ? "bg-primary/15 text-primary border border-primary/20 animate-pulse"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {status === "loading" ? (
              "Running"
            ) : (
              <>
                <CheckIcon className="size-2.5" />
                Done
              </>
            )}
          </span>
        </div>

        {/* Dynamic State: Loading State vs Real Component */}
        <div className="min-w-0">
          {status === "loading" ? (
            <div className="py-2 px-1">
              <LoadingState variant={loaderVariant} label={loadingText} />
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
