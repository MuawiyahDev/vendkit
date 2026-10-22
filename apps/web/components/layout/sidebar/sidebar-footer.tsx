import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  collapsed?: boolean;
}

export function SidebarFooter({ collapsed = false }: SidebarFooterProps) {
  return (
    <div
      className={cn(
        "border-sidebar-border shrink-0 border-t px-4 py-3",
        collapsed && "px-0",
      )}
    >
      <p
        className={cn(
          "text-muted-foreground/80 truncate text-xs",
          collapsed && "sr-only",
        )}
      >
        Self-hosted order management
      </p>
    </div>
  );
}
