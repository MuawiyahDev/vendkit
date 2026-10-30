"use client";

import Link from "next/link";

import { BrandLogo } from "@/components/shared/brand-logo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarBrandProps {
  collapsed?: boolean;
}

export function SidebarBrand({ collapsed = false }: SidebarBrandProps) {
  const logo = (
    <Link
      href="/dashboard"
      aria-label="VendKit dashboard"
      className={cn(
        "flex items-center rounded-md outline-none transition-colors duration-150 ease-out motion-reduce:transition-none",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring/70",
        collapsed ? "justify-center" : "px-2",
      )}
    >
      <BrandLogo collapsed={collapsed} />
    </Link>
  );

  return (
    <div
      className={cn(
        "border-sidebar-border flex h-14 shrink-0 items-center border-b px-3",
        collapsed && "px-0",
      )}
    >
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{logo}</TooltipTrigger>
          <TooltipContent side="right" align="center">
            VendKit
          </TooltipContent>
        </Tooltip>
      ) : (
        logo
      )}
    </div>
  );
}
