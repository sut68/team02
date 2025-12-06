-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('REUNION', 'CAMP', 'SEMINAR', 'WORKSHOP', 'OTHER');

-- CreateEnum
CREATE TYPE "PriceMode" AS ENUM ('SINGLE', 'BY_BATCH', 'FREE');

-- CreateEnum
CREATE TYPE "ContentCategoryType" AS ENUM ('NEWS', 'EVENT', 'ANNOUNCEMENT', 'ACTIVITY', 'GENERAL');

-- CreateEnum
CREATE TYPE "SouvenirOption" AS ENUM ('HAVE', 'NOT');

-- CreateEnum
--CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "BookingForm" (
    "id" SERIAL NOT NULL,
    "Type" "EventType",
    "BatchNumber" INTEGER,
    "TotalSeats" INTEGER,
    "StartDate" TIMESTAMP(3),
    "EndDate" TIMESTAMP(3),
    "PriceType" "PriceMode",
    "batchPrices" JSONB,
    "Souvenir" "SouvenirOption",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingField" (
    "id" SERIAL NOT NULL,
    "BatchNumber" TEXT,
    "BookingSeats" INTEGER,
    "Name1" TEXT,
    "Name2" TEXT,
    "Name3" TEXT,
    "Name4" TEXT,
    "TotalPrice" INTEGER,
    "Souvenir" TEXT,
    "Note" TEXT,

    CONSTRAINT "BookingField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "Date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Userid" INTEGER,
    "ContentID" INTEGER,
    "BookingFieldID" INTEGER,
    "PaymentID" INTEGER,
    "transactionStatus" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingFormId" INTEGER,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendee" (
    "id" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckinLog" (
    "id" SERIAL NOT NULL,
    "Date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Name" TEXT,
    "AttendeeID" INTEGER NOT NULL,

    CONSTRAINT "CheckinLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" SERIAL NOT NULL,
    "Description" TEXT,
    "Date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Booking" TEXT,
    "Author" TEXT,
    "Userid" INTEGER,
    "BookingFormID" INTEGER,
    "StatusID" INTEGER,
    "categories" "ContentCategoryType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PictureContent" (
    "id" SERIAL NOT NULL,
    "Path" TEXT NOT NULL,
    "ContentID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PictureContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Status" (
    "StatusID" SERIAL NOT NULL,
    "StatusName" TEXT NOT NULL,
    "Description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("StatusID")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "referenceNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_BookingFieldID_key" ON "Booking"("BookingFieldID");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_PaymentID_key" ON "Booking"("PaymentID");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_Userid_fkey" FOREIGN KEY ("Userid") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_ContentID_fkey" FOREIGN KEY ("ContentID") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_BookingFieldID_fkey" FOREIGN KEY ("BookingFieldID") REFERENCES "BookingField"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_PaymentID_fkey" FOREIGN KEY ("PaymentID") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bookingFormId_fkey" FOREIGN KEY ("bookingFormId") REFERENCES "BookingForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendee" ADD CONSTRAINT "Attendee_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckinLog" ADD CONSTRAINT "CheckinLog_AttendeeID_fkey" FOREIGN KEY ("AttendeeID") REFERENCES "Attendee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_Userid_fkey" FOREIGN KEY ("Userid") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_BookingFormID_fkey" FOREIGN KEY ("BookingFormID") REFERENCES "BookingForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_StatusID_fkey" FOREIGN KEY ("StatusID") REFERENCES "Status"("StatusID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PictureContent" ADD CONSTRAINT "PictureContent_ContentID_fkey" FOREIGN KEY ("ContentID") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
