-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('OPEN', 'CLOSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('PROMPTPAY', 'CREDIT_CARD', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentStatusType" AS ENUM ('CONFIRMED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "DonationProject" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goalAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "ownerName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'OPEN',
    "posterUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethodRecord" (
    "id" SERIAL NOT NULL,
    "methodName" "PaymentMethodType" NOT NULL DEFAULT 'PROMPTPAY',
    "accountNumber" TEXT,
    "provider" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethodRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" SERIAL NOT NULL,
    "paymentRefId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "transactionCode" TEXT,
    "paymentSlipUrl" TEXT,
    "paymentStatus" "PaymentStatusType" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentMethodId" INTEGER,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationTransaction" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "donorName" TEXT,
    "donorEmail" TEXT,
    "donorPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,
    "projectId" INTEGER NOT NULL,
    "paymentId" INTEGER,

    CONSTRAINT "DonationTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DonationProject_status_idx" ON "DonationProject"("status");

-- CreateIndex
CREATE INDEX "DonationProject_startDate_idx" ON "DonationProject"("startDate");

-- CreateIndex
CREATE INDEX "DonationProject_endDate_idx" ON "DonationProject"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_paymentRefId_key" ON "PaymentRecord"("paymentRefId");

-- CreateIndex
CREATE INDEX "PaymentRecord_paymentStatus_idx" ON "PaymentRecord"("paymentStatus");

-- CreateIndex
CREATE INDEX "PaymentRecord_createdAt_idx" ON "PaymentRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DonationTransaction_paymentId_key" ON "DonationTransaction"("paymentId");

-- CreateIndex
CREATE INDEX "DonationTransaction_userId_idx" ON "DonationTransaction"("userId");

-- CreateIndex
CREATE INDEX "DonationTransaction_projectId_idx" ON "DonationTransaction"("projectId");

-- CreateIndex
CREATE INDEX "DonationTransaction_status_idx" ON "DonationTransaction"("status");

-- CreateIndex
CREATE INDEX "DonationTransaction_createdAt_idx" ON "DonationTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethodRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationTransaction" ADD CONSTRAINT "DonationTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationTransaction" ADD CONSTRAINT "DonationTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DonationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationTransaction" ADD CONSTRAINT "DonationTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PaymentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
