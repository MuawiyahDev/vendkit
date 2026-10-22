"use client";

import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import {
  findNavItem,
  NAV_FALLBACK_TITLE,
} from "@/components/layout/sidebar/nav-config";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function DashboardHeader({
  collapsed,
  onToggleCollapse,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const title = findNavItem(pathname)?.title ?? NAV_FALLBACK_TITLE;

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2.5 border-b px-4 backdrop-blur md:px-6">
      <MobileSidebar />
      <Button
        variant="ghost"
        size="icon-sm"
        className="hidden lg:inline-flex"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <PanelLeftOpen aria-hidden="true" />
        ) : (
          <PanelLeftClose aria-hidden="true" />
        )}
      </Button>
      <h1 className="text-foreground min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">
        {title}
      </h1>
      <UserMenu />
    </header>
  );
}
