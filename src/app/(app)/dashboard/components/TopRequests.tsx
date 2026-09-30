"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BoxIcon, Code2Icon } from "lucide-react";

export const TOP_REQUESTS = [
  { icon: <BoxIcon className="size-3.5 text-muted-foreground" />, name: "gpt-4o-2024-08-12", count: 7 },
  { icon: <Code2Icon className="size-3.5 text-muted-foreground" />, name: "google-maps", count: 4 },
  { icon: <BoxIcon className="size-3.5 text-muted-foreground" />, name: "explorer-mcp", count: 2 },
  { icon: <Code2Icon className="size-3.5 text-muted-foreground" />, name: "templete-gooogle-adk-api", count: 4 },
  { icon: <BoxIcon className="size-3.5 text-muted-foreground" />, name: "linear-demo", count: 2 },
  { icon: <Code2Icon className="size-3.5 text-muted-foreground" />, name: "cerebras-sandbox", count: 1 },
  { icon: <BoxIcon className="size-3.5 text-muted-foreground" />, name: "sandbox-openai", count: 2 },
];

export function TopRequests() {
  const [tab, setTab] = React.useState<"general" | "errors">("general");

  return (
    <Card className="border-border/70 bg-card">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-sm font-semibold text-foreground">Top 10 requests</CardTitle>
        {/* General / Errors Switch */}
        <div className="flex items-center p-0.5 rounded-lg bg-secondary/60 border border-border/50 text-xs font-medium w-full mt-2">
          <button
            type="button"
            onClick={() => setTab("general")}
            className={`flex-1 py-1 rounded-md text-center cursor-pointer text-xs transition-colors ${
              tab === "general"
                ? "bg-accent text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setTab("errors")}
            className={`flex-1 py-1 rounded-md text-center cursor-pointer text-xs transition-colors ${
              tab === "errors"
                ? "bg-accent text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
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
  );
}
