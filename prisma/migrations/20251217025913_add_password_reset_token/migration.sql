/*
  Warnings:

  - A unique constraint covering the columns `[Type,StartDate]` on the table `BookingForm` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[TitleName,categories]` on the table `Content` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[redeemToken]` on the table `Entitlement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[methodName]` on the table `PaymentMethodRecord` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[Path,ContentID]` on the table `PictureContent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Entitlement" ADD COLUMN     "redeemToken" TEXT;

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookingForm_Type_StartDate_key" ON "BookingForm"("Type", "StartDate");

-- CreateIndex
CREATE UNIQUE INDEX "Content_TitleName_categories_key" ON "Content"("TitleName", "categories");

-- CreateIndex
CREATE UNIQUE INDEX "Entitlement_redeemToken_key" ON "Entitlement"("redeemToken");


-- CreateIndex
CREATE UNIQUE INDEX "PictureContent_Path_ContentID_key" ON "PictureContent"("Path", "ContentID");
