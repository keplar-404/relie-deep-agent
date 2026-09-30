import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, ExternalLinkIcon } from "lucide-react";

export const CHANGELOG = [
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

export function WhatsNew() {
  return (
    <Card className="lg:col-span-2 border-border/70 bg-card">
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold text-foreground">What&apos;s new</CardTitle>
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
  );
}
