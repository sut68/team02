/*
  Warnings:

  - The values [DRAFT,REJECTED,COMPLETED] on the enum `ProjectProposalStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `donorPhone` on the `DonationTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `DonationTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `DonationTransaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[omiseChargeId]` on the table `DonationTransaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `omiseChargeId` to the `DonationTransaction` table without a default value. This is not possible if the table is not empty.
  - Made the column `scoreTotal` on table `ProjectProposal` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('PREPARING', 'OPEN', 'CLOSED');

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
ALTER TABLE "DonationTransaction" DROP CONSTRAINT "DonationTransaction_paymentId_fkey";

-- DropIndex
DROP INDEX "DonationProject_endDate_idx";

-- DropIndex
DROP INDEX "DonationProject_startDate_idx";

-- DropIndex
DROP INDEX "DonationProject_status_idx";

-- DropIndex
DROP INDEX "DonationTransaction_createdAt_idx";

-- DropIndex
DROP INDEX "DonationTransaction_paymentId_key";

-- DropIndex
DROP INDEX "DonationTransaction_projectId_idx";

-- DropIndex
DROP INDEX "DonationTransaction_status_idx";

-- DropIndex
DROP INDEX "DonationTransaction_userId_idx";

-- AlterTable
ALTER TABLE "BudgetDonation" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "BudgetRound" ADD COLUMN     "status" "RoundStatus" NOT NULL DEFAULT 'PREPARING';

-- AlterTable
ALTER TABLE "DonationTransaction" DROP COLUMN "donorPhone",
DROP COLUMN "message",
DROP COLUMN "paymentId",
ADD COLUMN     "omiseChargeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PaymentRecord" ADD COLUMN     "donationTransactionId" INTEGER;

-- AlterTable
ALTER TABLE "ProjectProposal" ALTER COLUMN "scoreTotal" SET NOT NULL,
ALTER COLUMN "scoreTotal" SET DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "DonationTransaction_omiseChargeId_key" ON "DonationTransaction"("omiseChargeId");

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_donationTransactionId_fkey" FOREIGN KEY ("donationTransactionId") REFERENCES "DonationTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
