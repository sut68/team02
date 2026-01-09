/*
  Warnings:

  - Made the column `scoreTotal` on table `ProjectProposal` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('PREPARING', 'OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "BudgetDonation" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "BudgetRound" ADD COLUMN     "status" "RoundStatus" NOT NULL DEFAULT 'PREPARING';

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "souvenirItemId" INTEGER;


-- AlterTable
ALTER TABLE "ProjectProposal" ALTER COLUMN "scoreTotal" SET NOT NULL,
ALTER COLUMN "scoreTotal" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "Content_souvenirItemId_idx" ON "Content"("souvenirItemId");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_souvenirItemId_fkey" FOREIGN KEY ("souvenirItemId") REFERENCES "SouvenirItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
