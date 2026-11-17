import type {
  InventoryItemResponse,
  InventoryProductWithRelations,
  StockMovementResponse,
  StockMovementWithOrder,
} from './inventory.types.js';
import { deriveStockStatus } from './inventory.utils.js';

const IMAGE_API_ROUTE = '/api/images';

export function toInventoryItemResponse(
  product: InventoryProductWithRelations,
): InventoryItemResponse {
  const primary =
    product.images.find((association) => association.isPrimary) ??
    product.images[0];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    category: product.category,
    image: primary
      ? {
          id: primary.image.id,
          url: `${IMAGE_API_ROUTE}/${primary.image.id}/file`,
          altText: primary.image.altText,
        }
      : null,
    stockQuantity: product.stockQuantity,
    availableQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
    trackInventory: product.trackInventory,
    status: deriveStockStatus(
      product.trackInventory,
      product.stockQuantity,
      product.lowStockThreshold,
    ),
    isActive: product.isActive,
    unit: product.unit,
    updatedAt: product.updatedAt,
  };
}

export function toStockMovementResponse(
  movement: StockMovementWithOrder,
): StockMovementResponse {
  return {
    id: movement.id,
    productId: movement.productId,
    productName: movement.productName,
    sku: movement.sku,
    type: movement.type,
    reason: movement.reason,
    previousQuantity: movement.previousQuantity,
    quantityChange: movement.quantityChange,
    newQuantity: movement.newQuantity,
    note: movement.note,
    order: movement.order
      ? {
          id: movement.order.id,
          orderNumber: movement.order.orderNumber,
          status: movement.order.status,
        }
      : null,
    orderNumber: movement.orderNumber,
    userId: movement.userId,
    userName: movement.userName,
    createdAt: movement.createdAt,
  };
}
