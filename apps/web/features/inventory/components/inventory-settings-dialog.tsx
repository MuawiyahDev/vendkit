"use client";

import { AlertCircle } from "lucide-react";
import { useState } from "react";

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
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";

import {
  updateInventorySettings,
  type InventoryItem,
} from "../api/inventory-api";

interface InventorySettingsDialogProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (item: InventoryItem) => void;
}

export function InventorySettingsDialog({
  item,
  open,
  onOpenChange,
  onSaved,
}: InventorySettingsDialogProps) {
  const [trackInventory, setTrackInventory] = useState(item.trackInventory);
  const [threshold, setThreshold] = useState(
    item.lowStockThreshold === null ? "" : String(item.lowStockThreshold),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);

    const trimmed = threshold.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);

    if (
      parsed !== null &&
      (!Number.isInteger(parsed) || parsed < 0)
    ) {
      setError("The threshold must be a non-negative whole number");
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await updateInventorySettings(item.id, {
        trackInventory,
        lowStockThreshold: parsed,
      });
      onSaved(updated);
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Something went wrong while saving inventory settings.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tracking & threshold</DialogTitle>
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

        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="track-inventory">Track inventory</Label>
              <p className="text-muted-foreground text-xs leading-relaxed">
                When disabled, orders for this product do not check or change
                stock. Existing quantities are kept.
              </p>
            </div>
            <Switch
              id="track-inventory"
              checked={trackInventory}
              onCheckedChange={setTrackInventory}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="low-stock-threshold">
              Low-stock threshold{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="low-stock-threshold"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
              placeholder="e.g. 5"
              disabled={isSubmitting || !trackInventory}
              className="tabular-nums"
            />
            <p className="text-muted-foreground text-xs">
              The product is flagged as low stock when available units reach
              this number or below. Zero or fewer units are always out of
              stock.
            </p>
          </div>
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
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving…" : "Save settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
