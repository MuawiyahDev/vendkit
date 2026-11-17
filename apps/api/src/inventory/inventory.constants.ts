import { Prisma, StockMovementReason } from '@repo/database';

export const INVENTORY_PAGE_SIZE = 20;
export const INVENTORY_MAX_PAGE_SIZE = 100;

export const INVENTORY_STATUSES = [
  'all',
  'in-stock',
  'low-stock',
  'out-of-stock',
  'untracked',
] as const;

export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

export const INVENTORY_SORT_FIELDS = [
  'name',
  'sku',
  'stockQuantity',
  'lowStockThreshold',
  'updatedAt',
] as const;

export type InventorySortField = (typeof INVENTORY_SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;

export type SortOrder = (typeof SORT_ORDERS)[number];

export const MOVEMENT_SORT_ORDERS = ['asc', 'desc'] as const;

/**
 * Reasons a user may pick for a manual adjustment. Order lifecycle reasons
 * (sale, order edit, cancellation) are written by the system only.
 */
export const MANUAL_INCREASE_REASONS: readonly StockMovementReason[] = [
  StockMovementReason.RESTOCK,
  StockMovementReason.PURCHASE,
  StockMovementReason.CUSTOMER_RETURN,
  StockMovementReason.CORRECTION,
  StockMovementReason.OTHER,
];

export const MANUAL_DECREASE_REASONS: readonly StockMovementReason[] = [
  StockMovementReason.DAMAGED,
  StockMovementReason.LOST,
  StockMovementReason.CORRECTION,
  StockMovementReason.OTHER,
];

export const MANUAL_SET_REASONS: readonly StockMovementReason[] = [
  StockMovementReason.CORRECTION,
  StockMovementReason.OTHER,
];

export const INVENTORY_PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  images: {
    include: { image: true },
    orderBy: { sortOrder: 'asc' as const },
  },
} satisfies Prisma.ProductInclude;

export const STOCK_MOVEMENT_ORDER_INCLUDE = {
  order: { select: { id: true, orderNumber: true, status: true } },
} satisfies Prisma.StockMovementInclude;
