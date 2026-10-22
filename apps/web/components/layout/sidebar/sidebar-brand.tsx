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
      aria-label="OpenOrder dashboard"
      className={cn(
        "rounded-md outline-none",
        "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      )}
    >
      <BrandLogo collapsed={collapsed} />
    </Link>
  );

  return (
    <div
      className={cn(
        "border-sidebar-border flex h-14 shrink-0 items-center border-b px-4",
        collapsed && "justify-center px-0",
      )}
    >
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{logo}</TooltipTrigger>
          <TooltipContent side="right" align="center">
            OpenOrder
          </TooltipContent>
        </Tooltip>
      ) : (
        logo
      )}
    </div>
  );
}
