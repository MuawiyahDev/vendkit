"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { UserMenu } from "@/components/layout/user-menu";
import {
  SIDEBAR_CONTROL_INTERACTION,
  SIDEBAR_ELEMENT_ID,
  SIDEBAR_ROW_PADDING,
} from "@/components/layout/sidebar/sidebar.constants";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  collapsed?: boolean;
  /** Omit to hide the collapse control, as in the mobile drawer. */
  onToggleCollapse?: () => void;
}

/**
 * Bottom section of the sidebar: the collapse control followed by the
 * signed-in account action.
 */
export function SidebarFooter({
  collapsed = false,
  onToggleCollapse,
}: SidebarFooterProps) {
  return (
    <div className="border-sidebar-border flex shrink-0 flex-col gap-1 border-t px-3 py-2.5">
      {onToggleCollapse ? (
        <CollapseControl
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      ) : null}
      <UserMenu variant="sidebar" collapsed={collapsed} />
    </div>
  );
}

interface CollapseControlProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function CollapseControl({
  collapsed,
  onToggleCollapse,
}: CollapseControlProps) {
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar";

  const control = (
    <Button
      variant="ghost"
      onClick={onToggleCollapse}
      aria-expanded={!collapsed}
      aria-controls={SIDEBAR_ELEMENT_ID}
      aria-label={label}
      className={cn(
        "h-9 w-full justify-start text-sidebar-foreground/70",
        SIDEBAR_ROW_PADDING,
        SIDEBAR_CONTROL_INTERACTION,
        collapsed && "justify-center px-0",
      )}
    >
      {collapsed ? (
        <PanelLeftOpen aria-hidden="true" />
      ) : (
        <PanelLeftClose aria-hidden="true" />
      )}
      {!collapsed ? (
        <span className="min-w-0 flex-1 truncate text-left text-xs">
          Collapse
        </span>
      ) : null}
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{control}</TooltipTrigger>
        <TooltipContent side="right" align="center">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return control;
}
