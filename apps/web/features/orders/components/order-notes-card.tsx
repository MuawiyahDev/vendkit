import { Ban } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { OrderBase } from "../api/orders-api";
import { formatDateTime, formatOptionalValue } from "../utils/orders.utils";

interface OrderNotesCardProps {
  order: OrderBase;
}

interface NoteBlockProps {
  title: string;
  description: string;
  value: string | null;
}

function NoteBlock({ title, description, value }: NoteBlockProps) {
  return (
    <div className="py-3">
      <p className="text-foreground text-sm font-medium">{title}</p>
      <p className="text-muted-foreground text-xs">{description}</p>
      <p className="text-foreground mt-2 text-sm leading-relaxed whitespace-pre-wrap">
        {formatOptionalValue(value)}
      </p>
    </div>
  );
}

/** Customer-facing and internal notes, plus the cancellation record. */
export function OrderNotesCard({ order }: OrderNotesCardProps) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-border-subtle border-b py-5">
        <CardTitle className="text-base">Notes</CardTitle>
        <CardDescription>Notes recorded with this order.</CardDescription>
      </CardHeader>
      <CardContent className="divide-border-subtle divide-y px-6 py-1">
        <NoteBlock
          title="Customer note"
          description="Provided by the customer when the order was placed."
          value={order.customerNote}
        />
        <NoteBlock
          title="Internal note"
          description="Only visible to your team."
          value={order.internalNote}
        />

        {order.status === "CANCELLED" ? (
          <div className="py-3">
            <p className="text-destructive flex items-center gap-1.5 text-sm font-medium">
              <Ban className="size-4" aria-hidden="true" />
              Cancellation
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {order.cancelledAt
                ? `Cancelled ${formatDateTime(order.cancelledAt)}`
                : "Cancelled"}
            </p>
            {order.cancellationReason ? (
              <p className="text-foreground mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                {order.cancellationReason}
              </p>
            ) : (
              <p className="text-muted-foreground mt-2 text-sm">
                No reason was recorded.
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
