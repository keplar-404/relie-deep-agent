import Link from "next/link";
import { AppSidebar } from "@/app/(app)/components/app-sidebar";
import { ModeToggle } from "@/app/(app)/components/mode-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { PlusIcon } from "lucide-react";

/**
 * Projects page — Shares the exact same sidebar, theme, and layout shell as Dashboard.
 */
export default function ProjectsPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background text-foreground">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/70 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-4 opacity-50" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Projects</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center space-y-3 max-w-sm">
            <p className="text-lg font-semibold">Projects</p>
            <p className="text-sm text-muted-foreground">
              Manage your workspaces and start an autonomous build session.
            </p>
            <div className="pt-2">
              <Link
                href="/chat"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-xs"
              >
                <PlusIcon className="size-4" />
                <span>Open Chat Workspace</span>
              </Link>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
