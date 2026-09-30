import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ANALYTICS_METRICS = [
  { label: "Requests", value: "36" },
  { label: "Agents calls", value: "3" },
  { label: "MCP servers calls", value: "21" },
  { label: "Models requests", value: "13" },
];

export const CHART_TIME_SLOTS = [
  { time: "3:02 PM", agents: 1, mcp: 2, models: 1 },
  { time: "3:07 PM", agents: 1, mcp: 2.5, models: 1.5 },
  { time: "3:12 PM", agents: 2, mcp: 4, models: 3 },
  { time: "3:17 PM", agents: 1.5, mcp: 3.5, models: 2.5 },
  { time: "3:22 PM", agents: 1, mcp: 3, models: 2 },
  { time: "3:27 PM", agents: 1.5, mcp: 3.5, models: 3 },
  { time: "3:32 PM", agents: 1.2, mcp: 2.8, models: 3.2 },
  { time: "3:37 PM", agents: 1.5, mcp: 5.5, models: 3.8 },
  { time: "3:42 PM", agents: 1, mcp: 4, models: 2.5 },
  { time: "3:47 PM", agents: 1.2, mcp: 3.6, models: 2.2 },
];

export function DeploymentInsights() {
  return (
    <Card className="lg:col-span-2 border-border/70 bg-card">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-sm font-semibold text-foreground">
          All deployment request Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-5 pb-5">
        {/* 4 Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {ANALYTICS_METRICS.map((m) => (
            <div key={m.label} className="space-y-1">
              <p className="text-xs text-muted-foreground font-normal">{m.label}</p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-foreground">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Grouped Bar Chart */}
        <div className="pt-2">
          <div className="h-44 w-full flex flex-col justify-end">
            {/* Y-axis grid & bars */}
            <div className="relative flex-1 flex items-end justify-between border-b border-border/70 pb-1">
              {/* Horizontal grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-border w-full" />
                <div className="border-b border-border w-full" />
                <div className="border-b border-border w-full" />
                <div className="border-b border-border w-full" />
              </div>

              {/* Grouped Bars */}
              {CHART_TIME_SLOTS.map((slot) => {
                const maxHeight = 8;
                const agentsH = Math.min(100, (slot.agents / maxHeight) * 100);
                const mcpH = Math.min(100, (slot.mcp / maxHeight) * 100);
                const modelsH = Math.min(100, (slot.models / maxHeight) * 100);

                return (
                  <div key={slot.time} className="flex items-end gap-1 px-1 h-full z-10">
                    <div
                      style={{ height: `${agentsH}%` }}
                      className="w-1.5 sm:w-2 bg-purple-500 rounded-t-xs transition-all hover:brightness-125"
                      title={`Agents: ${slot.agents}`}
                    />
                    <div
                      style={{ height: `${mcpH}%` }}
                      className="w-1.5 sm:w-2 bg-amber-400 rounded-t-xs transition-all hover:brightness-125"
                      title={`MCP: ${slot.mcp}`}
                    />
                    <div
                      style={{ height: `${modelsH}%` }}
                      className="w-1.5 sm:w-2 bg-cyan-400 rounded-t-xs transition-all hover:brightness-125"
                      title={`Models: ${slot.models}`}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-axis time labels */}
            <div className="flex justify-between text-[10px] text-muted-foreground pt-2 overflow-x-hidden">
              {CHART_TIME_SLOTS.map((slot) => (
                <span key={slot.time} className="truncate text-center">
                  {slot.time}
                </span>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-purple-500" />
              <span className="text-muted-foreground text-xs font-normal">Agents calls</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="text-muted-foreground text-xs font-normal">MCP servers calls</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-cyan-400" />
              <span className="text-muted-foreground text-xs font-normal">Models requests</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
