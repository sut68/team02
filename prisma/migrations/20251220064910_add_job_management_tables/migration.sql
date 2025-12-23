/*
  Warnings:

  - You are about to drop the column `singlePrice` on the `BookingForm` table. All the data in the column will be lost.
  - The `Souvenir` column on the `BookingForm` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `TitleName` on the `Content` table. All the data in the column will be lost.
  - The `Booking` column on the `Content` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `souvenirItemId` on the `Donation` table. All the data in the column will be lost.
  - You are about to drop the column `omiseChargeId` on the `DonationTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `souvenirItemId` on the `Event` table. All the data in the column will be lost.

*/
-- CreateEnum (with existence check)
DO $$ BEGIN
    CREATE TYPE "EducationLevel" AS ENUM ('BELOW_BACHELOR', 'BACHELOR', 'MASTER', 'DOCTORATE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "JobTypeEnum" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ApprovalAction" AS ENUM ('APPROVED', 'REJECTED', 'PENDING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum SouvenirOption (with existence check - may have been created in earlier migration)
DO $$ BEGIN
    CREATE TYPE "SouvenirOption" AS ENUM ('HAVE', 'NOT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- DropForeignKey
ALTER TABLE "Donation" DROP CONSTRAINT "Donation_souvenirItemId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_souvenirItemId_fkey";

-- DropIndex
DROP INDEX "DonationTransaction_omiseChargeId_key";

-- AlterTable
ALTER TABLE "BookingForm" DROP COLUMN "singlePrice",
DROP COLUMN "Souvenir",
ADD COLUMN     "Souvenir" "SouvenirOption";

-- AlterTable
ALTER TABLE "Content" DROP COLUMN "TitleName",
ADD COLUMN     "Author" TEXT,
ADD COLUMN     "Date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "StatusID" INTEGER,
DROP COLUMN "Booking",
ADD COLUMN     "Booking" TEXT;

-- AlterTable
ALTER TABLE "Donation" DROP COLUMN "souvenirItemId";

-- AlterTable
ALTER TABLE "DonationTransaction" DROP COLUMN "omiseChargeId";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "souvenirItemId";

-- DropEnum
DROP TYPE "Option";

-- Note: Status table already created in migration 20251205095840_add_booking_content_management_system
-- CREATE TABLE "Status" ...

-- CreateTable (with existence check)
CREATE TABLE IF NOT EXISTS "JobType" (
    "id" SERIAL NOT NULL,
    "typename" "JobTypeEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "namejob" TEXT NOT NULL,
    "position" TEXT,
    "qualification" TEXT,
    "location" TEXT,
    "salarydetail" TEXT,
    "numpositions" INTEGER,
    "contactInfo" TEXT,
    "JobPosterPath" TEXT,
    "educationlevel" "EducationLevel",
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "userId" INTEGER NOT NULL,
    "jobtypeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "companyname" TEXT NOT NULL,
    "companyaddress" TEXT,
    "CompanyLogoPath" TEXT,
    "CompanyPicturePath" TEXT,
    "jobId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalLog" (
    "id" SERIAL NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "actionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staffId" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobEditHistory" (
    "id" SERIAL NOT NULL,
    "editedbyuserId" INTEGER NOT NULL,
    "olddata" JSONB,
    "editdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobEditHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (with existence check)
CREATE UNIQUE INDEX IF NOT EXISTS "JobType_typename_key" ON "JobType"("typename");

-- CreateIndex
CREATE INDEX "JobPosting_userId_idx" ON "JobPosting"("userId");

-- CreateIndex
CREATE INDEX "JobPosting_status_idx" ON "JobPosting"("status");

-- CreateIndex
CREATE INDEX "JobPosting_jobtypeId_idx" ON "JobPosting"("jobtypeId");

-- CreateIndex
CREATE INDEX "JobPosting_createdAt_idx" ON "JobPosting"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Company_jobId_key" ON "Company"("jobId");

-- CreateIndex
CREATE INDEX "ApprovalLog_staffId_idx" ON "ApprovalLog"("staffId");

-- CreateIndex
CREATE INDEX "ApprovalLog_jobId_idx" ON "ApprovalLog"("jobId");

-- CreateIndex
CREATE INDEX "ApprovalLog_actionDate_idx" ON "ApprovalLog"("actionDate");

-- CreateIndex
CREATE INDEX "JobEditHistory_editedbyuserId_idx" ON "JobEditHistory"("editedbyuserId");

-- CreateIndex
CREATE INDEX "JobEditHistory_jobId_idx" ON "JobEditHistory"("jobId");

-- CreateIndex
CREATE INDEX "JobEditHistory_editdate_idx" ON "JobEditHistory"("editdate");

-- Note: Content_StatusID_fkey foreign key already created in migration 20251205095840_add_booking_content_management_system
-- ALTER TABLE "Content" ADD CONSTRAINT "Content_StatusID_fkey" ...

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_jobtypeId_fkey" FOREIGN KEY ("jobtypeId") REFERENCES "JobType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalLog" ADD CONSTRAINT "ApprovalLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalLog" ADD CONSTRAINT "ApprovalLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEditHistory" ADD CONSTRAINT "JobEditHistory_editedbyuserId_fkey" FOREIGN KEY ("editedbyuserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEditHistory" ADD CONSTRAINT "JobEditHistory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
