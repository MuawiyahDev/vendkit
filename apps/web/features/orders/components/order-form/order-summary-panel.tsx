"use client";

import { Info } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/features/products/api/products-api";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { OrderItemFieldValue } from "../../schemas/orders.schemas";
import { computeTotal, parseAmount } from "../../utils/orders.utils";

interface OrderSummaryPanelProps {
  items: OrderItemFieldValue[];
  products: Record<string, Product>;
  discountAmount: string;
  shippingFee: string;
  taxAmount: string;
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
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
          emphasize && "text-foreground text-base font-semibold",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Live order-total preview while composing an order. Unit prices come from
 * the selected products; the backend always recomputes the authoritative
 * totals when the order is created.
 */
export function OrderSummaryPanel({
  items,
  products,
  discountAmount,
  shippingFee,
  taxAmount,
}: OrderSummaryPanelProps) {
  const subtotal = items.reduce((sum, item) => {
    const product = products[item.productId];
    if (!product) {
      return sum;
    }
    const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
    return sum + parseAmount(product.sellingPrice) * quantity;
  }, 0);

  const discount = parseAmount(discountAmount);
  const shipping = parseAmount(shippingFee);
  const tax = parseAmount(taxAmount);
  const total = computeTotal(subtotal, discount, shipping, tax);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-border-subtle border-b py-5">
        <CardTitle className="text-base">Order summary</CardTitle>
        <CardDescription>
          Estimated from the products and charges above.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-3">
        <dl>
          <Row label="Subtotal" value={formatAmount(subtotal)} />
          <Row label="Discount" value={`− ${formatAmount(discount)}`} />
          <Row label="Shipping" value={`+ ${formatAmount(shipping)}`} />
          <Row label="Tax" value={`+ ${formatAmount(tax)}`} />
        </dl>
        <Separator className="my-2" />
        <dl>
          <Row label="Grand total" value={formatAmount(total)} emphasize />
        </dl>
        <p className="text-muted-foreground mt-3 flex items-start gap-1.5 text-xs leading-relaxed">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Preview only — the server calculates the final totals from current
          product prices when the order is placed.
        </p>
      </CardContent>
    </Card>
  );
}
