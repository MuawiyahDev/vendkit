import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StockMovementReason,
  StockMovementType,
  type Product,
} from '@repo/database';
import {
  MANUAL_DECREASE_REASONS,
  MANUAL_INCREASE_REASONS,
  MANUAL_SET_REASONS,
  type InventorySortField,
  type InventoryStatus,
  type SortOrder,
} from './inventory.constants.js';
import type { StockStatus } from './inventory.types.js';

export type AdjustmentMode = 'increase' | 'decrease' | 'set';

export interface ResolvedAdjustment {
  quantityChange: number;
  newQuantity: number;
  type: StockMovementType;
}

export function deriveStockStatus(
  trackInventory: boolean,
  stockQuantity: number,
  lowStockThreshold: number | null,
): StockStatus {
  if (!trackInventory) {
    return 'untracked';
  }

  if (stockQuantity <= 0) {
    return 'out-of-stock';
  }

  if (lowStockThreshold !== null && stockQuantity <= lowStockThreshold) {
    return 'low-stock';
  }

  return 'in-stock';
}

export function buildInventoryOrderBy(
  sortBy: InventorySortField | undefined,
  sortOrder: SortOrder | undefined,
): Prisma.ProductOrderByWithRelationInput {
  const field = sortBy ?? 'stockQuantity';
  const order = sortOrder ?? (field === 'updatedAt' ? 'desc' : 'asc');

  switch (field) {
    case 'name':
      return { name: order };
    case 'sku':
      return { sku: order };
    case 'stockQuantity':
      return { stockQuantity: order };
    case 'lowStockThreshold':
      return { lowStockThreshold: order };
    case 'updatedAt':
      return { updatedAt: order };
    default:
      return { stockQuantity: order };
  }
}

export function buildInventoryStatusCondition(
  status: InventoryStatus,
  lowStockThresholdField: Prisma.FieldRef<'Product', 'Int'>,
): Prisma.ProductWhereInput | null {
  switch (status) {
    case 'all':
      return null;
    case 'untracked':
      return { trackInventory: false };
    case 'out-of-stock':
      return { trackInventory: true, stockQuantity: { lte: 0 } };
    case 'low-stock':
      return {
        trackInventory: true,
        stockQuantity: { gt: 0, lte: lowStockThresholdField },
      };
    case 'in-stock':
      return {
        trackInventory: true,
        OR: [
          { lowStockThreshold: null, stockQuantity: { gt: 0 } },
          { stockQuantity: { gt: lowStockThresholdField } },
        ],
      };
    default:
      return null;
  }
}

export function assertReasonAllowed(
  mode: AdjustmentMode,
  reason: StockMovementReason,
): void {
  const allowed =
    mode === 'increase'
      ? MANUAL_INCREASE_REASONS
      : mode === 'decrease'
        ? MANUAL_DECREASE_REASONS
        : MANUAL_SET_REASONS;

  if (!allowed.includes(reason)) {
    throw new BadRequestException(
      `Reason ${reason} cannot be used for a ${mode} adjustment`,
    );
  }
}

export function resolveAdjustment(
  product: Pick<Product, 'stockQuantity'>,
  mode: AdjustmentMode,
  quantity: number,
  reason: StockMovementReason,
): ResolvedAdjustment {
  assertReasonAllowed(mode, reason);

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new BadRequestException('Quantity must be a non-negative whole number');
  }

  if (mode !== 'set' && quantity < 1) {
    throw new BadRequestException('Quantity must be greater than zero');
  }

  let quantityChange: number;
  let newQuantity: number;

  if (mode === 'increase') {
    quantityChange = quantity;
    newQuantity = product.stockQuantity + quantity;
  } else if (mode === 'decrease') {
    quantityChange = -quantity;
    newQuantity = product.stockQuantity - quantity;
  } else {
    newQuantity = quantity;
    quantityChange = quantity - product.stockQuantity;
  }

  if (newQuantity < 0) {
    throw new BadRequestException(
      `Adjustment would reduce stock below zero; only ${product.stockQuantity} units are available`,
    );
  }

  if (quantityChange === 0) {
    throw new BadRequestException('Stock is already at the requested quantity');
  }

  let type: StockMovementType;

  if (mode === 'set') {
    type = StockMovementType.SET;
  } else if (mode === 'increase' && reason === StockMovementReason.CUSTOMER_RETURN) {
    type = StockMovementType.RETURN;
  } else if (mode === 'decrease' && reason === StockMovementReason.DAMAGED) {
    type = StockMovementType.DAMAGE;
  } else {
    type =
      mode === 'increase'
        ? StockMovementType.MANUAL_INCREASE
        : StockMovementType.MANUAL_DECREASE;
  }

  return { quantityChange, newQuantity, type };
}

export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}

export function mapInventoryErrors(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      return new NotFoundException('Inventory record no longer exists');
    }
    if (error.code === 'P2002') {
      return new ConflictException(
        'This adjustment was already applied by another request',
      );
    }
  }

  return error;
}
