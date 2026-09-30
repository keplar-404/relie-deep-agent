"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlayIcon, RotateCcwIcon, ChevronRightIcon } from "lucide-react";
import { FlowNodesList } from "./FlowNodesList";

const TOTAL_STEPS = 7;
const HOLD_MS = 2200;
const QUERY = "Analyze API performance, profile slow endpoints, optimize routes with caching, and run benchmarks.";

export function AgentFlow() {
  const [phase, setPhase] = useState(1);
  const [autoPlay, setAutoPlay] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => setPhase((p) => Math.min(p + 1, TOTAL_STEPS + 1)), []);
  const reset = () => { setPhase(1); setAutoPlay(false); };
  const startAuto = () => { setPhase(1); setAutoPlay(true); };

  useEffect(() => {
    if (!autoPlay || phase > TOTAL_STEPS) return;
    const t = setTimeout(next, HOLD_MS);
    return () => clearTimeout(t);
  }, [autoPlay, phase, next]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [phase]);

  return (
    <div className="flex h-full flex-col bg-background overflow-hidden">
      {/* Top Controls Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/40 bg-muted/20 px-4 py-2.5">
        <div>
          <h2 className="text-xs font-semibold text-foreground">Agent Execution Flow</h2>
          <p className="text-[10px] text-muted-foreground">Live lifecycle — loading state streams into component</p>
        </div>
        <div className="flex items-center gap-1.5">
          {phase <= TOTAL_STEPS && (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-accent cursor-pointer shadow-2xs"
            >
              <span>Next</span>
              <ChevronRightIcon className="size-3" />
            </button>
          )}
          <button
            type="button"
            onClick={autoPlay && phase <= TOTAL_STEPS ? reset : startAuto}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90 cursor-pointer shadow-2xs"
          >
            {autoPlay && phase <= TOTAL_STEPS ? (
              <><RotateCcwIcon className="size-3" /><span>Reset</span></>
            ) : (
              <><PlayIcon className="size-3" /><span>{phase > TOTAL_STEPS ? "Replay Flow" : "Auto Run"}</span></>
            )}
          </button>
        </div>
      </div>

      {/* Flow Tree Canvas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* User Prompt */}
        <div className="flex justify-end mb-4">
          <div className="max-w-[85%] rounded-2xl rounded-br-xs bg-primary px-3.5 py-2 text-[12px] leading-relaxed text-primary-foreground shadow-xs">
            {QUERY}
          </div>
        </div>

        {/* Tree Execution Nodes */}
        <FlowNodesList phase={phase} />

        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
