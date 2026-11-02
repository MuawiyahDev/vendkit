import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { OrderItem } from "../api/orders-api";
import { formatCurrency, formatItemCount } from "../utils/orders.utils";

interface OrderItemsCardProps {
  items: OrderItem[];
  currency: string;
}

/**
 * Ordered products with the unit price and line total captured at order
 * time. Items and prices cannot be edited after the order is created.
 */
export function OrderItemsCard({ items, currency }: OrderItemsCardProps) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-border-subtle border-b py-5">
        <CardTitle className="text-base">Items</CardTitle>
        <CardDescription>
          {formatItemCount(items.length)} · prices captured when the order was
          placed.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                Unit price
              </TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex max-w-[280px] flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {item.productName}
                    </span>
                    {item.sku ? (
                      <span className="text-muted-foreground truncate text-xs">
                        SKU {item.sku}
                      </span>
                    ) : null}
                    <span className="text-muted-foreground text-xs tabular-nums sm:hidden">
                      {formatCurrency(item.unitPrice, currency)} × {item.quantity}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden text-right text-sm whitespace-nowrap tabular-nums sm:table-cell">
                  {formatCurrency(item.unitPrice, currency)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.quantity}
                </TableCell>
                <TableCell className="text-right text-sm font-medium whitespace-nowrap tabular-nums">
                  {formatCurrency(item.lineTotal, currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
