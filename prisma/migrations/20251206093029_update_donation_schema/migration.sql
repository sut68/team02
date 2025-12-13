<<<<<<< HEAD:prisma/migrations/20251206093029_update_donation_schema/migration.sql
/*
  Warnings:
=======
-- CreateEnum
--CREATE TYPE "ProjectStatus" AS ENUM ('OPEN', 'CLOSED', 'COMPLETED');
>>>>>>> 7b40a5ae0e79c535e3059cc27c5e3b6fe2f7ce1a:prisma/migrations/20251205101103_add_donation_project_payment_system/migration.sql

  - You are about to drop the column `omiseChargeId` on the `DonationTransaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paymentId]` on the table `DonationTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('PROMPTPAY', 'CREDIT_CARD', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentStatusType" AS ENUM ('CONFIRMED', 'CANCELLED', 'REFUNDED');

<<<<<<< HEAD:prisma/migrations/20251206093029_update_donation_schema/migration.sql
-- DropIndex
DROP INDEX "DonationTransaction_omiseChargeId_key";

-- AlterTable
ALTER TABLE "DonationTransaction" DROP COLUMN "omiseChargeId",
ADD COLUMN     "donorPhone" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "paymentId" INTEGER;
=======
-- CreateTable
-- CREATE TABLE "DonationProject" (
--     "id" SERIAL NOT NULL,
--     "title" TEXT NOT NULL,
--     "description" TEXT,
--     "goalAmount" DOUBLE PRECISION NOT NULL,
--     "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
--     "startDate" TIMESTAMP(3) NOT NULL,
--     "endDate" TIMESTAMP(3) NOT NULL,
--     "status" "ProjectStatus" NOT NULL DEFAULT 'OPEN',
--     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     "updatedAt" TIMESTAMP(3) NOT NULL,
>>>>>>> 7b40a5ae0e79c535e3059cc27c5e3b6fe2f7ce1a:prisma/migrations/20251205101103_add_donation_project_payment_system/migration.sql

--     CONSTRAINT "DonationProject_pkey" PRIMARY KEY ("id")
-- );
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
<<<<<<< HEAD:prisma/migrations/20251206093029_update_donation_schema/migration.sql

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_paymentRefId_key" ON "PaymentRecord"("paymentRefId");
=======
DROP TABLE IF EXISTS "DonationTransaction";
--CreateTable
CREATE TABLE "DonationTransaction" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "donorName" TEXT,
    "donorEmail" TEXT,
    "donorPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,
    "projectId" INTEGER NOT NULL,
    "paymentId" INTEGER,
>>>>>>> 7b40a5ae0e79c535e3059cc27c5e3b6fe2f7ce1a:prisma/migrations/20251205101103_add_donation_project_payment_system/migration.sql

-- CreateIndex
CREATE INDEX "PaymentRecord_paymentStatus_idx" ON "PaymentRecord"("paymentStatus");

-- CreateIndex
CREATE INDEX "PaymentRecord_createdAt_idx" ON "PaymentRecord"("createdAt");

-- CreateIndex
CREATE INDEX "DonationProject_status_idx" ON "DonationProject"("status");

-- CreateIndex
CREATE INDEX "DonationProject_startDate_idx" ON "DonationProject"("startDate");

-- CreateIndex
CREATE INDEX "DonationProject_endDate_idx" ON "DonationProject"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "DonationTransaction_paymentId_key" ON "DonationTransaction"("paymentId");

-- CreateIndex
CREATE INDEX "DonationTransaction_userId_idx" ON "DonationTransaction"("userId");

-- CreateIndex
CREATE INDEX "DonationTransaction_projectId_idx" ON "DonationTransaction"("projectId");

-- CreateIndex
CREATE INDEX "DonationTransaction_status_idx" ON "DonationTransaction"("status");

-- CreateIndex
CREATE INDEX "DonationTransaction_createdAt_idx" ON "DonationTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethodRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationTransaction" ADD CONSTRAINT "DonationTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PaymentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
