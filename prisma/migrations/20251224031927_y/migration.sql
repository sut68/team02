/*
  Warnings:

  - You are about to drop the column `Date` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `bookingFormId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `Name1` on the `BookingField` table. All the data in the column will be lost.
  - You are about to drop the column `Name2` on the `BookingField` table. All the data in the column will be lost.
  - You are about to drop the column `Name3` on the `BookingField` table. All the data in the column will be lost.
  - You are about to drop the column `Name4` on the `BookingField` table. All the data in the column will be lost.
  - Made the column `BookingSeats` on table `BookingField` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_bookingFormId_fkey";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "Date",
DROP COLUMN "bookingFormId";

-- AlterTable
ALTER TABLE "BookingField" DROP COLUMN "Name1",
DROP COLUMN "Name2",
DROP COLUMN "Name3",
DROP COLUMN "Name4",
ADD COLUMN     "Name" TEXT,
ALTER COLUMN "BookingSeats" SET NOT NULL,
ALTER COLUMN "BookingSeats" SET DEFAULT 1;
