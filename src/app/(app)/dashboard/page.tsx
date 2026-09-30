import * as React from "react";
import { AppSidebar } from "@/app/(app)/components/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  DashboardHeader,
  StatCard,
  STAT_CARDS,
  DeploymentInsights,
  TopRequests,
  WhatsNew,
  RecentRequests,
} from "./components";

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background text-foreground">
        {/* Top Header Bar */}
        <DashboardHeader />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6 overflow-y-auto">
          {/* Row 1: Stat Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {STAT_CARDS.map((stat) => (
              <StatCard key={stat.title} stat={stat} />
            ))}
          </div>

          {/* Row 2: Deployment Insights + Top Requests */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <DeploymentInsights />
            <TopRequests />
          </div>

          {/* Row 3: What's new + Recent requests */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <WhatsNew />
            <RecentRequests />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
