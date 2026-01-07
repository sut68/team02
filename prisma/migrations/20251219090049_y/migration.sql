/*
  Warnings:

  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_PaymentID_fkey";

-- AlterTable
ALTER TABLE "BudgetDonation" ADD COLUMN     "donorEmail" TEXT,
ADD COLUMN     "donorName" TEXT,
ADD COLUMN     "donorPhone" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "paymentId" INTEGER,
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "DonationProject" ADD COLUMN     "isCentralFund" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "DonationTransaction" ADD COLUMN     "donorPhone" TEXT,
ADD COLUMN     "paymentId" INTEGER;

-- AlterTable
ALTER TABLE "SouvenirItem" ADD COLUMN     "donationTransactionId" INTEGER;

-- DropTable
DROP TABLE "Payment";

-- CreateTable
CREATE TABLE "_BudgetDonationToPaymentRecord" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BudgetDonationToPaymentRecord_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BudgetDonationToPaymentRecord_B_index" ON "_BudgetDonationToPaymentRecord"("B");

-- AddForeignKey
ALTER TABLE "SouvenirItem" ADD CONSTRAINT "SouvenirItem_donationTransactionId_fkey" FOREIGN KEY ("donationTransactionId") REFERENCES "DonationTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_PaymentID_fkey" FOREIGN KEY ("PaymentID") REFERENCES "PaymentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BudgetDonationToPaymentRecord" ADD CONSTRAINT "_BudgetDonationToPaymentRecord_A_fkey" FOREIGN KEY ("A") REFERENCES "BudgetDonation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BudgetDonationToPaymentRecord" ADD CONSTRAINT "_BudgetDonationToPaymentRecord_B_fkey" FOREIGN KEY ("B") REFERENCES "PaymentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
