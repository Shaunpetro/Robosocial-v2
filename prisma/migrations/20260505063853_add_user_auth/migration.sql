/*
  Warnings:

  - You are about to drop the column `userId` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `expiresAt` to the `Media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "userId",
ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "CompanyIntelligence" ADD COLUMN     "aiAnalysis" JSONB,
ADD COLUMN     "aiConfidenceScore" DOUBLE PRECISION,
ADD COLUMN     "analysisVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "audienceConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "avgEngagementRate" DOUBLE PRECISION,
ADD COLUMN     "contentTypePerformance" JSONB,
ADD COLUMN     "dataSources" JSONB,
ADD COLUMN     "educationalMediaRatio" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "engagementMediaRatio" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "engagementTrend" TEXT,
ADD COLUMN     "expiryWarningDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "extractedAudience" JSONB,
ADD COLUMN     "extractedIndustries" JSONB,
ADD COLUMN     "extractedSAContext" JSONB,
ADD COLUMN     "extractedServices" JSONB,
ADD COLUMN     "extractedUSPs" JSONB,
ADD COLUMN     "extractedVoice" JSONB,
ADD COLUMN     "generatedContentMix" JSONB,
ADD COLUMN     "generatedThemes" JSONB,
ADD COLUMN     "generatedTopics" JSONB,
ADD COLUMN     "industriesConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "intelligenceScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastAnalyzedAt" TIMESTAMP(3),
ADD COLUMN     "lastIntelligenceUpdate" TIMESTAMP(3),
ADD COLUMN     "mediaBalanceEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mediaPostRatio" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "platformPerformance" JSONB,
ADD COLUMN     "primaryBusinessGoal" TEXT,
ADD COLUMN     "prioritizeExpiringMedia" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "promotionalMediaRatio" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN     "secondaryGoals" TEXT[],
ADD COLUMN     "servicesConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "socialProofMediaRatio" INTEGER NOT NULL DEFAULT 80,
ADD COLUMN     "topPerformingHooks" JSONB,
ADD COLUMN     "topPerformingTopics" JSONB,
ADD COLUMN     "topPerformingTypes" JSONB,
ADD COLUMN     "topicUsageHistory" JSONB,
ADD COLUMN     "uspsConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "voiceConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weeklyPostTarget" INTEGER;

-- AlterTable
ALTER TABLE "ContentPillar" ADD COLUMN     "bestPerformingType" TEXT,
ADD COLUMN     "lastUsed" TIMESTAMP(3),
ADD COLUMN     "performanceTrend" TEXT;

-- AlterTable
ALTER TABLE "ContentQueueItem" ADD COLUMN     "predictedScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "GeneratedPost" ADD COLUMN     "engagementRate" DOUBLE PRECISION,
ADD COLUMN     "performanceScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "IndustryBenchmark" ADD COLUMN     "contentMixRecommendation" JSONB,
ADD COLUMN     "growthBenchmarks" JSONB;

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "autoSelect" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "contentTypes" TEXT[],
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "isUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastUsedAt" TIMESTAMP(3),
ADD COLUMN     "pillarIds" TEXT[],
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usedAt" TIMESTAMP(3),
ADD COLUMN     "usedInPostId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- DropTable
DROP TABLE "Session";

-- CreateTable
CREATE TABLE "CompanyDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "extractedText" TEXT,
    "analyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyDocument_companyId_idx" ON "CompanyDocument"("companyId");

-- CreateIndex
CREATE INDEX "ContentQueueItem_contentType_idx" ON "ContentQueueItem"("contentType");

-- CreateIndex
CREATE INDEX "GeneratedPost_contentType_idx" ON "GeneratedPost"("contentType");

-- CreateIndex
CREATE INDEX "GeneratedPost_publishedAt_idx" ON "GeneratedPost"("publishedAt");

-- CreateIndex
CREATE INDEX "Media_companyId_isUsed_expiresAt_idx" ON "Media"("companyId", "isUsed", "expiresAt");

-- CreateIndex
CREATE INDEX "Media_companyId_autoSelect_isUsed_idx" ON "Media"("companyId", "autoSelect", "isUsed");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
