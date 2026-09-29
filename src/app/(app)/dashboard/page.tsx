import * as React from "react";
import { AppSidebar } from "@/app/(app)/_components/app-sidebar";
import { ModeToggle } from "@/app/(app)/_components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  CalendarIcon,
  CheckCircle2Icon,
  GaugeIcon,
  BoxIcon,
  Code2Icon,
  BotIcon,
  ExternalLinkIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Typed Data Definitions
// ---------------------------------------------------------------------------

type StatBreakdown = {
  label: string;
  count: number;
  color: "amber" | "purple" | "cyan";
  hasError?: boolean;
};

type StatCardData = {
  title: string;
  total: number;
  hasErrorsToggle?: boolean;
  isErrorsActive?: boolean;
  items: StatBreakdown[];
};

const STAT_CARDS: StatCardData[] = [
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

const ANALYTICS_METRICS = [
  { label: "Requests", value: "36" },
  { label: "Agents calls", value: "3" },
  { label: "MCP servers calls", value: "21" },
  { label: "Models requests", value: "13" },
];

const CHART_TIME_SLOTS = [
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

const TOP_REQUESTS = [
  { icon: <BoxIcon className="size-3.5 text-muted-foreground" />, name: "gpt-4o-2024-08-12", count: 7 },
  { icon: <Code2Icon className="size-3.5 text-muted-foreground" />, name: "google-maps", count: 4 },
  { icon: <BoxIcon className="size-3.5 text-muted-foreground" />, name: "explorer-mcp", count: 2 },
  { icon: <Code2Icon className="size-3.5 text-muted-foreground" />, name: "templete-gooogle-adk-api", count: 4 },
  { icon: <BoxIcon className="size-3.5 text-muted-foreground" />, name: "linear-demo", count: 2 },
  { icon: <Code2Icon className="size-3.5 text-muted-foreground" />, name: "cerebras-sandbox", count: 1 },
  { icon: <BoxIcon className="size-3.5 text-muted-foreground" />, name: "sandbox-openai", count: 2 },
];

const CHANGELOG = [
  {
    title: "New framework supported: PydanticAI",
    description: "Added support for PydanticAI framework",
    date: "2025-04-12",
  },
  {
    title: "New framework supported: Google ADK",
    description: "Added support for Google ADK (Agent Development Kit) framework",
    date: "2025-04-07",
  },
  {
    title: "Improved Analytics Dashboard",
    description: "Enhanced real-time monitoring with faster data refresh",
    date: "2025-04-15",
  },
];

const RECENT_REQUESTS = [
  { icon: <BoxIcon className="size-3.5 text-muted-foreground" />, name: "linear-demo", time: "in 21 hours" },
  { icon: <BotIcon className="size-3.5 text-muted-foreground" />, name: "myagent", time: "in 21 hours" },
  { icon: <BoxIcon className="size-3.5 text-muted-foreground" />, name: "linear-demo", time: "in 21 hours" },
  { icon: <Code2Icon className="size-3.5 text-muted-foreground" />, name: "gpt-40", time: "in 21 hours" },
  { icon: <BoxIcon className="size-3.5 text-muted-foreground" />, name: "linear-demo", time: "in 21 hours" },
];

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background text-foreground">
        {/* ── Top Header Bar ── */}
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
            {/* Date Range controls matching reference image */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-normal">Date Range</span>
              <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/80 bg-secondary/50 text-foreground hover:bg-secondary transition-colors cursor-pointer text-xs">
                <span>10 December</span>
                <CalendarIcon className="size-3 text-muted-foreground" />
              </button>
              <span className="text-muted-foreground font-normal">To</span>
              <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/80 bg-secondary/50 text-foreground hover:bg-secondary transition-colors cursor-pointer text-xs">
                <span>12 December</span>
                <CalendarIcon className="size-3 text-muted-foreground" />
              </button>
              <button className="text-amber-500 hover:text-amber-400 font-medium px-1 cursor-pointer transition-colors text-xs">
                Clear
              </button>
            </div>

            <Separator orientation="vertical" className="hidden sm:block h-4 opacity-50" />
            <ModeToggle />
          </div>
        </header>

        {/* ── Main Content Area ── */}
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6 overflow-y-auto">
          {/* Row 1: 3 Stat Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {STAT_CARDS.map((stat) => (
              <StatCard key={stat.title} stat={stat} />
            ))}
          </div>

          {/* Row 2: Deployment Insights + Top 10 Requests */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            {/* Deployment Insights (2 cols) */}
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

                {/* Grouped Bar Chart matching reference image */}
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

                  {/* Legend matching reference image */}
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

            {/* Top 10 Requests (1 col) */}
            <Card className="border-border/70 bg-card">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-semibold text-foreground">Top 10 requests</CardTitle>
                {/* General / Errors Switch */}
                <div className="flex items-center p-0.5 rounded-lg bg-secondary/60 border border-border/50 text-xs font-medium w-full mt-2">
                  <button className="flex-1 py-1 rounded-md bg-accent text-foreground shadow-xs text-center cursor-pointer text-xs">
                    General
                  </button>
                  <button className="flex-1 py-1 rounded-md text-muted-foreground hover:text-foreground text-center cursor-pointer transition-colors text-xs">
                    Errors
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 px-5 pb-5">
                {TOP_REQUESTS.map((req, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-2 truncate pr-2">
                      {req.icon}
                      <span className="truncate text-foreground/90 font-mono text-[11px]">{req.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums text-foreground/80 shrink-0 text-xs">
                      {req.count}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Row 3: What's new + Recent requests */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            {/* What's new (2 cols) */}
            <Card className="lg:col-span-2 border-border/70 bg-card">
              <CardHeader className="pb-2 pt-5 px-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm font-semibold text-foreground">What's new</CardTitle>
                    <p className="text-xs text-muted-foreground font-normal">
                      Stay up to date with our latest feature and improvements
                    </p>
                  </div>
                  <a
                    href="#"
                    className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 font-medium transition-colors"
                  >
                    <span>Full change log</span>
                    <ExternalLinkIcon className="size-3" />
                  </a>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2 px-5 pb-5">
                {CHANGELOG.map((entry) => (
                  <div
                    key={entry.title}
                    className="flex items-start justify-between gap-4 py-2 border-b border-border/40 last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{entry.title}</p>
                      <p className="text-xs text-muted-foreground font-normal">{entry.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 font-mono pt-0.5">
                      <CalendarIcon className="size-3.5" />
                      <span>{entry.date}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Requests (1 col) */}
            <Card className="border-border/70 bg-card">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Recent requests{" "}
                  <span className="text-muted-foreground font-normal text-xs">(10)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-5 pb-5">
                {RECENT_REQUESTS.map((req, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs py-0.5">
                    <div className="flex items-center gap-2 truncate">
                      {req.icon}
                      <span className="truncate text-foreground/90 font-mono text-[11px]">{req.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] px-1.5 py-0.5 flex items-center gap-1 font-medium"
                      >
                        <CheckCircle2Icon className="size-3" />
                        Success
                      </Badge>
                      <span className="text-muted-foreground text-[11px] font-normal">{req.time}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ---------------------------------------------------------------------------
// Stat Card Component (Exact design matching reference image)
// ---------------------------------------------------------------------------

function StatCard({ stat }: { stat: StatCardData }) {
  const colorMap = {
    amber: "bg-amber-400",
    purple: "bg-purple-500",
    cyan: "bg-cyan-400",
  };

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
