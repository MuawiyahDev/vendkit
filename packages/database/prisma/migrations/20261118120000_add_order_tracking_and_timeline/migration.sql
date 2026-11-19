-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'TIKTOK', 'WEBSITE', 'PHONE', 'WALK_IN', 'OTHER');

-- CreateEnum
CREATE TYPE "OrderEventType" AS ENUM ('ORDER_CREATED', 'DETAILS_UPDATED', 'ITEMS_UPDATED', 'STATUS_CHANGED', 'PAYMENT_RECORDED', 'PAYMENT_STATUS_CHANGED', 'RETURN_RECORDED', 'INVOICE_CREATED', 'INVOICE_ISSUED', 'INVOICE_CANCELLED');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "phoneNormalized" VARCHAR(20);

-- Backfill the duplicate-detection key for existing customers.
UPDATE "Customer"
SET "phoneNormalized" = LEFT(REGEXP_REPLACE("phone", '[^0-9]', '', 'g'), 20);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "source" "OrderSource" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "shippingCarrier" VARCHAR(100),
ADD COLUMN "trackingNumber" VARCHAR(100);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "OrderEventType" NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "metadata" JSONB,
    "actorId" TEXT,
    "actorName" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_phoneNormalized_idx" ON "Customer"("phoneNormalized");

-- CreateIndex
CREATE INDEX "Order_source_createdAt_idx" ON "Order"("source", "createdAt");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_createdAt_idx" ON "OrderEvent"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderEvent_type_createdAt_idx" ON "OrderEvent"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
