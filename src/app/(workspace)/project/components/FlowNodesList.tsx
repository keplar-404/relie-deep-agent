"use client";

import {
  BrainCircuitIcon, TablePropertiesIcon, SearchIcon, WrenchIcon,
  Code2Icon, CheckCircle2Icon, MessageSquareIcon,
} from "lucide-react";
import { ThinkingState } from "@/components/ThinkingState";
import { FilterTable } from "@/components/FilterTable";
import { ToolChips } from "@/components/ToolChips";
import { CodeBlock } from "@/components/CodeBlock";
import { TaskRows } from "@/components/TaskRows";
import { StreamingText } from "@/components/StreamingText";
import { FlowNodeItem } from "./FlowNodeItem";
import {
  PLAN_ROWS, SEARCH_ROWS, METRICS_ROWS, TOOL_STEPS, TOOL_DIFFS,
  CODE_LINES, TASK_DEMO_ROWS, STREAM_TOKENS, STREAM_SOURCES, FOLLOW_UPS,
} from "./flowData";

function getStatus(stepIndex: number, phase: number) {
  if (phase < stepIndex) return "pending";
  if (phase === stepIndex) return "loading";
  return "done";
}

export function FlowNodesList({ phase }: { phase: number }) {
  return (
    <div className="relative pl-1">
      <FlowNodeItem
        name="1. Planning Architecture"
        status={getStatus(1, phase)}
        loadingText="Thinking through optimization steps & route bottlenecks…"
        loaderVariant="Drive"
        icon={BrainCircuitIcon}
      >
        <ThinkingState variant="Steps" rows={PLAN_ROWS} active="Planning optimisation…" done="Planned in 4 steps" className="max-w-full" />
      </FlowNodeItem>

      <FlowNodeItem
        name="2. Endpoint Metrics & Latency"
        status={getStatus(2, phase)}
        loadingText="Profiling route latencies and database queries…"
        loaderVariant="Dots"
        icon={TablePropertiesIcon}
      >
        <FilterTable rows={METRICS_ROWS} labels={{ columns: { task: "Endpoint", date: "Checked", status: "Status", owner: "p95 Latency" } }} className="max-w-full" />
      </FlowNodeItem>

      <FlowNodeItem
        name="3. Technical Research"
        status={getStatus(3, phase)}
        loadingText="Searching documentation & query caching patterns…"
        loaderVariant="Orbit"
        icon={SearchIcon}
      >
        <ThinkingState variant="Search" rows={SEARCH_ROWS} query="API performance optimisation best practices" active="Searching best practices…" done="Searched 3 sources" className="max-w-full" />
      </FlowNodeItem>

      <FlowNodeItem
        name="4. Tool Execution & Files"
        status={getStatus(4, phase)}
        loadingText="Reading route handlers & generating charts…"
        loaderVariant="Drive"
        icon={WrenchIcon}
      >
        <ToolChips steps={TOOL_STEPS} diffs={TOOL_DIFFS} labels={{ header: "4 tool calls", more: "+2 more files" }} className="max-w-full min-h-0" />
      </FlowNodeItem>

      <FlowNodeItem
        name="5. Code Generation"
        status={getStatus(5, phase)}
        loadingText="Streaming optimized route handler implementation…"
        loaderVariant="Dots"
        icon={Code2Icon}
      >
        <CodeBlock variant="Code" lines={CODE_LINES} filename="api/products/route.ts" className="max-w-full" />
      </FlowNodeItem>

      <FlowNodeItem
        name="6. Task Verification"
        status={getStatus(6, phase)}
        loadingText="Running benchmark assertions & verifying thresholds…"
        loaderVariant="Orbit"
        icon={CheckCircle2Icon}
      >
        <TaskRows variant="Capsules" rows={TASK_DEMO_ROWS} className="max-w-full" />
      </FlowNodeItem>

      <FlowNodeItem
        name="7. Response Summary"
        status={getStatus(7, phase)}
        loadingText="Synthesizing final optimization report…"
        loaderVariant="Drive"
        icon={MessageSquareIcon}
        isLast
      >
        <StreamingText content={STREAM_TOKENS} sources={STREAM_SOURCES} followUps={FOLLOW_UPS} labels={{ sources: "2 sources", followUps: "What's next?" }} loop={false} fill />
      </FlowNodeItem>
    </div>
  );
}
