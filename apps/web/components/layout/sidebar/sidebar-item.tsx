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
        "group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm outline-none transition-[color,background-color] duration-150 motion-reduce:transition-none",
        "focus-visible:ring-sidebar-ring/70 focus-visible:ring-[3px]",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-sidebar-primary/12 ring-sidebar-primary/15 font-medium text-sidebar-primary ring-1 ring-inset before:absolute before:top-1/2 before:left-0 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-sidebar-primary before:content-[''] active:bg-sidebar-primary/18"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground active:bg-sidebar-accent",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {!collapsed ? <span className="truncate">{title}</span> : null}
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
