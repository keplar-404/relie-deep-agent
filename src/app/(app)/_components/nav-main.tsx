"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRightIcon } from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  /** Optional count badge shown on the right (e.g. "3", "21") */
  badge?: string | number;
  /** Optional keyboard shortcut shown on the right (e.g. "⌘ O") */
  shortcut?: string;
  /** Sub-items: if present, item renders as a collapsible group */
  items?: { title: string; url: string }[];
};

/**
 * Renders a sidebar navigation group.
 * - Items WITHOUT sub-items → flat Link (matches reference image)
 * - Items WITH sub-items → collapsible expand/collapse
 * - badge prop → shows a Badge count on the right
 * - shortcut prop → shows keyboard shortcut chip (e.g. ⌘ O)
 * - isActive → applies active highlight matching reference design
 */
export function NavMain({ items }: { items: NavItem[]; label?: string }) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) =>
          item.items?.length ? (
            // Collapsible only when sub-items exist
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger render={<SidebarMenuButton tooltip={item.title} />}>
                {item.icon}
                <span>{item.title}</span>
                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items.map((sub) => (
                    <SidebarMenuSubItem key={sub.title}>
                      <SidebarMenuSubButton render={<Link href={sub.url} />}>
                        <span>{sub.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            // Flat link — matches reference image sidebar style
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={item.isActive}
                tooltip={item.title}
                render={
                  item.url === "#" ? (
                    <button type="button" />
                  ) : (
                    <Link href={item.url} />
                  )
                }
              >
                {item.icon}
                <span>{item.title}</span>
                {item.badge !== undefined && (
                  <Badge
                    variant="secondary"
                    className="ml-auto text-[11px] h-5 min-w-5 px-1.5 flex items-center justify-center rounded group-data-[collapsible=icon]:hidden font-normal text-muted-foreground bg-muted/60"
                  >
                    {item.badge}
                  </Badge>
                )}
                {item.shortcut && (
                  <span className="ml-auto text-[10px] font-mono tracking-tight text-amber-500/90 border border-amber-500/30 rounded px-1 py-0.5 group-data-[collapsible=icon]:hidden">
                    {item.shortcut}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
