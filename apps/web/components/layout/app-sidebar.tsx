import { Sidebar } from "@/components/layout/sidebar/sidebar";
import { SidebarBrand } from "@/components/layout/sidebar/sidebar-brand";
import { SidebarFooter } from "@/components/layout/sidebar/sidebar-footer";
import { SidebarNav } from "@/components/layout/sidebar/sidebar-nav";

interface AppSidebarProps {
  collapsed: boolean;
  className?: string;
}

/**
 * Desktop sidebar composed from the reusable sidebar building blocks.
 */
export function AppSidebar({ collapsed, className }: AppSidebarProps) {
  return (
    <Sidebar collapsed={collapsed} className={className}>
      <SidebarBrand collapsed={collapsed} />
      <SidebarNav collapsed={collapsed} />
      <SidebarFooter collapsed={collapsed} />
    </Sidebar>
  );
}
