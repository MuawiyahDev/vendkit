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
        "flex flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden px-3 py-4",
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
