-- AlterTable
ALTER TABLE "DonationProject" ADD COLUMN     "souvenirItemId" INTEGER;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "souvenirItemId" INTEGER;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_souvenirItemId_fkey" FOREIGN KEY ("souvenirItemId") REFERENCES "SouvenirItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationProject" ADD CONSTRAINT "Donation_souvenirItemId_fkey" FOREIGN KEY ("souvenirItemId") REFERENCES "SouvenirItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
