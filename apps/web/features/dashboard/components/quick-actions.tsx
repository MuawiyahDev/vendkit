import {
  ArrowUpRight,
  BarChart3,
  Package,
  PackagePlus,
  Plus,
  ReceiptText,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { DashboardSectionHeader } from "./dashboard-section-header";

interface QuickAction {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  emphasis?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: "/orders/new",
    label: "Create order",
    description: "Record a new sale",
    icon: Plus,
    emphasis: true,
  },
  {
    href: "/products/new",
    label: "Add product",
    description: "Grow your catalog",
    icon: PackagePlus,
  },
  {
    href: "/orders",
    label: "View orders",
    description: "Track fulfilment",
    icon: ReceiptText,
  },
  {
    href: "/customers",
    label: "View customers",
    description: "Review buyer history",
    icon: Users,
  },
  {
    href: "/reports",
    label: "Open reports",
    description: "See revenue and best sellers",
    icon: BarChart3,
  },
  {
    href: "/inventory",
    label: "Manage inventory",
    description: "Adjust stock and review history",
    icon: Warehouse,
  },
  {
    href: "/products",
    label: "View products",
    description: "Manage catalog and pricing",
    icon: Package,
  },
];

export function QuickActions() {
  return (
    <Card className="h-full gap-0 py-0">
      <div className="p-5 pb-2">
        <DashboardSectionHeader
          title="Quick actions"
          description="Common tasks across your workspace"
        />
      </div>

      <nav aria-label="Quick actions" className="px-2 pb-3">
        <ul className="flex flex-col">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className="hover:bg-surface-hover focus-visible:ring-ring/40 group flex items-center gap-3 rounded-md px-3 py-2.5 outline-none transition-colors focus-visible:ring-[3px]"
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      action.emphasis
                        ? "bg-primary-soft text-primary-soft-foreground"
                        : "bg-surface-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {action.label}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {action.description}
                    </span>
                  </span>
                  <ArrowUpRight
                    className="text-muted-foreground group-hover:text-foreground size-3.5 shrink-0 transition-colors"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </Card>
  );
}
