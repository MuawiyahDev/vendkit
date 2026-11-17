import type {
  StockAdjustmentMode,
  StockMovementReason,
  StockMovementType,
  StockStatus,
} from "../api/inventory-api";

export const STATUS_LABELS: Record<StockStatus, string> = {
  "in-stock": "In stock",
  "low-stock": "Low stock",
  "out-of-stock": "Out of stock",
  untracked: "Not tracked",
};

export const MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  INITIAL: "Initial stock",
  MANUAL_INCREASE: "Manual increase",
  MANUAL_DECREASE: "Manual decrease",
  SET: "Quantity set",
  ORDER_PLACED: "Order placed",
  ORDER_UPDATED: "Order updated",
  ORDER_CANCELLED: "Order cancelled",
  ORDER_DELETED: "Order deleted",
  RETURN: "Return",
  DAMAGE: "Damage",
};

export const REASON_LABELS: Record<StockMovementReason, string> = {
  INITIAL_STOCK: "Opening stock",
  RESTOCK: "Restock",
  PURCHASE: "Purchase",
  CUSTOMER_RETURN: "Customer return",
  DAMAGED: "Damaged goods",
  LOST: "Lost goods",
  CORRECTION: "Stock correction",
  SALE: "Sale",
  ORDER_CANCELLED: "Order cancelled",
  ORDER_EDITED: "Order edited",
  ORDER_DELETED: "Order deleted",
  OTHER: "Other",
};

export const INCREASE_REASONS: StockMovementReason[] = [
  "RESTOCK",
  "PURCHASE",
  "CUSTOMER_RETURN",
  "CORRECTION",
  "OTHER",
];

export const DECREASE_REASONS: StockMovementReason[] = [
  "DAMAGED",
  "LOST",
  "CORRECTION",
  "OTHER",
];

export const SET_REASONS: StockMovementReason[] = ["CORRECTION", "OTHER"];

export function reasonsForMode(mode: StockAdjustmentMode): StockMovementReason[] {
  if (mode === "increase") {
    return INCREASE_REASONS;
  }
  if (mode === "decrease") {
    return DECREASE_REASONS;
  }
  return SET_REASONS;
}

export function resolveProjectedStock(
  current: number,
  mode: StockAdjustmentMode,
  quantity: number,
): number {
  if (mode === "increase") {
    return current + quantity;
  }
  if (mode === "decrease") {
    return current - quantity;
  }
  return quantity;
}

export function signedQuantity(value: number): string {
  return value > 0 ? `+${value.toLocaleString()}` : value.toLocaleString();
}

export function stockStatusFor(
  trackInventory: boolean,
  stockQuantity: number,
  lowStockThreshold: number | null,
): StockStatus {
  if (!trackInventory) {
    return "untracked";
  }
  if (stockQuantity <= 0) {
    return "out-of-stock";
  }
  if (lowStockThreshold !== null && stockQuantity <= lowStockThreshold) {
    return "low-stock";
  }
  return "in-stock";
}
