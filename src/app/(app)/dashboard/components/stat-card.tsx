import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export type StatBreakdown = {
  label: string;
  count: number;
  color: "amber" | "purple" | "cyan";
  hasError?: boolean;
};

export type StatCardData = {
  title: string;
  total: number;
  hasErrorsToggle?: boolean;
  isErrorsActive?: boolean;
  items: StatBreakdown[];
};

export const STAT_CARDS: StatCardData[] = [
  {
    title: "Active Agents",
    total: 3,
    hasErrorsToggle: true,
    isErrorsActive: true,
    items: [
      { label: "templete-gooogle-adk-api", count: 1, color: "amber" },
      { label: "mcp-gooogle-adk-api", count: 1, color: "purple", hasError: true },
      { label: "templete-openai-api", count: 1, color: "cyan", hasError: true },
    ],
  },
  {
    title: "Active MCP Servers",
    total: 21,
    hasErrorsToggle: true,
    isErrorsActive: false,
    items: [
      { label: "linear-demo", count: 15, color: "amber" },
      { label: "google-maps", count: 4, color: "cyan" },
      { label: "explorer-mcp", count: 2, color: "purple" },
    ],
  },
  {
    title: "Active Models",
    total: 13,
    hasErrorsToggle: true,
    isErrorsActive: false,
    items: [
      { label: "gpt-4o-2024-08-12", count: 2, color: "amber" },
      { label: "cerebras-sandbox", count: 6, color: "cyan" },
      { label: "sandbox-openai", count: 5, color: "purple" },
    ],
  },
];

const colorMap = {
  amber: "bg-amber-400",
  purple: "bg-purple-500",
  cyan: "bg-cyan-400",
};

export function StatCard({ stat }: { stat: StatCardData }) {
  return (
    <Card className="border-border/70 bg-card">
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{stat.title}</span>
          {stat.hasErrorsToggle && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-normal">Errors</span>
              <div
                className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  stat.isErrorsActive ? "bg-amber-500" : "bg-muted"
                }`}
              >
                <div
                  className={`size-3 rounded-full bg-white transition-transform shadow-xs ${
                    stat.isErrorsActive ? "translate-x-3" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          )}
        </div>
        <div className="pt-1 pb-1">
          <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
            {stat.total}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-5 pb-5">
        {/* Segmented Distribution Bar */}
        <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-muted/40 gap-0.5">
          {stat.items.map((item, idx) => {
            const pct = Math.max(10, (item.count / stat.total) * 100);
            return (
              <div
                key={idx}
                style={{ width: `${pct}%` }}
                className={`h-full ${colorMap[item.color]} rounded-full`}
                title={`${item.label}: ${item.count}`}
              />
            );
          })}
        </div>

        {/* Breakdown Items List */}
        <div className="space-y-1.5 pt-1">
          {stat.items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className={`size-2 rounded-xs ${colorMap[item.color]} shrink-0`} />
                <span className="text-muted-foreground truncate font-mono text-[11px]">
                  {item.label}
                </span>
                {item.hasError && (
                  <Badge
                    variant="destructive"
                    className="bg-red-500/15 text-red-400 border border-red-500/25 text-[9px] px-1 py-0 h-4 font-normal"
                  >
                    Error
                  </Badge>
                )}
              </div>
              <span className="tabular-nums font-semibold text-foreground/80 shrink-0 text-xs">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
