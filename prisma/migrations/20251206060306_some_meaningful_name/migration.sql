/*
  Warnings:

  - The `Souvenir` column on the `BookingForm` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `Author` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `Date` on the `Content` table. All the data in the column will be lost.
  - You are about to drop the column `StatusID` on the `Content` table. All the data in the column will be lost.
  - The `Booking` column on the `Content` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Status` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Option" AS ENUM ('HAVE', 'NOT');

-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_StatusID_fkey";

-- AlterTable
ALTER TABLE "BookingForm" ADD COLUMN     "singlePrice" INTEGER,
DROP COLUMN "Souvenir",
ADD COLUMN     "Souvenir" "Option";

-- AlterTable
ALTER TABLE "Content" DROP COLUMN "Author",
DROP COLUMN "Date",
DROP COLUMN "StatusID",
DROP COLUMN "Booking",
ADD COLUMN     "Booking" "Option";

-- DropTable
DROP TABLE "Status";

-- DropEnum
DROP TYPE "SouvenirOption";
