"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { NavMain, type NavItem } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  GaugeIcon,
  FolderKanbanIcon,
  BotIcon,
  Code2Icon,
  BoxIcon,
  FileTextIcon,
  KeyRoundIcon,
  SettingsIcon,
  UsersIcon,
  UserCheckIcon,
  ZapIcon,
  HelpCircleIcon,
  CreditCardIcon,
} from "lucide-react";

/**
 * Primary navigation — Core product routes matching reference dashboard.
 */
const NAV_PRIMARY: Omit<NavItem, "isActive">[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <GaugeIcon className="size-4" />,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: <FolderKanbanIcon className="size-4" />,
  },
  {
    title: "Chat Workspace",
    url: "/chat",
    icon: <BotIcon className="size-4" />,
  },
  {
    title: "Agents",
    url: "#",
    icon: <ZapIcon className="size-4" />,
    badge: 3,
  },
  {
    title: "MCP",
    url: "#",
    icon: <Code2Icon className="size-4" />,
    badge: 21,
  },
  {
    title: "Model APIs",
    url: "#",
    icon: <BoxIcon className="size-4" />,
    badge: 13,
  },
  {
    title: "Policies",
    url: "#",
    icon: <FileTextIcon className="size-4" />,
    badge: 1,
  },
];

/**
 * System / config navigation — Tools, settings, and accounts with shortcut chips.
 */
const NAV_SYSTEM: NavItem[] = [
  {
    title: "API Keys",
    url: "#",
    icon: <KeyRoundIcon className="size-4" />,
  },
  {
    title: "Settings",
    url: "#",
    icon: <SettingsIcon className="size-4" />,
    shortcut: "⌘ O",
  },
  {
    title: "Team",
    url: "#",
    icon: <UsersIcon className="size-4" />,
    shortcut: "⌘ I",
  },
  {
    title: "Service Accounts",
    url: "#",
    icon: <UserCheckIcon className="size-4" />,
  },
  {
    title: "Integrations",
    url: "#",
    icon: <ZapIcon className="size-4" />,
  },
];

/**
 * Support & info navigation.
 */
const NAV_FOOTER_LINKS: NavItem[] = [
  {
    title: "Information",
    url: "#",
    icon: <HelpCircleIcon className="size-4" />,
  },
  {
    title: "Account",
    url: "#",
    icon: <CreditCardIcon className="size-4" />,
  },
];

/** Workspace header data matching reference styling */
const WORKSPACE = [
  {
    name: "Organization",
    logo: (
      <svg
        viewBox="0 0 24 24"
        className="size-4.5 stroke-white fill-none stroke-[1.75]"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    ),
    plan: "Saasfactor",
  },
  {
    name: "Relie",
    logo: <ZapIcon className="size-4 text-white" />,
    plan: "Shopify Store Agent",
  },
];

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
