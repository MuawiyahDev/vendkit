-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "guestPhone" TEXT,
ALTER COLUMN "customerId" DROP NOT NULL;
