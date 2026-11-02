import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { OrderBase } from "../api/orders-api";
import { formatCurrency, outstandingBalance } from "../utils/orders.utils";

interface OrderSummaryCardProps {
  order: OrderBase;
  className?: string;
}

interface SummaryRowProps {
  label: string;
  value: string;
  emphasize?: boolean;
}

function SummaryRow({ label, value, emphasize }: SummaryRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt
        className={cn(
          "text-sm",
          emphasize ? "text-foreground font-semibold" : "text-muted-foreground",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "text-sm whitespace-nowrap tabular-nums",
          emphasize
            ? "text-foreground text-base font-semibold"
            : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Monetary breakdown of an order exactly as stored by the backend, plus
 * the paid amount and any outstanding balance.
 */
export function OrderSummaryCard({ order, className }: OrderSummaryCardProps) {
  const outstanding = outstandingBalance(order);
  const currency = order.currency;

  return (
    <Card className={cn("gap-0 overflow-hidden py-0", className)}>
      <CardHeader className="border-border-subtle border-b py-5">
        <CardTitle className="text-base">Summary</CardTitle>
        <CardDescription>Totals calculated when the order was placed.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-3">
        <dl>
          <SummaryRow
            label="Subtotal"
            value={formatCurrency(order.subtotal, currency)}
          />
          <SummaryRow
            label="Discount"
            value={`− ${formatCurrency(order.discountAmount, currency)}`}
          />
          <SummaryRow
            label="Shipping"
            value={`+ ${formatCurrency(order.shippingFee, currency)}`}
          />
          <SummaryRow
            label="Tax"
            value={`+ ${formatCurrency(order.taxAmount, currency)}`}
          />
        </dl>
        <Separator className="my-2" />
        <dl>
          <SummaryRow
            label="Grand total"
            value={formatCurrency(order.totalAmount, currency)}
            emphasize
          />
        </dl>
        <Separator className="my-2" />
        <dl>
          <SummaryRow
            label="Amount paid"
            value={formatCurrency(order.amountPaid, currency)}
          />
          <SummaryRow
            label="Outstanding"
            value={formatCurrency(outstanding, currency)}
          />
        </dl>
      </CardContent>
    </Card>
  );
}
