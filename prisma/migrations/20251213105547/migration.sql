/*
  Warnings:

  - The values [EVENT,ANNOUNCEMENT,GENERAL] on the enum `ContentCategoryType` will be removed. If these variants are still used in the database, this will fail.
  - The values [EVENT] on the enum `EntitlementSource` will be removed. If these variants are still used in the database, this will fail.
  - The values [DRAFT,REJECTED,COMPLETED] on the enum `ProjectProposalStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `omiseChargeId` on the `DonationTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `Entitlement` table. All the data in the column will be lost.
  - You are about to drop the column `eventRegistrationId` on the `Entitlement` table. All the data in the column will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventRegistration` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('PROMPTPAY', 'CASH', 'BANKTRANSFER');

-- CreateEnum
CREATE TYPE "PaymentStatusType" AS ENUM ('CONFIRMED', 'CANCELLED', 'REFUNDED', 'EXPIRING', 'PENDING', 'VERIFYING');

-- AlterEnum
BEGIN;
CREATE TYPE "ContentCategoryType_new" AS ENUM ('NEWS', 'ACTIVITY');
ALTER TABLE "Content" ALTER COLUMN "categories" TYPE "ContentCategoryType_new" USING ("categories"::text::"ContentCategoryType_new");
ALTER TYPE "ContentCategoryType" RENAME TO "ContentCategoryType_old";
ALTER TYPE "ContentCategoryType_new" RENAME TO "ContentCategoryType";
DROP TYPE "public"."ContentCategoryType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EntitlementSource_new" AS ENUM ('BOOKING', 'DONATION');
ALTER TABLE "Entitlement" ALTER COLUMN "source" TYPE "EntitlementSource_new" USING ("source"::text::"EntitlementSource_new");
ALTER TYPE "EntitlementSource" RENAME TO "EntitlementSource_old";
ALTER TYPE "EntitlementSource_new" RENAME TO "EntitlementSource";
DROP TYPE "public"."EntitlementSource_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProjectProposalStatus_new" AS ENUM ('PENDING', 'OPEN', 'CLOSE', 'APPROVED');
ALTER TABLE "public"."ProjectProposal" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ProjectProposal" ALTER COLUMN "status" TYPE "ProjectProposalStatus_new" USING ("status"::text::"ProjectProposalStatus_new");
ALTER TYPE "ProjectProposalStatus" RENAME TO "ProjectProposalStatus_old";
ALTER TYPE "ProjectProposalStatus_new" RENAME TO "ProjectProposalStatus";
DROP TYPE "public"."ProjectProposalStatus_old";
ALTER TABLE "ProjectProposal" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Entitlement" DROP CONSTRAINT "Entitlement_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Entitlement" DROP CONSTRAINT "Entitlement_eventRegistrationId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_souvenirItemId_fkey";

-- DropForeignKey
ALTER TABLE "EventRegistration" DROP CONSTRAINT "EventRegistration_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventRegistration" DROP CONSTRAINT "EventRegistration_userId_fkey";

-- AlterTable
ALTER TABLE "Entitlement" DROP COLUMN "eventId",
DROP COLUMN "eventRegistrationId";

-- AlterTable
ALTER TABLE "ProjectProposal" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "SouvenirItem" ADD COLUMN     "linkedBookingId" INTEGER;

-- DropTable
DROP TABLE "Event";

-- DropTable
DROP TABLE "EventRegistration";

-- CreateTable
CREATE TABLE "PaymentMethodRecord" (
    "id" SERIAL NOT NULL,
    "methodName" "PaymentMethodType" NOT NULL ,
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
    "donationTransactionId" INTEGER,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_paymentRefId_key" ON "PaymentRecord"("paymentRefId");

-- CreateIndex
CREATE INDEX "PaymentRecord_paymentStatus_idx" ON "PaymentRecord"("paymentStatus");

-- CreateIndex
CREATE INDEX "PaymentRecord_createdAt_idx" ON "PaymentRecord"("createdAt");

-- AddForeignKey
ALTER TABLE "SouvenirItem" ADD CONSTRAINT "SouvenirItem_linkedBookingId_fkey" FOREIGN KEY ("linkedBookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethodRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_donationTransactionId_fkey" FOREIGN KEY ("donationTransactionId") REFERENCES "DonationTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
