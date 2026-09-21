// apps/web/src/app/api/admin/dedication-test/route.ts
// Temporary diagnostic endpoint for Ship B3c. Runs the AI dedication
// pipeline in isolation and returns the full trace so we can see exactly
// what the Groq call did.
//
// Guarded by ADMIN_API_KEY header. Remove once B3c diagnosis is complete.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDedicationForHolidayWithTrace } from "@/lib/ai/dedication";
import { getTemplateMood } from "@/lib/templates/colors";

export const runtime = "nodejs";

interface TestBody {
  companyId?: string;
  holidayName?: string;
  holidayDescription?: string;
  holidayTone?: string;
  templateId?: string | null;
  skipCache?: boolean;
}

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;

  if (!expected || adminKey !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: TestBody = await request.json().catch(() => ({}));

  const {
    companyId,
    holidayName,
    holidayDescription,
    holidayTone,
    templateId,
    skipCache,
  } = body;

  if (!companyId || !holidayName || !holidayDescription) {
    return NextResponse.json(
      {
        error:
          "companyId, holidayName, holidayDescription are required in the JSON body",
      },
      { status: 400 }
    );
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { intelligence: true },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  // Optionally clear the cached dedication so we force a fresh Groq call
  if (skipCache) {
    await prisma.holidayDedication.deleteMany({
      where: { companyId, holidayName },
    });
    console.log("[dedication-test] cleared cache", { companyId, holidayName });
  }

  const intel = company.intelligence;

  const { text, trace } = await getDedicationForHolidayWithTrace({
    companyId,
    companyName: company.name,
    industry: company.industry,
    companyDescription: company.description,
    intelligence: intel
      ? {
          brandVoice: intel.brandVoice,
          brandPersonality: intel.brandPersonality,
          uniqueSellingPoints: intel.uniqueSellingPoints,
          targetAudience: intel.targetAudience,
          communityFocus: intel.communityFocus,
          primaryBusinessGoal: intel.primaryBusinessGoal,
          primaryKeywords: intel.primaryKeywords,
          defaultTone: intel.defaultTone,
        }
      : null,
    holidayName,
    holidayDescription,
    holidayTone,
    templateId: templateId || null,
    templateMood: getTemplateMood(templateId || null),
  });

  return NextResponse.json({
    ok: true,
    text,
    trace,
    input: {
      companyId,
      companyName: company.name,
      industry: company.industry,
      hasIntelligence: !!intel,
      holidayName,
      holidayDescription,
      holidayTone,
      templateId: templateId || null,
      templateMood: getTemplateMood(templateId || null),
    },
    env: {
      hasGroqKey: !!process.env.GROQ_API_KEY,
      groqKeyLength: process.env.GROQ_API_KEY?.length || 0,
      groqKeyPrefix: process.env.GROQ_API_KEY?.slice(0, 8) || null,
      hasAdminKey: !!process.env.ADMIN_API_KEY,
    },
  });
}