import type { Prisma, StockMovementReason, StockMovementType } from '@repo/database';
import type {
  INVENTORY_PRODUCT_INCLUDE,
  STOCK_MOVEMENT_ORDER_INCLUDE,
} from './inventory.constants.js';

export type InventoryProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof INVENTORY_PRODUCT_INCLUDE;
}>;

export type StockMovementWithOrder = Prisma.StockMovementGetPayload<{
  include: typeof STOCK_MOVEMENT_ORDER_INCLUDE;
}>;

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'untracked';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InventoryImageResponse {
  id: string;
  url: string;
  altText: string | null;
}

export interface InventoryItemResponse {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  category: { id: string; name: string; slug: string };
  image: InventoryImageResponse | null;
  stockQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number | null;
  trackInventory: boolean;
  status: StockStatus;
  isActive: boolean;
  unit: string | null;
  updatedAt: Date;
}

export interface PaginatedInventory {
  data: InventoryItemResponse[];
  meta: PaginationMeta;
}

export interface InventoryOverviewResponse {
  totalProducts: number;
  totalAvailableStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  untrackedProducts: number;
}

export interface StockMovementResponse {
  id: string;
  productId: string | null;
  productName: string;
  sku: string | null;
  type: StockMovementType;
  reason: StockMovementReason;
  previousQuantity: number;
  quantityChange: number;
  newQuantity: number;
  note: string | null;
  order: {
    id: string;
    orderNumber: string;
    status: string;
  } | null;
  orderNumber: string | null;
  userId: string | null;
  userName: string | null;
  createdAt: Date;
}

export interface PaginatedStockMovements {
  data: StockMovementResponse[];
  meta: PaginationMeta;
}

export interface StockAdjustmentResult {
  item: InventoryItemResponse;
  movement: StockMovementResponse;
}

export interface RecordMovementInput {
  product: {
    id: string;
    name: string;
    sku: string | null;
  };
  type: StockMovementType;
  reason: StockMovementReason;
  previousQuantity: number;
  quantityChange: number;
  newQuantity: number;
  note?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  userId?: string | null;
  userName?: string | null;
  idempotencyKey?: string | null;
}

export interface StockActor {
  id: string;
  name: string | null;
  email: string;
}
