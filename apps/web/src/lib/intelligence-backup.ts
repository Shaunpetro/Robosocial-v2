// apps/web/src/lib/intelligence-backup.ts
import { prisma } from "@/lib/db";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getStorageHeaders() {
  return {
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    apikey: SUPABASE_SERVICE_ROLE_KEY,
  };
}

export interface CompanyIntelligenceSnapshot {
  company: {
    id: string;
    name: string;
    website: string | null;
    industry: string | null;
    description: string | null;
    logoUrl: string | null;
  };
  intelligence: any;
  pillars: any[];
  competitors: any[];
  contentSettings: any;
  platforms: {
    id: string;
    type: string;
    name: string;
    username: string | null;
    isConnected: boolean;
  }[];
}

/**
 * Gather all intelligence-related data for a single company.
 */
export async function gatherCompanyIntelligence(companyId: string): Promise<CompanyIntelligenceSnapshot | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      intelligence: {
        include: {
          contentPillars: true,
          competitors: true,
        },
      },
      contentSettings: true,
      platforms: {
        select: {
          id: true,
          type: true,
          name: true,
          username: true,
          isConnected: true,
        },
      },
    },
  });

  if (!company) return null;

  return {
    company: {
      id: company.id,
      name: company.name,
      website: company.website,
      industry: company.industry,
      description: company.description,
      logoUrl: company.logoUrl,
    },
    intelligence: company.intelligence || null,
    pillars: company.intelligence?.contentPillars || [],
    competitors: company.intelligence?.competitors || [],
    contentSettings: company.contentSettings || null,
    platforms: company.platforms,
  };
}

/**
 * Upload a JSON file to Supabase Storage.
 * Bucket must already exist: `intelligence-snapshots` and `intelligence-summaries`.
 */
async function uploadToStorage(bucket: string, path: string, data: any): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase environment variables missing");
  }

  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...getStorageHeaders(),
      "x-upsert": "true",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload to ${bucket}/${path} failed: ${text}`);
  }
}

/**
 * List files in a Supabase Storage folder and delete those beyond retention.
 */
async function pruneOldFiles(bucket: string, prefix: string, keepCount: number): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;

  const listUrl = `${SUPABASE_URL}/storage/v1/object/list/${bucket}?prefix=${prefix}`;
  const listRes = await fetch(listUrl, {
    headers: getStorageHeaders(),
  });

  if (!listRes.ok) return;

  const files = (await listRes.json()) as { name: string }[];
  const sorted = files
    .map((f) => f.name)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .reverse();

  const toDelete = sorted.slice(keepCount);
  for (const fileName of toDelete) {
    const deleteUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${prefix}${fileName}`;
    await fetch(deleteUrl, {
      method: "DELETE",
      headers: getStorageHeaders(),
    });
  }
}

/**
 * Main function: perform daily full snapshot and weekly summary for all companies.
 */
export async function runIntelligenceBackup(): Promise<{ companies: number; errors: string[] }> {
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
  });

  const errors: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const weekNumber = getWeekNumber(new Date());
  const year = new Date().getFullYear();

  for (const company of companies) {
    try {
      const snapshot = await gatherCompanyIntelligence(company.id);
      if (!snapshot) continue;

      // Daily full snapshot
      const dailyPath = `${company.id}/daily/${today}.json`;
      await uploadToStorage("intelligence-snapshots", dailyPath, snapshot);

      // Keep last 7 daily files
      await pruneOldFiles("intelligence-snapshots", `${company.id}/daily/`, 7);

      // Weekly snapshot (on Sundays)
      const dayOfWeek = new Date().getDay();
      if (dayOfWeek === 0) {
        const weeklyPath = `${company.id}/weekly/${today}.json`;
        await uploadToStorage("intelligence-snapshots", weeklyPath, snapshot);

        // Keep last 3 weekly files
        await pruneOldFiles("intelligence-snapshots", `${company.id}/weekly/`, 3);
      }

      // Weekly lightweight summary (always)
      const summary = buildLightweightSummary(snapshot);
      const summaryPath = `${company.id}/${year}-W${weekNumber}.json`;
      await uploadToStorage("intelligence-summaries", summaryPath, summary);

      // Keep last 52 summaries
      await pruneOldFiles("intelligence-summaries", `${company.id}/`, 52);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${company.name}: ${message}`);
    }
  }

  return { companies: companies.length, errors };
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function buildLightweightSummary(snapshot: CompanyIntelligenceSnapshot) {
  return {
    companyId: snapshot.company.id,
    companyName: snapshot.company.name,
    industry: snapshot.company.industry,
    postsPerWeek: snapshot.intelligence?.postsPerWeek || null,
    primaryGoals: snapshot.intelligence?.primaryGoals || [],
    targetAudience: snapshot.intelligence?.targetAudience || null,
    brandVoice: snapshot.intelligence?.brandVoice || null,
    learnedBestDays: snapshot.intelligence?.learnedBestDays || [],
    learnedBestTimes: snapshot.intelligence?.learnedBestTimes || null,
    learnedBestPillars: snapshot.intelligence?.learnedBestPillars || null,
    topPerformingTypes: snapshot.intelligence?.topPerformingTypes || null,
    topPerformingTopics: snapshot.intelligence?.topPerformingTopics || null,
    avgEngagementRate: snapshot.intelligence?.avgEngagementRate || null,
    contentMix: snapshot.intelligence?.generatedContentMix || null,
    activePillars: snapshot.pillars
      .filter((p) => p.isActive)
      .map((p) => ({ name: p.name, topics: p.topics, contentTypes: p.contentTypes })),
  };
}