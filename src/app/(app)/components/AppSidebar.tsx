"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { NavMain, type NavItem } from "./NavMain";
import { NavUser } from "./NavUser";
import { TeamSwitcher } from "./TeamSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  NAV_PRIMARY,
  NAV_SYSTEM,
  NAV_FOOTER_LINKS,
  WORKSPACE,
} from "./NavData";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const pathname = usePathname();

  // Dynamically compute active navigation item based on current URL path
  const primaryNavItems = React.useMemo<NavItem[]>(() => {
    return NAV_PRIMARY.map((item) => {
      let isActive = false;
      if (item.url === "/dashboard") {
        isActive = pathname === "/dashboard";
      } else if (item.url !== "#") {
        isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
      }
      return {
        ...item,
        isActive,
      };
    });
  }, [pathname]);

  const navUser = {
    name: user?.fullName ?? "Alex Smith",
    email: user?.primaryEmailAddress?.emailAddress ?? "alex@gmail.com",
    avatar: user?.imageUrl ?? "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-border/40 py-2.5">
        <TeamSwitcher teams={WORKSPACE} />
      </SidebarHeader>

      <SidebarContent className="gap-0 py-1">
        {/* Core product navigation with dynamic active route indicator */}
        <NavMain items={primaryNavItems} />

        <SidebarSeparator className="my-1.5 opacity-60" />

        {/* System & Configuration */}
        <NavMain items={NAV_SYSTEM} />

        <SidebarSeparator className="my-1.5 opacity-60" />

        {/* Info & Account */}
        <NavMain items={NAV_FOOTER_LINKS} />
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 py-2">
        <NavUser user={navUser} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
