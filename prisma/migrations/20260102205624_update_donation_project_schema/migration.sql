/*
  Warnings:

  - The values [OTHER] on the enum `DonationProjectType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `PaymentID` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentRefId` on the `PaymentRecord` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `PaymentRecord` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[donationTransactionId]` on the table `PaymentRecord` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bookingId]` on the table `PaymentRecord` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[budgetDonationId]` on the table `PaymentRecord` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `address` to the `BudgetDonation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district` to the `BudgetDonation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `BudgetDonation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `BudgetDonation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `BudgetDonation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postalCode` to the `BudgetDonation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `BudgetDonation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province` to the `BudgetDonation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subdistrict` to the `BudgetDonation` table without a default value. This is not possible if the table is not empty.
  - Made the column `fullName` on table `DonationTransaction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `DonationTransaction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `DonationTransaction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `DonationTransaction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subdistrict` on table `DonationTransaction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `district` on table `DonationTransaction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `province` on table `DonationTransaction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `postalCode` on table `DonationTransaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DonationProjectType_new" AS ENUM ('CENTRAL', 'SCHOLARSHIP', 'ACTIVITY', 'RESEARCH', 'BUILDING', 'EMERGENCY');
ALTER TABLE "DonationProject" ALTER COLUMN "projectType" TYPE "DonationProjectType_new" USING ("projectType"::text::"DonationProjectType_new");
ALTER TYPE "DonationProjectType" RENAME TO "DonationProjectType_old";
ALTER TYPE "DonationProjectType_new" RENAME TO "DonationProjectType";
DROP TYPE "public"."DonationProjectType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "PaymentStatusType" ADD VALUE 'PENDING';

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_PaymentID_fkey";

-- DropForeignKey
ALTER TABLE "Entitlement" DROP CONSTRAINT "Entitlement_donationId_fkey";

-- DropForeignKey
ALTER TABLE "Shipment" DROP CONSTRAINT "Shipment_donationId_fkey";

-- DropIndex
DROP INDEX "Booking_PaymentID_key";

-- DropIndex
DROP INDEX "PaymentRecord_paymentRefId_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "PaymentID";

-- AlterTable
ALTER TABLE "BudgetDonation" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "district" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "postalCode" TEXT NOT NULL,
ADD COLUMN     "projectId" INTEGER NOT NULL,
ADD COLUMN     "province" TEXT NOT NULL,
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "subdistrict" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DonationProject" ALTER COLUMN "projectType" SET DEFAULT 'SCHOLARSHIP',
ALTER COLUMN "ownerName" DROP NOT NULL,
ALTER COLUMN "contact" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DonationTransaction" ALTER COLUMN "fullName" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "subdistrict" SET NOT NULL,
ALTER COLUMN "district" SET NOT NULL,
ALTER COLUMN "province" SET NOT NULL,
ALTER COLUMN "postalCode" SET NOT NULL;

-- AlterTable
ALTER TABLE "PaymentRecord" DROP COLUMN "paymentRefId",
ADD COLUMN     "bookingId" INTEGER,
ADD COLUMN     "budgetDonationId" INTEGER,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "paymentStatus" DROP DEFAULT;

-- DropTable
DROP TABLE "Payment";

-- CreateTable
CREATE TABLE "Donation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "donatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "souvenirItemId" INTEGER,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_donationTransactionId_key" ON "PaymentRecord"("donationTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_bookingId_key" ON "PaymentRecord"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_budgetDonationId_key" ON "PaymentRecord"("budgetDonationId");

-- RenameForeignKey
ALTER TABLE "DonationProject" RENAME CONSTRAINT "Donation_souvenirItemId_fkey" TO "DonationProject_souvenirItemId_fkey";

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_souvenirItemId_fkey" FOREIGN KEY ("souvenirItemId") REFERENCES "SouvenirItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetDonation" ADD CONSTRAINT "BudgetDonation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DonationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_budgetDonationId_fkey" FOREIGN KEY ("budgetDonationId") REFERENCES "BudgetDonation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
