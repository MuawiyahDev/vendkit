import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  collapsed?: boolean;
}

export function SidebarFooter({ collapsed = false }: SidebarFooterProps) {
  return (
    <div
      className={cn(
        "border-sidebar-border shrink-0 border-t px-3.5 py-3",
        collapsed && "px-0",
      )}
    >
      <p
        className={cn(
          "text-sidebar-foreground/50 truncate text-xs",
          collapsed && "sr-only",
        )}
      >
        Self-hosted order management
      </p>
    </div>
  );
}
