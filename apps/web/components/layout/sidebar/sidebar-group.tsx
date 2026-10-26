import * as React from "react";

interface SidebarGroupProps {
  label?: string;
  collapsed?: boolean;
  children: React.ReactNode;
}

/**
 * A labelled cluster of navigation links. The visible label doubles as the
 * accessible name of the group so assistive tech announces the section.
 */
export function SidebarGroup({
  label,
  collapsed = false,
  children,
}: SidebarGroupProps) {
  const labelId = React.useId();
  const showLabel = Boolean(label) && !collapsed;

  return (
    <div
      className="flex flex-col gap-1"
      role={showLabel ? "group" : undefined}
      aria-labelledby={showLabel ? labelId : undefined}
    >
      {showLabel ? (
        <p
          id={labelId}
          className="px-2 pt-1 pb-1.5 text-[0.6875rem] font-medium tracking-wider text-sidebar-foreground/55 uppercase"
        >
          {label}
        </p>
      ) : null}
      {children}
    </div>
  );
}
