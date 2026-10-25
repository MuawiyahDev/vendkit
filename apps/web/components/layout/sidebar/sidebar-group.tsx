import * as React from "react";

interface SidebarGroupProps {
  label?: string;
  collapsed?: boolean;
  children: React.ReactNode;
}

export function SidebarGroup({
  label,
  collapsed = false,
  children,
}: SidebarGroupProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && !collapsed ? (
        <p
          className="text-sidebar-foreground/45 px-2.5 pt-1 pb-1.5 text-[0.6875rem] font-medium tracking-wide uppercase"
          aria-hidden="true"
        >
          {label}
        </p>
      ) : null}
      {children}
    </div>
  );
}
