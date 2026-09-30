import * as React from "react";
import type { NavItem } from "./NavMain";
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
export const NAV_PRIMARY: Omit<NavItem, "isActive">[] = [
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
export const NAV_SYSTEM: NavItem[] = [
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
export const NAV_FOOTER_LINKS: NavItem[] = [
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
export const WORKSPACE = [
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
