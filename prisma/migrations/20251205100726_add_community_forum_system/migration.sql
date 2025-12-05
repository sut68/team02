-- CreateEnum
CREATE TYPE "TopicStatus" AS ENUM ('ACTIVE', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('ACTIVE', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "ContentTargetType" AS ENUM ('TOPIC', 'COMMENT');

-- CreateEnum
CREATE TYPE "ContentActionStatus" AS ENUM ('APPROVED', 'HIDDEN', 'DELETED');

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "categoryname" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "topicImage" TEXT,
    "status" "TopicStatus" NOT NULL DEFAULT 'ACTIVE',
    "createddate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastactivitydate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentcount" INTEGER NOT NULL DEFAULT 0,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createddate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CommentStatus" NOT NULL DEFAULT 'ACTIVE',
    "commentcount" INTEGER NOT NULL DEFAULT 0,
    "topic_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicEditHistory" (
    "id" SERIAL NOT NULL,
    "editedByUserID" TEXT NOT NULL,
    "oldcontent" TEXT NOT NULL,
    "editdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staffuser_id" INTEGER,
    "topic_id" INTEGER NOT NULL,

    CONSTRAINT "TopicEditHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentManagementLog" (
    "id" SERIAL NOT NULL,
    "targettype" "ContentTargetType" NOT NULL,
    "TargetID" INTEGER NOT NULL,
    "status" "ContentActionStatus" NOT NULL,
    "reason" TEXT,
    "actiondate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staffuser_id" INTEGER NOT NULL,

    CONSTRAINT "ContentManagementLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Topic_user_id_idx" ON "Topic"("user_id");

-- CreateIndex
CREATE INDEX "Topic_category_id_idx" ON "Topic"("category_id");

-- CreateIndex
CREATE INDEX "Topic_status_idx" ON "Topic"("status");

-- CreateIndex
CREATE INDEX "Topic_createddate_idx" ON "Topic"("createddate");

-- CreateIndex
CREATE INDEX "Comment_topic_id_idx" ON "Comment"("topic_id");

-- CreateIndex
CREATE INDEX "Comment_user_id_idx" ON "Comment"("user_id");

-- CreateIndex
CREATE INDEX "Comment_status_idx" ON "Comment"("status");

-- CreateIndex
CREATE INDEX "TopicEditHistory_topic_id_idx" ON "TopicEditHistory"("topic_id");

-- CreateIndex
CREATE INDEX "ContentManagementLog_targettype_TargetID_idx" ON "ContentManagementLog"("targettype", "TargetID");

-- CreateIndex
CREATE INDEX "ContentManagementLog_staffuser_id_idx" ON "ContentManagementLog"("staffuser_id");

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicEditHistory" ADD CONSTRAINT "TopicEditHistory_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentManagementLog" ADD CONSTRAINT "ContentManagementLog_staffuser_id_fkey" FOREIGN KEY ("staffuser_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
