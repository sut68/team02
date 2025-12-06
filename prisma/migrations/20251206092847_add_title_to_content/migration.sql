/*
  Warnings:

  - You are about to drop the column `Title` on the `Content` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Content"
ADD COLUMN     "TitleName" TEXT;
