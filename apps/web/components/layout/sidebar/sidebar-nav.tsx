"use client";

import { NAV_GROUPS } from "@/components/layout/sidebar/nav-config";
import { SidebarGroup } from "@/components/layout/sidebar/sidebar-group";
import { SidebarItem } from "@/components/layout/sidebar/sidebar-item";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}

export function SidebarNav({
  collapsed = false,
  onNavigate,
  className,
}: SidebarNavProps) {
  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent",
        className,
      )}
    >
      {NAV_GROUPS.map((group, groupIndex) => (
        <SidebarGroup
          key={group.label ?? groupIndex}
          label={group.label}
          collapsed={collapsed}
        >
          {group.items.map((item) => (
            <SidebarItem
              key={item.href}
              title={item.title}
              href={item.href}
              icon={item.icon}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarGroup>
      ))}
    </nav>
  );
}
