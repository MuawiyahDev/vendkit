import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { SidebarBrand } from "@/components/layout/sidebar/sidebar-brand";
import { SidebarFooter } from "@/components/layout/sidebar/sidebar-footer";
import { SidebarNav } from "@/components/layout/sidebar/sidebar-nav";
import { SIDEBAR_ELEMENT_ID } from "@/components/layout/sidebar/sidebar.constants";

interface AppSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

/**
 * Desktop sidebar composed from the reusable sidebar building blocks.
 */
export function AppSidebar({
  collapsed,
  onToggleCollapse,
  className,
}: AppSidebarProps) {
  return (
    <Sidebar
      id={SIDEBAR_ELEMENT_ID}
      collapsed={collapsed}
      className={className}
    >
      <SidebarBrand collapsed={collapsed} />
      <SidebarNav collapsed={collapsed} />
      <SidebarFooter
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />
    </Sidebar>
  );
}
