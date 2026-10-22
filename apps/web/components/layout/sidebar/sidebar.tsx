import * as React from "react";

import { cn } from "@/lib/utils";

interface SidebarProps extends React.ComponentProps<"aside"> {
  collapsed?: boolean;
}

/**
 * Sidebar container: fixed-width rail that collapses to an icon strip.
 */
export function Sidebar({
  collapsed = false,
  className,
  children,
  ...props
}: SidebarProps) {
  return (
    <aside
      data-slot="sidebar"
      data-state={collapsed ? "collapsed" : "expanded"}
      className={cn(
        "bg-sidebar text-sidebar-foreground flex h-dvh shrink-0 flex-col overflow-hidden border-r border-sidebar-border transition-[width] duration-200 ease-in-out motion-reduce:transition-none",
        collapsed ? "w-16" : "w-64",
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  );
}
