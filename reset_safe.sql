-- CreateEnum
CREATE TYPE IF NOT EXISTS "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "LicenseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "PlatformType" AS ENUM ('LINKEDIN', 'FACEBOOK', 'TWITTER', 'INSTAGRAM', 'WORDPRESS');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'GIF');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "PostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "BulkScheduleStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "QueueStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REGENERATING', 'SCHEDULED');

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "licenseId" TEXT,
    "fromEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "suspended" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "License" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "licenseKeyHash" TEXT NOT NULL,
    "maxSocialAccounts" INTEGER NOT NULL DEFAULT 5,
    "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "fromEmail" TEXT,
    "keyPreview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Platform" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "PlatformType" NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "connectionData" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CompanyDocument" (
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

-- CreateTable
CREATE TABLE IF NOT EXISTS "ContentSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'professional',
    "topics" TEXT[],
    "keywords" TEXT[],
    "postFrequency" INTEGER NOT NULL DEFAULT 7,
    "includeHashtags" BOOLEAN NOT NULL DEFAULT true,
    "includeEmojis" BOOLEAN NOT NULL DEFAULT false,
    "maxLength" INTEGER,
    "brandVoice" TEXT,
    "avoidTopics" TEXT[],
    "defaultPostingTimes" TEXT[] DEFAULT ARRAY['09:00', '14:00', '18:00']::TEXT[],
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Media" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "type" "MediaType" NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "pillarIds" TEXT[],
    "tags" TEXT[],
    "contentTypes" TEXT[],
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "usedInPostId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "autoSelect" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "GeneratedPost" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "hashtags" TEXT[],
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "isPartOfBulk" BOOLEAN NOT NULL DEFAULT false,
    "bulkScheduleId" TEXT,
    "generatedBy" TEXT NOT NULL DEFAULT 'groq-llama-3.3',
    "prompt" TEXT,
    "topic" TEXT,
    "tone" TEXT,
    "iteration" INTEGER NOT NULL DEFAULT 1,
    "pillar" TEXT,
    "contentType" TEXT,
    "includesHumor" BOOLEAN NOT NULL DEFAULT false,
    "hook" TEXT,
    "externalPostId" TEXT,
    "externalPostUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION,
    "performanceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PostMedia" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PostMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BulkSchedule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "postsCount" INTEGER NOT NULL,
    "timesPerDay" TEXT[],
    "platforms" TEXT[],
    "status" "BulkScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CompanyIntelligence" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "brandPersonality" TEXT[],
    "brandVoice" TEXT,
    "uniqueSellingPoints" TEXT[],
    "targetAudience" TEXT,
    "primaryGoals" TEXT[],
    "communityFocus" TEXT,
    "primaryKeywords" TEXT[],
    "industryHashtags" TEXT[],
    "brandedHashtags" TEXT[],
    "defaultTone" TEXT NOT NULL DEFAULT 'professional',
    "humorEnabled" BOOLEAN NOT NULL DEFAULT true,
    "humorStyle" TEXT,
    "humorDays" TEXT[],
    "humorTimes" TEXT[],
    "dayToneSchedule" JSONB,
    "postsPerWeek" INTEGER NOT NULL DEFAULT 4,
    "preferredDays" TEXT[],
    "preferredTimes" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "learnedBestDays" TEXT[],
    "learnedBestTimes" JSONB,
    "learnedBestPillars" JSONB,
    "avoidTopics" TEXT[],
    "intelligenceScore" INTEGER NOT NULL DEFAULT 0,
    "engagementTrend" TEXT,
    "avgEngagementRate" DOUBLE PRECISION,
    "topPerformingTypes" JSONB,
    "topPerformingTopics" JSONB,
    "topPerformingHooks" JSONB,
    "topicUsageHistory" JSONB,
    "contentTypePerformance" JSONB,
    "platformPerformance" JSONB,
    "lastIntelligenceUpdate" TIMESTAMP(3),
    "weeklyPostTarget" INTEGER,
    "competitorGaps" TEXT[],
    "industryBenchmarks" JSONB,
    "industryTrends" JSONB,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastResearchSync" TIMESTAMP(3),
    "mediaBalanceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "mediaPostRatio" INTEGER NOT NULL DEFAULT 60,
    "educationalMediaRatio" INTEGER NOT NULL DEFAULT 50,
    "engagementMediaRatio" INTEGER NOT NULL DEFAULT 30,
    "socialProofMediaRatio" INTEGER NOT NULL DEFAULT 80,
    "promotionalMediaRatio" INTEGER NOT NULL DEFAULT 70,
    "prioritizeExpiringMedia" BOOLEAN NOT NULL DEFAULT true,
    "expiryWarningDays" INTEGER NOT NULL DEFAULT 7,
    "dataSources" JSONB,
    "lastAnalyzedAt" TIMESTAMP(3),
    "analysisVersion" INTEGER NOT NULL DEFAULT 1,
    "aiAnalysis" JSONB,
    "aiConfidenceScore" DOUBLE PRECISION,
    "extractedIndustries" JSONB,
    "extractedServices" JSONB,
    "extractedUSPs" JSONB,
    "extractedAudience" JSONB,
    "extractedVoice" JSONB,
    "extractedSAContext" JSONB,
    "industriesConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "servicesConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "uspsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "audienceConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "voiceConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "primaryBusinessGoal" TEXT,
    "secondaryGoals" TEXT[],
    "generatedContentMix" JSONB,
    "generatedThemes" JSONB,
    "generatedTopics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyIntelligence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ContentPillar" (
    "id" TEXT NOT NULL,
    "intelligenceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "topics" TEXT[],
    "keywords" TEXT[],
    "contentTypes" TEXT[],
    "frequencyWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "preferredDays" TEXT[],
    "totalPosts" INTEGER NOT NULL DEFAULT 0,
    "avgEngagement" DOUBLE PRECISION,
    "lastUsed" TIMESTAMP(3),
    "performanceTrend" TEXT,
    "bestPerformingType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPillar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Competitor" (
    "id" TEXT NOT NULL,
    "intelligenceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "linkedinUrl" TEXT,
    "facebookUrl" TEXT,
    "websiteUrl" TEXT,
    "postingFrequency" TEXT,
    "avgEngagement" DOUBLE PRECISION,
    "followerCount" INTEGER,
    "topContentTypes" TEXT[],
    "topHashtags" TEXT[],
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "lastAnalyzed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "IndustryBenchmark" (
    "id" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "recommendedPostsPerWeek" INTEGER NOT NULL DEFAULT 4,
    "optimalPostsMin" INTEGER NOT NULL DEFAULT 3,
    "optimalPostsMax" INTEGER NOT NULL DEFAULT 5,
    "bestDays" TEXT[],
    "bestTimes" JSONB NOT NULL,
    "platformPriority" JSONB NOT NULL,
    "suggestedThemes" JSONB NOT NULL,
    "topHashtags" TEXT[],
    "seoKeywords" TEXT[],
    "recommendedTone" TEXT NOT NULL DEFAULT 'professional',
    "humorAppropriate" BOOLEAN NOT NULL DEFAULT true,
    "avgEngagementRate" DOUBLE PRECISION,
    "contentMixRecommendation" JSONB,
    "growthBenchmarks" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndustryBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ContentQueueItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "hashtags" TEXT[],
    "keywords" TEXT[],
    "platformId" TEXT NOT NULL,
    "suggestedDate" TIMESTAMP(3) NOT NULL,
    "suggestedTime" TEXT NOT NULL,
    "pillar" TEXT,
    "contentType" TEXT,
    "tone" TEXT,
    "includesHumor" BOOLEAN NOT NULL DEFAULT false,
    "hook" TEXT,
    "engagementPrediction" TEXT,
    "predictedScore" DOUBLE PRECISION,
    "suggestedMedia" TEXT,
    "generationContext" JSONB,
    "status" "QueueStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "generatedPostId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "License_licenseKeyHash_key" ON "License"("licenseKeyHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompanyDocument_companyId_idx" ON "CompanyDocument"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSettings_companyId_key" ON "ContentSettings"("companyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Media_companyId_createdAt_idx" ON "Media"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Media_companyId_isUsed_expiresAt_idx" ON "Media"("companyId", "isUsed", "expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Media_companyId_autoSelect_isUsed_idx" ON "Media"("companyId", "autoSelect", "isUsed");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GeneratedPost_companyId_status_idx" ON "GeneratedPost"("companyId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GeneratedPost_platformId_scheduledFor_idx" ON "GeneratedPost"("platformId", "scheduledFor");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GeneratedPost_status_scheduledFor_idx" ON "GeneratedPost"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GeneratedPost_bulkScheduleId_idx" ON "GeneratedPost"("bulkScheduleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GeneratedPost_externalPostId_idx" ON "GeneratedPost"("externalPostId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GeneratedPost_pillar_idx" ON "GeneratedPost"("pillar");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GeneratedPost_contentType_idx" ON "GeneratedPost"("contentType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GeneratedPost_publishedAt_idx" ON "GeneratedPost"("publishedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PostMedia_postId_idx" ON "PostMedia"("postId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PostMedia_mediaId_idx" ON "PostMedia"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "PostMedia_postId_mediaId_key" ON "PostMedia"("postId", "mediaId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BulkSchedule_companyId_idx" ON "BulkSchedule"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyIntelligence_companyId_key" ON "CompanyIntelligence"("companyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContentPillar_intelligenceId_idx" ON "ContentPillar"("intelligenceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Competitor_intelligenceId_idx" ON "Competitor"("intelligenceId");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryBenchmark_industry_key" ON "IndustryBenchmark"("industry");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "IndustryBenchmark_industry_idx" ON "IndustryBenchmark"("industry");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContentQueueItem_companyId_status_idx" ON "ContentQueueItem"("companyId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContentQueueItem_platformId_idx" ON "ContentQueueItem"("platformId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContentQueueItem_suggestedDate_idx" ON "ContentQueueItem"("suggestedDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContentQueueItem_contentType_idx" ON "ContentQueueItem"("contentType");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Platform" ADD CONSTRAINT "Platform_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSettings" ADD CONSTRAINT "ContentSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedPost" ADD CONSTRAINT "GeneratedPost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedPost" ADD CONSTRAINT "GeneratedPost_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMedia" ADD CONSTRAINT "PostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "GeneratedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMedia" ADD CONSTRAINT "PostMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyIntelligence" ADD CONSTRAINT "CompanyIntelligence_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPillar" ADD CONSTRAINT "ContentPillar_intelligenceId_fkey" FOREIGN KEY ("intelligenceId") REFERENCES "CompanyIntelligence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_intelligenceId_fkey" FOREIGN KEY ("intelligenceId") REFERENCES "CompanyIntelligence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentQueueItem" ADD CONSTRAINT "ContentQueueItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentQueueItem" ADD CONSTRAINT "ContentQueueItem_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

