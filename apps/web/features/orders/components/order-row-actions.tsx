"use client";

import Link from "next/link";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { OrderSummary } from "../api/orders-api";
import { canDeleteOrder } from "../utils/orders.utils";
import { OrderWhatsAppAction } from "../whatsapp/components/order-whatsapp-action";

interface OrderRowActionsProps {
  order: OrderSummary;
  onDelete: (order: OrderSummary) => void;
  canMessage: boolean;
  onMessage: () => void;
}

export function OrderRowActions({
  order,
  onDelete,
  canMessage,
  onMessage,
}: OrderRowActionsProps) {
  const deletable = canDeleteOrder(order.status);
  const editable = order.status !== "CANCELLED";

  return (
    <div className="flex items-center justify-end gap-0.5">
      {canMessage ? (
        <OrderWhatsAppAction
          orderNumber={order.orderNumber}
          onSelect={onMessage}
        />
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for order ${order.orderNumber}`}
            className="text-muted-foreground group-hover:text-foreground group-focus-within:text-foreground data-[state=open]:bg-surface-active data-[state=open]:text-foreground"
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/orders/${order.id}`}>
              <Eye aria-hidden="true" />
              View details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild disabled={!editable}>
            <Link
              href={`/orders/${order.id}/edit`}
              aria-disabled={!editable}
              tabIndex={editable ? undefined : -1}
            >
              <Pencil aria-hidden="true" />
              Edit order
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={!deletable}
            onSelect={() => {
              onDelete(order);
            }}
          >
            <Trash2 aria-hidden="true" />
            Delete order
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
