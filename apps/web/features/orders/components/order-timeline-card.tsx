import {
  ArrowRightLeft,
  CircleDollarSign,
  FileText,
  PackagePlus,
  Pencil,
  RotateCcw,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { OrderEvent, OrderEventType } from "../api/orders-api";
import { formatDateTime } from "../utils/orders.utils";

const EVENT_ICONS: Record<OrderEventType, LucideIcon> = {
  ORDER_CREATED: PackagePlus,
  DETAILS_UPDATED: Pencil,
  ITEMS_UPDATED: Pencil,
  STATUS_CHANGED: ArrowRightLeft,
  PAYMENT_RECORDED: CircleDollarSign,
  PAYMENT_STATUS_CHANGED: CircleDollarSign,
  RETURN_RECORDED: RotateCcw,
  INVOICE_CREATED: FileText,
  INVOICE_ISSUED: ReceiptText,
  INVOICE_CANCELLED: ReceiptText,
};

interface OrderTimelineCardProps {
  events: OrderEvent[];
}

/**
 * Chronological history of the order, including status changes, payments,
 * returns and invoices. Every entry is written by the backend in the same
 * transaction as the change it describes.
 */
export function OrderTimelineCard({ events }: OrderTimelineCardProps) {
  const ordered = [...events].reverse();

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-border-subtle border-b py-5">
        <CardTitle className="text-base">Activity</CardTitle>
        <CardDescription>
          Everything that has happened to this order.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-4">
        {ordered.length === 0 ? (
          <p className="text-muted-foreground py-2 text-sm">
            No activity has been recorded yet.
          </p>
        ) : (
          <ol className="flex flex-col">
            {ordered.map((event, index) => {
              const Icon = EVENT_ICONS[event.type] ?? Pencil;
              const isLast = index === ordered.length - 1;

              return (
                <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {!isLast ? (
                    <span
                      aria-hidden="true"
                      className="bg-border absolute top-8 bottom-0 left-[0.9375rem] w-px"
                    />
                  ) : null}
                  <span
                    className={cn(
                      "bg-surface-muted text-muted-foreground ring-border-subtle relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-inset",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
                    <p className="text-foreground text-sm break-words">
                      {event.message}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(event.createdAt)}
                      {event.actorName ? ` · ${event.actorName}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
