"use client";

import { usePathname } from "next/navigation";

import {
  findNavItem,
  NAV_FALLBACK_TITLE,
} from "@/components/layout/sidebar/nav-config";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { UserMenu } from "@/components/layout/user-menu";

export function DashboardHeader() {
  const pathname = usePathname();
  const title = findNavItem(pathname)?.title ?? NAV_FALLBACK_TITLE;

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 border-border-subtle sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2.5 border-b px-4 backdrop-blur md:px-6">
      <MobileSidebar />
      <div className="text-foreground min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">
        {title}
      </div>
      {/* On desktop the account action lives in the sidebar footer. */}
      <UserMenu className="lg:hidden" />
    </header>
  );
}
