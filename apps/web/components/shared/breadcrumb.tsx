import Link from "next/link";

import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  /** Destination for intermediate crumbs; the final item is the current page. */
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Hierarchical breadcrumb trail for nested dashboard pages. The last item
 * is rendered as the current page; long labels (e.g. product names) are
 * truncated so the trail never wraps awkwardly on narrow screens.
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex min-w-0 items-center gap-1.5"
            >
              {index > 0 ? (
                <ChevronRight
                  className="text-muted-foreground/50 size-3.5 shrink-0"
                  aria-hidden="true"
                />
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground max-w-[10rem] truncate underline-offset-4 transition-colors hover:underline sm:max-w-[16rem]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="text-foreground max-w-[12rem] truncate font-medium sm:max-w-[24rem]"
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
