"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

import { recordOrderReturn, type Order } from "../api/orders-api";

interface OrderReturnDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (order: Order) => void;
}

/**
 * Explicitly restocks returned units against this order. The backend caps
 * each product at the ordered quantity minus previous returns.
 */
export function OrderReturnDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: OrderReturnDialogProps) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedLines = useMemo(
    () =>
      order.items
        .map((item) => ({
          item,
          quantity: Number(quantities[item.productId] ?? "0"),
        }))
        .filter((line) => Number.isInteger(line.quantity) && line.quantity > 0),
    [order.items, quantities],
  );

  async function handleSubmit() {
    setError(null);

    if (selectedLines.length === 0) {
      setError("Enter a return quantity for at least one product");
      return;
    }

    const overLimit = selectedLines.find(
      (line) => line.quantity > line.item.quantity,
    );
    if (overLimit) {
      setError(
        `Only ${overLimit.item.quantity} units of ${overLimit.item.productName} were ordered`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await recordOrderReturn(order.id, {
        items: selectedLines.map((line) => ({
          productId: line.item.productId,
          quantity: line.quantity,
        })),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      onSuccess(updated);
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Something went wrong while recording the return.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-border-subtle border-b px-6 py-5 pr-14 text-left">
          <DialogTitle>Record a return</DialogTitle>
          <DialogDescription>
            Returned units are added back to stock and recorded against this
            order. Only use this when the products physically came back.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-6 py-5">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <ul className="divide-border-subtle flex flex-col divide-y rounded-lg border">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-3.5 py-3"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">
                    {item.productName}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {item.sku ? `SKU ${item.sku} · ` : ""}Ordered{" "}
                    {item.quantity.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor={`return-${item.id}`}
                    className="text-muted-foreground text-xs"
                  >
                    Return
                  </Label>
                  <Input
                    id={`return-${item.id}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={item.quantity}
                    step={1}
                    value={quantities[item.productId] ?? ""}
                    onChange={(event) =>
                      setQuantities((current) => ({
                        ...current,
                        [item.productId]: event.target.value,
                      }))
                    }
                    placeholder="0"
                    disabled={isSubmitting}
                    className={cn("w-20 text-right tabular-nums")}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2">
            <Label htmlFor="return-note">
              Note{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="return-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Reason for the return or condition of the items"
              maxLength={2000}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter className="border-border-subtle bg-surface-muted/40 rounded-b-xl border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || selectedLines.length === 0}
          >
            <RotateCcw aria-hidden="true" />
            {isSubmitting ? "Restocking…" : "Restock returned items"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
