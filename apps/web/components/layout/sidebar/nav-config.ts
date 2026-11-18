import {
  FileText,
  Images,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  Shapes,
  Tags,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/**
 * Navigation configuration for the dashboard sidebar.
 * Add items here as new feature routes become available.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Selling",
    items: [
      { title: "Orders", href: "/orders", icon: ReceiptText },
      { title: "Invoices", href: "/invoices", icon: FileText },
      { title: "Products", href: "/products", icon: Package },
      { title: "Inventory", href: "/inventory", icon: Warehouse },
      { title: "Categories", href: "/categories", icon: Tags },
      { title: "Brands", href: "/brands", icon: Shapes },
      { title: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    label: "Configuration",
    items: [
      { title: "Media", href: "/media", icon: Images },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const NAV_FALLBACK_TITLE = "Dashboard";

export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }
  // The dashboard entry should not light up for unrelated nested routes.
  return href !== "/dashboard" && pathname.startsWith(`${href}/`);
}

export function findNavItem(pathname: string): NavItem | undefined {
  const items = NAV_GROUPS.flatMap((group) => group.items);
  return items.find((item) => isNavItemActive(pathname, item.href));
}
