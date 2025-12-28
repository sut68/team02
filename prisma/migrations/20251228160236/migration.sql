/*
  Warnings:

  - The `Souvenir` column on the `BookingForm` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `paymentId` on the `BudgetDonation` table. All the data in the column will be lost.
  - You are about to drop the column `Author` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `Date` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `StatusID` on the `Content` table. All the data in the column will be lost.
  - The `Booking` column on the `Content` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `_BudgetDonationToPaymentRecord` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[TitleName,categories]` on the table `Content` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[proposalId]` on the table `SummarySubmission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Option" AS ENUM ('HAVE', 'NOT');

-- DropForeignKey
ALTER TABLE "_BudgetDonationToPaymentRecord" DROP CONSTRAINT "_BudgetDonationToPaymentRecord_A_fkey";

-- DropForeignKey
ALTER TABLE "_BudgetDonationToPaymentRecord" DROP CONSTRAINT "_BudgetDonationToPaymentRecord_B_fkey";

-- AlterTable
ALTER TABLE "BookingForm" ADD COLUMN     "singlePrice" INTEGER,
DROP COLUMN "Souvenir",
ADD COLUMN     "Souvenir" "Option";

-- AlterTable
ALTER TABLE "BudgetDonation" DROP COLUMN "paymentId";

-- AlterTable
ALTER TABLE "Content" DROP COLUMN "Author",
DROP COLUMN "Date",
DROP COLUMN "StatusID",
ADD COLUMN     "TitleName" TEXT,
DROP COLUMN "Booking",
ADD COLUMN     "Booking" "Option";

-- AlterTable
ALTER TABLE "PaymentRecord" ADD COLUMN     "budgetDonationId" INTEGER;

-- DropTable
DROP TABLE "_BudgetDonationToPaymentRecord";

-- DropEnum
DROP TYPE "SouvenirOption";

-- CreateIndex
CREATE UNIQUE INDEX "Content_TitleName_categories_key" ON "Content"("TitleName", "categories");

-- CreateIndex
CREATE UNIQUE INDEX "SummarySubmission_proposalId_key" ON "SummarySubmission"("proposalId");

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_budgetDonationId_fkey" FOREIGN KEY ("budgetDonationId") REFERENCES "BudgetDonation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
