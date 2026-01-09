/*
  Warnings:

  - The values [EXPIRING] on the enum `PaymentStatusType` will be removed. If these variants are still used in the database, this will fail.
  - The values [IN_TRANSIT,FAILED] on the enum `ShipStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `donorEmail` on the `BudgetDonation` table. All the data in the column will be lost.
  - You are about to drop the column `donorName` on the `BudgetDonation` table. All the data in the column will be lost.
  - You are about to drop the column `donorPhone` on the `BudgetDonation` table. All the data in the column will be lost.
  - You are about to drop the column `isCentralFund` on the `DonationProject` table. All the data in the column will be lost.
  - You are about to drop the column `donorPhone` on the `DonationTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `DonationTransaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[qrToken]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bookingNumber]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatusType_new" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'VERIFYING', 'EXPIRED', 'REFUNDED');
ALTER TABLE "PaymentRecord" ALTER COLUMN "paymentStatus" TYPE "PaymentStatusType_new" USING ("paymentStatus"::text::"PaymentStatusType_new");
ALTER TYPE "PaymentStatusType" RENAME TO "PaymentStatusType_old";
ALTER TYPE "PaymentStatusType_new" RENAME TO "PaymentStatusType";
DROP TYPE "public"."PaymentStatusType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ShipStatus_new" AS ENUM ('PENDING', 'DELIVERED');
ALTER TABLE "public"."Shipment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Shipment" ALTER COLUMN "status" TYPE "ShipStatus_new" USING ("status"::text::"ShipStatus_new");
ALTER TYPE "ShipStatus" RENAME TO "ShipStatus_old";
ALTER TYPE "ShipStatus_new" RENAME TO "ShipStatus";
DROP TYPE "public"."ShipStatus_old";
ALTER TABLE "Shipment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "bookingNumber" TEXT,
ADD COLUMN     "qrToken" TEXT;

-- AlterTable
ALTER TABLE "BudgetDonation" DROP COLUMN "donorEmail",
DROP COLUMN "donorName",
DROP COLUMN "donorPhone";

-- AlterTable
ALTER TABLE "DonationProject" DROP COLUMN "isCentralFund";

-- AlterTable
ALTER TABLE "DonationTransaction" DROP COLUMN "donorPhone",
DROP COLUMN "paymentId";

-- AlterTable
ALTER TABLE "Entitlement" ADD COLUMN     "bookingId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_qrToken_key" ON "Booking"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "Booking"("bookingNumber");

-- CreateIndex
CREATE INDEX "DonationProject_status_idx" ON "DonationProject"("status");

-- CreateIndex
CREATE INDEX "DonationProject_projectType_idx" ON "DonationProject"("projectType");

-- CreateIndex
CREATE INDEX "DonationProject_createdAt_idx" ON "DonationProject"("createdAt");

-- CreateIndex
CREATE INDEX "DonationProject_endDate_idx" ON "DonationProject"("endDate");

-- CreateIndex
CREATE INDEX "DonationProject_currentAmount_idx" ON "DonationProject"("currentAmount");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_updatedAt_idx" ON "User"("updatedAt");

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
