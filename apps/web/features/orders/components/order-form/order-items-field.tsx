"use client";

import { Plus, Trash2 } from "lucide-react";
import type { UseFormRegister } from "react-hook-form";

import { FieldError } from "@/components/shared/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductThumbnail } from "@/features/products/components/product-thumbnail";
import type { Product } from "@/features/products/api/products-api";
import { formatAmount } from "@/lib/format";

import type {
  OrderCreateFormValues,
  OrderItemFieldValue,
} from "../../schemas/orders.schemas";
import { MAX_ORDER_ITEM_QUANTITY } from "../../schemas/orders.schemas";
import { getPrimaryImageUrl } from "./product-picker-dialog";

const QUANTITY_ERROR_PREFIX = "order-item-quantity-error";

interface OrderItemsFieldProps {
  /** Registered form fields managed by `useFieldArray`. */
  fields: { id: string; productId: string; quantity: number }[];
  /** Live watched values, used to render stock warnings and line totals. */
  items: OrderItemFieldValue[];
  products: Record<string, Product>;
  register: UseFormRegister<OrderCreateFormValues>;
  quantityErrorFor: (index: number) => string | undefined;
  isSubmitting: boolean;
  onRemove: (index: number) => void;
  onAddProducts: () => void;
}

/**
 * Dynamic order line editor. Quantities are validated against the client's
 * stock snapshot as a courtesy; the backend re-checks stock and prices at
 * creation time and remains authoritative.
 */
export function OrderItemsField({
  fields,
  items,
  products,
  register,
  quantityErrorFor,
  isSubmitting,
  onRemove,
  onAddProducts,
}: OrderItemsFieldProps) {
  return (
    <div className="flex flex-col gap-4">
      {fields.length === 0 ? (
        <p className="border-border-subtle text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
          No products added yet. Search your catalog to add the first item.
        </p>
      ) : (
        <ul className="border-border-subtle divide-border-subtle flex flex-col divide-y rounded-lg border">
          {fields.map((field, index) => {
            const item = items[index];
            const product = item ? products[item.productId] : undefined;
            const quantity =
              item && Number.isFinite(item.quantity) ? item.quantity : 0;
            const lineTotal = product
              ? Math.round(
                  (Number(product.sellingPrice) * quantity + Number.EPSILON) *
                    100,
                ) / 100
              : 0;
            const overStock =
              product !== undefined && quantity > product.stockQuantity;
            const quantityError = quantityErrorFor(index);

            return (
              <li
                key={field.id}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center"
              >
                <span className="border-border-subtle bg-surface-muted size-10 shrink-0 overflow-hidden rounded-md border">
                  {product ? (
                    <ProductThumbnail
                      src={getPrimaryImageUrl(product)}
                      alt={product.name}
                      className="size-full"
                    />
                  ) : null}
                </span>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className="text-foreground truncate text-sm font-medium"
                    title={product?.name}
                  >
                    {product?.name ?? "Unknown product"}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {product?.sku ? `SKU ${product.sku} · ` : ""}
                    {formatAmount(product?.sellingPrice ?? 0)} per unit
                  </span>
                  {overStock ? (
                    <span className="text-destructive text-xs font-medium">
                      Only {product?.stockQuantity} units in stock
                    </span>
                  ) : null}
                  <FieldError
                    id={`${QUANTITY_ERROR_PREFIX}-${index}`}
                    message={quantityError}
                  />
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor={`order-item-quantity-${index}`}
                      className="text-muted-foreground text-xs"
                    >
                      Qty
                    </label>
                    <Input
                      id={`order-item-quantity-${index}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={MAX_ORDER_ITEM_QUANTITY}
                      step={1}
                      aria-invalid={Boolean(quantityError)}
                      aria-describedby={
                        quantityError
                          ? `${QUANTITY_ERROR_PREFIX}-${index}`
                          : undefined
                      }
                      disabled={isSubmitting}
                      className="w-20 text-right tabular-nums"
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  <div className="flex flex-col gap-1 sm:items-end">
                    <span className="text-muted-foreground text-xs">
                      Line total
                    </span>
                    <span className="text-foreground text-sm font-semibold tabular-nums">
                      {formatAmount(lineTotal)}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemove(index)}
                    disabled={isSubmitting}
                    aria-label={`Remove ${product?.name ?? "item"}`}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <Button
          type="button"
          variant="outline"
          onClick={onAddProducts}
          disabled={isSubmitting}
        >
          <Plus aria-hidden="true" />
          {fields.length === 0 ? "Add product" : "Add another product"}
        </Button>
        <p className="text-muted-foreground mt-2 text-xs">
          An order can contain up to 100 lines. Adding a product already on
          the order increases its quantity.
        </p>
      </div>
    </div>
  );
}
