"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

import { BrandLogo } from "@/components/shared/brand-logo";
import { SidebarFooter } from "@/components/layout/sidebar/sidebar-footer";
import { SidebarNav } from "@/components/layout/sidebar/sidebar-nav";
import { SIDEBAR_CONTROL_INTERACTION } from "@/components/layout/sidebar/sidebar.constants";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="bg-sidebar text-sidebar-foreground w-72 gap-0 overflow-hidden p-0 sm:max-w-xs"
      >
        <SheetHeader className="border-sidebar-border h-14 shrink-0 flex-row items-center justify-between gap-0 border-b p-0 px-3">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <BrandLogo className="px-2" />
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close navigation menu"
              className={SIDEBAR_CONTROL_INTERACTION}
            >
              <X aria-hidden="true" />
            </Button>
          </SheetClose>
        </SheetHeader>
        <SidebarNav onNavigate={() => setOpen(false)} />
        <SidebarFooter />
      </SheetContent>
    </Sheet>
  );
}
