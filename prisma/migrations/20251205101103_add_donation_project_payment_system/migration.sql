-- Note: ProjectStatus enum already created in migration 20251205043711_create_donation_models
-- CREATE TYPE "ProjectStatus" AS ENUM ('OPEN', 'CLOSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('PROMPTPAY', 'CREDIT_CARD', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentStatusType" AS ENUM ('CONFIRMED', 'CANCELLED', 'REFUNDED');

-- Note: DonationProject table already created in migration 20251205043711_create_donation_models
-- CREATE TABLE "DonationProject" ...

-- CreateTable
CREATE TABLE "PaymentMethodRecord" (
    "id" SERIAL NOT NULL,
    "methodName" "PaymentMethodType" NOT NULL DEFAULT 'PROMPTPAY',
    "accountNumber" TEXT,
    "provider" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethodRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" SERIAL NOT NULL,
    "paymentRefId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "transactionCode" TEXT,
    "paymentSlipUrl" TEXT,
    "paymentStatus" "PaymentStatusType" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentMethodId" INTEGER,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- Note: DonationTransaction table already created in migration 20251205043711_create_donation_models
-- Add new columns to existing DonationTransaction table
ALTER TABLE "DonationTransaction" 
    ADD COLUMN IF NOT EXISTS "message" TEXT,
    ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "donorPhone" TEXT,
    ADD COLUMN IF NOT EXISTS "paymentId" INTEGER;

-- Drop the old omiseChargeId unique constraint if it exists and column if needed
-- (keeping omiseChargeId column for backward compatibility, but making it nullable)
ALTER TABLE "DonationTransaction" 
    ALTER COLUMN "omiseChargeId" DROP NOT NULL;

-- CreateIndex (using IF NOT EXISTS for safety)
CREATE INDEX IF NOT EXISTS "DonationProject_status_idx" ON "DonationProject"("status");

CREATE INDEX IF NOT EXISTS "DonationProject_startDate_idx" ON "DonationProject"("startDate");

CREATE INDEX IF NOT EXISTS "DonationProject_endDate_idx" ON "DonationProject"("endDate");

-- CreateIndex (using IF NOT EXISTS for safety)
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentRecord_paymentRefId_key" ON "PaymentRecord"("paymentRefId");

CREATE INDEX IF NOT EXISTS "PaymentRecord_paymentStatus_idx" ON "PaymentRecord"("paymentStatus");

CREATE INDEX IF NOT EXISTS "PaymentRecord_createdAt_idx" ON "PaymentRecord"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "DonationTransaction_paymentId_key" ON "DonationTransaction"("paymentId");

CREATE INDEX IF NOT EXISTS "DonationTransaction_userId_idx" ON "DonationTransaction"("userId");

CREATE INDEX IF NOT EXISTS "DonationTransaction_projectId_idx" ON "DonationTransaction"("projectId");

CREATE INDEX IF NOT EXISTS "DonationTransaction_status_idx" ON "DonationTransaction"("status");

CREATE INDEX IF NOT EXISTS "DonationTransaction_createdAt_idx" ON "DonationTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethodRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Note: DonationTransaction foreign keys for userId and projectId already exist from migration 20251205043711_create_donation_models
-- Only add the new paymentId foreign key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'DonationTransaction_paymentId_fkey'
    ) THEN
        ALTER TABLE "DonationTransaction" 
        ADD CONSTRAINT "DonationTransaction_paymentId_fkey" 
        FOREIGN KEY ("paymentId") REFERENCES "PaymentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
