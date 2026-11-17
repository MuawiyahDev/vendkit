-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM (
  'INITIAL',
  'MANUAL_INCREASE',
  'MANUAL_DECREASE',
  'SET',
  'ORDER_PLACED',
  'ORDER_UPDATED',
  'ORDER_CANCELLED',
  'ORDER_DELETED',
  'RETURN',
  'DAMAGE'
);

-- CreateEnum
CREATE TYPE "StockMovementReason" AS ENUM (
  'INITIAL_STOCK',
  'RESTOCK',
  'PURCHASE',
  'CUSTOMER_RETURN',
  'DAMAGED',
  'LOST',
  'CORRECTION',
  'SALE',
  'ORDER_CANCELLED',
  'ORDER_EDITED',
  'ORDER_DELETED',
  'OTHER'
);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "trackInventory" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "trackedInventory" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "StockMovement" (
  "id" TEXT NOT NULL,
  "productId" TEXT,
  "productName" TEXT NOT NULL,
  "sku" TEXT,
  "type" "StockMovementType" NOT NULL,
  "reason" "StockMovementReason" NOT NULL,
  "previousQuantity" INTEGER NOT NULL,
  "quantityChange" INTEGER NOT NULL,
  "newQuantity" INTEGER NOT NULL,
  "note" TEXT,
  "orderId" TEXT,
  "orderNumber" TEXT,
  "userId" TEXT,
  "userName" TEXT,
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_idempotencyKey_key" ON "StockMovement"("idempotencyKey");

-- CreateIndex
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_orderId_createdAt_idx" ON "StockMovement"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_type_createdAt_idx" ON "StockMovement"("type", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "Product_trackInventory_stockQuantity_idx" ON "Product"("trackInventory", "stockQuantity");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Guard against negative stock at the database level.
ALTER TABLE "Product" ADD CONSTRAINT "Product_stockQuantity_nonnegative" CHECK ("stockQuantity" >= 0);
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_newQuantity_nonnegative" CHECK ("newQuantity" >= 0);
