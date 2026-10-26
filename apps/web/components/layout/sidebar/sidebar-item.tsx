"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { isNavItemActive } from "@/components/layout/sidebar/nav-config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  title: string;
  href: string;
  icon: LucideIcon;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarItem({
  title,
  href,
  icon: Icon,
  collapsed = false,
  onNavigate,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = isNavItemActive(pathname, href);

  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-md px-2 text-sm outline-none transition-colors duration-150 ease-out motion-reduce:transition-none",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring/70",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-sidebar-primary/12 font-medium text-sidebar-foreground hover:bg-sidebar-primary/18 active:bg-sidebar-primary/22"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground active:bg-sidebar-accent",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {!collapsed ? (
        <span className="min-w-0 flex-1 truncate">{title}</span>
      ) : null}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" align="center">
          {title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
