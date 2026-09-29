"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronDownIcon, PlusIcon } from "lucide-react";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ReactNode;
    plan: string;
  }[];
}) {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);
  if (!activeTeam) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-xs shrink-0 overflow-hidden">
              {activeTeam.logo}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight pl-0.5">
              <span className="truncate font-semibold text-foreground text-sm">
                {activeTeam.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {activeTeam.plan}
              </span>
            </div>
            <ChevronDownIcon className="ml-auto size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Organizations
              </DropdownMenuLabel>
              {teams.map((team, index) => (
                <DropdownMenuItem
                  key={team.name}
                  onClick={() => setActiveTeam(team)}
                  className="gap-2 p-2 cursor-pointer"
                >
                  <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shrink-0">
                    {team.logo}
                  </div>
                  <span className="truncate font-medium text-sm">{team.name}</span>
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-2 p-2 cursor-pointer text-muted-foreground hover:text-foreground">
                <div className="flex size-6 items-center justify-center rounded-md border border-border bg-transparent">
                  <PlusIcon className="size-3.5" />
                </div>
                <span className="font-medium text-sm">Add organization</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
