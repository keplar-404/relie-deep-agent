import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BoxIcon, BotIcon, Code2Icon, CheckCircle2Icon } from "lucide-react";

export const RECENT_REQUESTS = [
  { icon: <BoxIcon className="size-3.5 text-muted-foreground" />, name: "linear-demo", time: "in 21 hours" },
  { icon: <BotIcon className="size-3.5 text-muted-foreground" />, name: "myagent", time: "in 21 hours" },
  { icon: <BoxIcon className="size-3.5 text-muted-foreground" />, name: "linear-demo", time: "in 21 hours" },
  { icon: <Code2Icon className="size-3.5 text-muted-foreground" />, name: "gpt-40", time: "in 21 hours" },
  { icon: <BoxIcon className="size-3.5 text-muted-foreground" />, name: "linear-demo", time: "in 21 hours" },
];

export function RecentRequests() {
  return (
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
  );
}
