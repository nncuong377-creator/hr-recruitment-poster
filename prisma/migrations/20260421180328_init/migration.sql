-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'APPROVED', 'POSTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "GroupCategory" AS ENUM ('IT', 'SALES', 'MARKETING', 'GENERAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PostLogStatus" AS ENUM ('SUCCESS', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "benefits" TEXT NOT NULL,
    "applyInfo" TEXT NOT NULL,
    "hashtags" TEXT NOT NULL DEFAULT '',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "originalName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FbGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" "GroupCategory" NOT NULL,
    "memberCount" INTEGER,
    "notes" TEXT NOT NULL DEFAULT '',
    "lastPostedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FbGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostLog" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "fbGroupId" TEXT NOT NULL,
    "postedById" TEXT,
    "status" "PostLogStatus" NOT NULL DEFAULT 'SUCCESS',
    "errorMsg" TEXT,
    "postUrl" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FbGroup_url_key" ON "FbGroup"("url");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLog" ADD CONSTRAINT "PostLog_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLog" ADD CONSTRAINT "PostLog_fbGroupId_fkey" FOREIGN KEY ("fbGroupId") REFERENCES "FbGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLog" ADD CONSTRAINT "PostLog_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
