"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { BrandLogo } from "@/components/shared/brand-logo";
import { SidebarFooter } from "@/components/layout/sidebar/sidebar-footer";
import { SidebarNav } from "@/components/layout/sidebar/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
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
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-sidebar text-sidebar-foreground w-72 gap-0 p-0 sm:max-w-xs"
      >
        <SheetHeader className="border-sidebar-border h-14 justify-center border-b px-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <BrandLogo />
        </SheetHeader>
        <SidebarNav onNavigate={() => setOpen(false)} />
        <SidebarFooter />
      </SheetContent>
    </Sheet>
  );
}
