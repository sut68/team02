-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STUDENT', 'ALUMNI');

-- CreateEnum
CREATE TYPE "StudyStatus" AS ENUM ('ACTIVE', 'GRADUATED');

-- CreateEnum
CREATE TYPE "VerifyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'STUDENT',
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "userType" DROP NOT NULL;

-- CreateTable
CREATE TABLE "EducationRecord" (
    "id" SERIAL NOT NULL,
    "studentCode" TEXT NOT NULL,
    "major" TEXT NOT NULL,
    "gradYear" INTEGER,
    "status" "StudyStatus" NOT NULL DEFAULT 'ACTIVE',
    "transcript" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "EducationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" SERIAL NOT NULL,
    "status" "VerifyStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EducationRecord_studentCode_key" ON "EducationRecord"("studentCode");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_userId_key" ON "Verification"("userId");

-- AddForeignKey
ALTER TABLE "EducationRecord" ADD CONSTRAINT "EducationRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
