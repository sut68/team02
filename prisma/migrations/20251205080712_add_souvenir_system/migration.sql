-- CreateEnum
CREATE TYPE "EntitlementSource" AS ENUM ('EVENT', 'DONATION');

-- CreateEnum
CREATE TYPE "RedeemMethod" AS ENUM ('QR_SCAN', 'MANUAL');

-- CreateEnum
CREATE TYPE "ShipStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED');

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "maxAttendees" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attendanceStatus" TEXT,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "donatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SouvenirItem" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "imageUrl" TEXT,
    "unit" TEXT,
    "initialStock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SouvenirItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT,
    "refType" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "source" "EntitlementSource" NOT NULL,
    "eventId" INTEGER,
    "eventRegistrationId" INTEGER,
    "donationId" INTEGER,
    "qtyGranted" INTEGER NOT NULL DEFAULT 1,
    "qtyUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" SERIAL NOT NULL,
    "entitlementId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "method" "RedeemMethod" NOT NULL DEFAULT 'QR_SCAN',
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledBy" INTEGER,

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" SERIAL NOT NULL,
    "donationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "receiverName" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "subdistrict" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "ShipStatus" NOT NULL DEFAULT 'PENDING',
    "trackingNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_userId_key" ON "EventRegistration"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SouvenirItem_sku_key" ON "SouvenirItem"("sku");

-- CreateIndex
CREATE INDEX "Entitlement_userId_itemId_idx" ON "Entitlement"("userId", "itemId");

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SouvenirItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SouvenirItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_eventRegistrationId_fkey" FOREIGN KEY ("eventRegistrationId") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "Entitlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SouvenirItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SouvenirItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
