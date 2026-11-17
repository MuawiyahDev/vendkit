"use client";

import { AlertCircle, Minus, MoveRight, Plus } from "lucide-react";
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

import {
  adjustStock,
  type InventoryItem,
  type StockAdjustmentMode,
  type StockAdjustmentResult,
  type StockMovementReason,
} from "../api/inventory-api";
import {
  REASON_LABELS,
  reasonsForMode,
  resolveProjectedStock,
  signedQuantity,
} from "../utils/inventory.utils";

interface StockAdjustDialogProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdjusted: (result: StockAdjustmentResult) => void;
}

const MODES: { value: StockAdjustmentMode; label: string }[] = [
  { value: "increase", label: "Add" },
  { value: "decrease", label: "Remove" },
  { value: "set", label: "Set" },
];

export function StockAdjustDialog({
  item,
  open,
  onOpenChange,
  onAdjusted,
}: StockAdjustDialogProps) {
  const [mode, setMode] = useState<StockAdjustmentMode>("increase");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState<StockMovementReason>("RESTOCK");
  const [note, setNote] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = useMemo(() => reasonsForMode(mode), [mode]);
  const parsedQuantity = Number(quantity);
  const isQuantityValid =
    Number.isInteger(parsedQuantity) &&
    (mode === "set" ? parsedQuantity >= 0 : parsedQuantity >= 1);
  const projected =
    item && isQuantityValid
      ? resolveProjectedStock(item.stockQuantity, mode, parsedQuantity)
      : null;
  const change =
    item && projected !== null ? projected - item.stockQuantity : null;
  const invalidProjection = projected !== null && projected < 0;
  const noChange = change === 0;

  function selectMode(nextMode: StockAdjustmentMode) {
    setMode(nextMode);
    const allowed = reasonsForMode(nextMode);
    if (!allowed.includes(reason)) {
      setReason(allowed[0] ?? "OTHER");
    }
    setError(null);
  }

  async function handleSubmit() {
    setError(null);

    if (!isQuantityValid) {
      setError("Enter a valid whole number");
      return;
    }

    if (invalidProjection) {
      setError(
        `Only ${item.stockQuantity.toLocaleString()} units are available to remove`,
      );
      return;
    }

    if (noChange) {
      setError("Stock is already at the requested quantity");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await adjustStock(item.id, {
        mode,
        quantity: parsedQuantity,
        reason,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(orderNumber.trim()
          ? { orderNumber: orderNumber.trim().toUpperCase() }
          : {}),
        idempotencyKey,
      });

      onAdjusted(result);
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Something went wrong while adjusting stock.",
      );
      // Keep the same key only if the server rejected the request before
      // applying it. A fresh key would risk double-applying on retry.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {item.name}
            {item.sku ? ` · ${item.sku}` : ""}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Adjustment</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {MODES.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={mode === option.value ? "default" : "outline"}
                  onClick={() => selectMode(option.value)}
                  disabled={isSubmitting}
                >
                  {option.value === "increase" ? (
                    <Plus aria-hidden="true" />
                  ) : option.value === "decrease" ? (
                    <Minus aria-hidden="true" />
                  ) : null}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="adjust-quantity">
                {mode === "set" ? "New quantity" : "Quantity"}
              </Label>
              <Input
                id="adjust-quantity"
                type="number"
                inputMode="numeric"
                min={mode === "set" ? 0 : 1}
                step={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={isSubmitting}
                aria-invalid={!isQuantityValid || invalidProjection}
                className="tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="adjust-reason">Reason</Label>
              <select
                id="adjust-reason"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value as StockMovementReason)
                }
                disabled={isSubmitting}
                className="border-input bg-surface text-foreground hover:bg-surface-hover focus-visible:border-ring focus-visible:ring-ring/40 h-9 w-full rounded-md border px-3 text-sm shadow-xs transition-[color,background-color,border-color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
              >
                {reasons.map((value) => (
                  <option key={value} value={value}>
                    {REASON_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {reason === "CUSTOMER_RETURN" && mode === "increase" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="adjust-order-number">
                Related order number{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="adjust-order-number"
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="ORD-20261117-ABC123"
                autoComplete="off"
                disabled={isSubmitting}
                className="font-mono text-sm"
              />
              <p className="text-muted-foreground text-xs">
                Links the return to an order and prevents returning more units
                than were purchased.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="adjust-note">
              Note{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="adjust-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What happened to this stock?"
              maxLength={500}
              disabled={isSubmitting}
            />
          </div>

          {projected !== null ? (
            <div
              className={cn(
                "border-border-subtle bg-surface-muted/60 flex flex-wrap items-center gap-3 rounded-lg border px-3.5 py-3",
                invalidProjection && "border-destructive/30 bg-destructive-soft",
              )}
            >
              <span className="text-muted-foreground text-xs">Current</span>
              <span className="text-sm font-semibold tabular-nums">
                {item.stockQuantity.toLocaleString()}
              </span>
              <MoveRight
                className="text-muted-foreground size-4"
                aria-hidden="true"
              />
              <span className="text-muted-foreground text-xs">New</span>
              <span className="text-sm font-semibold tabular-nums">
                {projected.toLocaleString()}
              </span>
              {change !== null && change !== 0 ? (
                <span
                  className={cn(
                    "ml-auto text-xs font-medium tabular-nums",
                    change > 0
                      ? "text-success-soft-foreground"
                      : "text-destructive-soft-foreground",
                  )}
                >
                  {signedQuantity(change)}
                </span>
              ) : null}
            </div>
          ) : null}

          <p className="text-muted-foreground text-xs leading-relaxed">
            Every adjustment is recorded in stock movement history with the
            previous and new quantity.
          </p>
        </div>

        <DialogFooter>
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
            disabled={
              isSubmitting || !isQuantityValid || invalidProjection || noChange
            }
          >
            {isSubmitting ? "Applying…" : "Apply adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
