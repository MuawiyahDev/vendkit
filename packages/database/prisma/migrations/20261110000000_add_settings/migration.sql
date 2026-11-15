-- CreateEnum
CREATE TYPE "CurrencyPosition" AS ENUM ('BEFORE', 'AFTER');

-- CreateEnum
CREATE TYPE "CurrencyDisplayFormat" AS ENUM ('SYMBOL', 'CODE', 'SYMBOL_AND_CODE');

-- CreateEnum
CREATE TYPE "TaxPricingMode" AS ENUM ('INCLUSIVE', 'EXCLUSIVE');

-- CreateEnum
CREATE TYPE "InvoiceDefaultStatus" AS ENUM ('DRAFT', 'ISSUED');

-- CreateTable
CREATE TABLE "BusinessProfileSettings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'default',
    "businessName" VARCHAR(200) NOT NULL DEFAULT 'VendKit',
    "legalName" VARCHAR(200),
    "logoImageId" TEXT,
    "email" VARCHAR(254),
    "phone" VARCHAR(30),
    "alternativePhone" VARCHAR(30),
    "website" VARCHAR(500),
    "description" VARCHAR(2000),
    "registrationNumber" VARCHAR(100),
    "taxIdentificationNumber" VARCHAR(100),
    "addressLine1" VARCHAR(500),
    "addressLine2" VARCHAR(500),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postalCode" VARCHAR(20),
    "country" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfileSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceSettings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'default',
    "useBusinessProfile" BOOLEAN NOT NULL DEFAULT true,
    "displayName" VARCHAR(200),
    "logoImageId" TEXT,
    "email" VARCHAR(254),
    "phone" VARCHAR(30),
    "addressLine1" VARCHAR(500),
    "addressLine2" VARCHAR(500),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postalCode" VARCHAR(20),
    "country" VARCHAR(100),
    "taxRegistrationNumber" VARCHAR(100),
    "additionalInfo" VARCHAR(2000),
    "numberPrefix" VARCHAR(20) NOT NULL DEFAULT 'INV',
    "numberFormat" VARCHAR(100) NOT NULL DEFAULT '{prefix}-{year}-{sequence}',
    "yearBasedNumbering" BOOLEAN NOT NULL DEFAULT true,
    "automaticNumbering" BOOLEAN NOT NULL DEFAULT true,
    "startingSequence" INTEGER NOT NULL DEFAULT 1,
    "duePeriodDays" INTEGER NOT NULL DEFAULT 30,
    "paymentTerms" VARCHAR(1000),
    "notes" VARCHAR(2000),
    "footerText" VARCHAR(1000),
    "currencyDisplayFormat" "CurrencyDisplayFormat" NOT NULL DEFAULT 'SYMBOL',
    "showSku" BOOLEAN NOT NULL DEFAULT true,
    "showTaxBreakdown" BOOLEAN NOT NULL DEFAULT true,
    "showDiscountBreakdown" BOOLEAN NOT NULL DEFAULT true,
    "defaultStatus" "InvoiceDefaultStatus" NOT NULL DEFAULT 'DRAFT',
    "allowEditingAfterIssue" BOOLEAN NOT NULL DEFAULT false,
    "allowCancellation" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionalSettings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'default',
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
    "currencySymbol" VARCHAR(8) NOT NULL DEFAULT '৳',
    "currencyPosition" "CurrencyPosition" NOT NULL DEFAULT 'BEFORE',
    "decimalPrecision" INTEGER NOT NULL DEFAULT 2,
    "thousandSeparator" VARCHAR(3) NOT NULL DEFAULT ',',
    "decimalSeparator" VARCHAR(3) NOT NULL DEFAULT '.',
    "defaultCountry" VARCHAR(2) NOT NULL DEFAULT 'BD',
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Asia/Dhaka',
    "dateFormat" VARCHAR(20) NOT NULL DEFAULT 'DD/MM/YYYY',
    "timeFormat" VARCHAR(20) NOT NULL DEFAULT 'HH:mm',
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionalSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxSettings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultName" VARCHAR(100) NOT NULL DEFAULT 'VAT',
    "defaultRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxIdentificationNumber" VARCHAR(100),
    "pricingMode" "TaxPricingMode" NOT NULL DEFAULT 'EXCLUSIVE',
    "showBreakdownOnInvoice" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderSettings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'default',
    "orderNumberPrefix" VARCHAR(20) NOT NULL DEFAULT 'ORD',
    "automaticNumbering" BOOLEAN NOT NULL DEFAULT true,
    "defaultStatus" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "defaultNotes" VARCHAR(2000),
    "allowEditing" BOOLEAN NOT NULL DEFAULT true,
    "requireCustomerInformation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSettings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'default',
    "enabledMethods" "PaymentMethod"[] DEFAULT ARRAY['CASH', 'BANK_TRANSFER', 'MOBILE_FINANCIAL_SERVICE', 'CARD', 'OTHER']::"PaymentMethod"[],
    "defaultMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "bankAccountName" VARCHAR(200),
    "bankName" VARCHAR(200),
    "accountNumber" VARCHAR(100),
    "branchName" VARCHAR(200),
    "routingNumber" VARCHAR(100),
    "paymentInstructions" VARCHAR(2000),
    "defaultPaymentTerms" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingSettings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultCharge" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "freeShippingThreshold" DECIMAL(12,2),
    "deliveryInstructions" VARCHAR(2000),
    "defaultDeliveryMethod" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'default',
    "businessNotificationEmail" VARCHAR(254),
    "orderConfirmationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "paymentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "invoiceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "senderName" VARCHAR(200) NOT NULL DEFAULT 'VendKit',
    "replyToEmail" VARCHAR(254),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSequence" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "year" INTEGER NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfileSettings_logoImageId_key" ON "BusinessProfileSettings"("logoImageId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceSettings_logoImageId_key" ON "InvoiceSettings"("logoImageId");

-- CreateIndex
CREATE INDEX "DocumentSequence_key_idx" ON "DocumentSequence"("key");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSequence_key_year_key" ON "DocumentSequence"("key", "year");

-- AddForeignKey
ALTER TABLE "BusinessProfileSettings" ADD CONSTRAINT "BusinessProfileSettings_logoImageId_fkey" FOREIGN KEY ("logoImageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceSettings" ADD CONSTRAINT "InvoiceSettings_logoImageId_fkey" FOREIGN KEY ("logoImageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

