/*
  Warnings:

  - The values [EXPIRING] on the enum `PaymentStatusType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `donorEmail` on the `BudgetDonation` table. All the data in the column will be lost.
  - You are about to drop the column `donorName` on the `BudgetDonation` table. All the data in the column will be lost.
  - You are about to drop the column `donorPhone` on the `BudgetDonation` table. All the data in the column will be lost.
  - You are about to drop the column `isCentralFund` on the `DonationProject` table. All the data in the column will be lost.
  - You are about to drop the column `donorPhone` on the `DonationTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `DonationTransaction` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatusType_new" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'VERIFYING', 'EXPIRED', 'REFUNDED');
ALTER TABLE "PaymentRecord" ALTER COLUMN "paymentStatus" TYPE "PaymentStatusType_new" USING ("paymentStatus"::text::"PaymentStatusType_new");
ALTER TYPE "PaymentStatusType" RENAME TO "PaymentStatusType_old";
ALTER TYPE "PaymentStatusType_new" RENAME TO "PaymentStatusType";
DROP TYPE "public"."PaymentStatusType_old";
COMMIT;

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
ALTER TABLE "User" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;
